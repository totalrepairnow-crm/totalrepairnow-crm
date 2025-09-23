// /home/crmadmin/crm_app/backend/routes/invoices.js
'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { streamInvoicePdf, renderInvoicePdfBuffer } = require('../lib/pdfkit-invoice');
const { sendInvoiceEmail } = require('../lib/mailer');

// ---------- Helpers ----------
const num = (x, d = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
};
const ensureArray = (a) => (Array.isArray(a) ? a : a == null ? [] : [a]);
const sanitizeIds = (arr) =>
  ensureArray(arr).map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);

function normalizeItems(rawItems) {
  const items = [];
  for (const it of ensureArray(rawItems)) {
    if (!it) continue;
    const q = num(it.quantity, 1);
    const p = num(it.unit_price, 0);
    const desc = String(it.description || '').trim() || (it.service_id ? `Service #${it.service_id}` : 'Service');
    const sid = it.service_id ? Number(it.service_id) : null;
    items.push({ service_id: sid, description: desc, quantity: q, unit_price: p });
  }
  return items;
}

async function nextInvoiceNo(client) {
  // Usa secuencia si existe:
  try {
    const { rows } = await client.query('SELECT nextval(\'invoice_no_seq\') AS seq');
    return String(rows[0].seq);
  } catch (_) {
    // Fallback simple YYYYMMDDHHmmss
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return [
      d.getFullYear(),
      pad(d.getMonth() + 1),
      pad(d.getDate()),
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds()),
    ].join('');
  }
}

async function buildInvoicePayload(invoiceId) {
  const { rows: invRows } = await pool.query(
    `SELECT i.*, c.name AS client_name,
            NULLIF(TRIM(c.email),'') AS client_email,
            NULLIF(TRIM(c.phone),'') AS client_phone
       FROM invoices i
  LEFT JOIN clients c ON c.id = i.client_id
      WHERE i.id = $1`,
    [invoiceId]
  );
  if (invRows.length === 0) return null;
  const inv = invRows[0];

  const { rows: lines } = await pool.query(
    `SELECT id, service_id, description, quantity, unit_price, line_total
       FROM invoice_lines
      WHERE invoice_id = $1
   ORDER BY id ASC`,
    [invoiceId]
  );

  const toParts = [];
  if (inv.client_name) toParts.push(inv.client_name);
  if (inv.client_email) toParts.push(inv.client_email);
  if (inv.client_phone) toParts.push(inv.client_phone);

  return {
    from: (process.env.BRAND_NAME || 'Total Repair Now') + '\n' + (process.env.BRAND_TAGLINE || 'CRM'),
    to: `\n${toParts.join('\n')}`,
    number: inv.invoice_no,
    currency: inv.currency || 'USD',
    items: lines.map((ln) => ({
      name: ln.description || (ln.service_id ? `Service #${ln.service_id}` : 'Service'),
      quantity: num(ln.quantity, 1),
      unit_cost: num(ln.unit_price, 0),
    })),
    tax: num(inv.tax, 0),             // %
    discounts: num(inv.discount, 0),  // monto
    fields: { tax: 'Tax', discounts: 'Discount' },
    meta: { invoice_date: inv.created_at }
  };
}

// ---------- Routes ----------
router.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * POST /invoices/draft
 * Acepta:
 *  - { client_id, service_ids:[...] , discount, tax, currency }
 *  - { items:[{service_id?, description, quantity, unit_price}, ...], discount, tax, currency }
 */
router.post('/draft', async (req, res) => {
  try {
    const { client_id, service_ids, items: rawItems, discount = 0, tax = 0, currency = 'USD' } = req.body || {};

    let items = [];
    if (rawItems && Array.isArray(rawItems) && rawItems.length) {
      items = normalizeItems(rawItems);
    } else {
      const cid = Number(client_id);
      const ids = sanitizeIds(service_ids);
      if (!cid || ids.length === 0) {
        return res.status(400).json({ error: 'client_id/service_ids or items[] are required' });
      }

      const { rows } = await pool.query(
        `SELECT id, client_id,
                COALESCE(description, service_name) AS description,
                COALESCE(quantity,1) AS quantity,
                COALESCE(unit_price,0) AS unit_price,
                status
           FROM services
          WHERE id = ANY($1) AND client_id = $2`,
        [ids, cid]
      );

      // Filtra facturables (ajusta lista si quieres)
      const fact = rows.filter((r) => !r.status || ['pending','approved','ready','done','scheduled'].includes(String(r.status).toLowerCase()));
      if (fact.length === 0) return res.status(400).json({ error: 'No billable services' });

      items = fact.map((r) => ({
        service_id: r.id,
        description: r.description || `Service #${r.id}`,
        quantity: num(r.quantity, 1),
        unit_price: num(r.unit_price, 0),
      }));
    }

    const subtotal = items.reduce((a, it) => a + num(it.quantity, 1) * num(it.unit_price, 0), 0);
    const disc = num(discount, 0);
    const taxPct = num(tax, 0);
    const base = Math.max(0, subtotal - disc);
    const taxAmt = base * (taxPct / 100);
    const total = base + taxAmt;

    return res.json({
      currency,
      subtotal,
      discount: disc,
      tax: taxPct,
      tax_amount: Number(taxAmt.toFixed(2)),
      total: Number(total.toFixed(2)),
      items_count: items.length,
    });
  } catch (e) {
    console.error('draft error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /invoices/create
 * Igual que draft, pero inserta:
 *  - invoices (subtotal, discount, tax, total, currency, status)
 *  - invoice_lines (invoice_id, service_id, description, quantity, unit_price)
 *  **NO** se inserta line_total (lo calcula la DB por ser columna generada)
 */
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const { client_id, service_ids, items: rawItems, discount = 0, tax = 0, currency = 'USD' } = req.body || {};

    let items = [];
    if (rawItems && Array.isArray(rawItems) && rawItems.length) {
      items = normalizeItems(rawItems);
    } else {
      const cid = Number(client_id);
      const ids = sanitizeIds(service_ids);
      if (!cid || ids.length === 0) {
        return res.status(400).json({ error: 'client_id/service_ids or items[] are required' });
      }

      const { rows } = await client.query(
        `SELECT id, client_id,
                COALESCE(description, service_name) AS description,
                COALESCE(quantity,1) AS quantity,
                COALESCE(unit_price,0) AS unit_price,
                status
           FROM services
          WHERE id = ANY($1) AND client_id = $2
       ORDER BY id ASC`,
        [ids, cid]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Services not found for that client' });

      const fact = rows.filter((r) => !r.status || ['pending','approved','ready','done','scheduled'].includes(String(r.status).toLowerCase()));
      if (fact.length === 0) return res.status(400).json({ error: 'No billable services' });

      items = fact.map((r) => ({
        service_id: r.id,
        description: r.description || `Service #${r.id}`,
        quantity: num(r.quantity, 1),
        unit_price: num(r.unit_price, 0),
      }));
    }

    // Totales
    const subtotal = items.reduce((a, it) => a + num(it.quantity, 1) * num(it.unit_price, 0), 0);
    const disc = num(discount, 0);
    const taxPct = num(tax, 0);
    const base = Math.max(0, subtotal - disc);
    const taxAmt = base * (taxPct / 100);
    const total = base + taxAmt;

    await client.query('BEGIN');

    const invoice_no = await nextInvoiceNo(client);

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices (invoice_no, client_id, currency, subtotal, discount, tax, total, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'created', NOW())
       RETURNING id, invoice_no`,
      [invoice_no, client_id || null, currency, subtotal, disc, taxPct, total]
    );
    const invId = invRows[0].id;

    // ------ INSERT invoice_lines ------
    // IMPORTANT: NO ponemos "line_total" (columna generada)
    if (items.length) {
      const cols = ['invoice_id', 'service_id', 'description', 'quantity', 'unit_price'];
      const values = [];
      const params = [];
      let p = 1;

      for (const it of items) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
          invId,
          it.service_id || null,
          it.description || (it.service_id ? `Service #${it.service_id}` : 'Service'),
          num(it.quantity, 1),
          num(it.unit_price, 0)
        );
      }

      await client.query(
        `INSERT INTO invoice_lines (${cols.join(',')})
         VALUES ${values.join(',')}`,
        params
      );
    }

    await client.query('COMMIT');
    return res.json({ id: invId, invoice_no });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('create error:', e);
    return res.status(500).json({ error: 'Internal error' });
  } finally {
    client.release();
  }
});

// GET /invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    const { rows: inv } = await pool.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (inv.length === 0) return res.status(404).json({ error: 'Not found' });

    const { rows: lines } = await pool.query(
      `SELECT id, service_id, description, quantity, unit_price, line_total
         FROM invoice_lines
        WHERE invoice_id = $1
     ORDER BY id ASC`,
      [id]
    );

    res.json({ ...inv[0], lines });
  } catch (e) {
    console.error('get invoice error:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /invoices/:id/pdf  (soporta ?debug=1 & ?download=1)
router.get('/:id/pdf', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    const payload = await buildInvoicePayload(id);
    if (!payload) return res.status(404).json({ error: 'Not found' });

    if (String(req.query.debug || '') === '1') {
      return res.json({ payload });
    }

    const disposition = String(req.query.download || '') === '1' ? 'attachment' : 'inline';
    res.setHeader('X-Invoice-Engine', 'internal');
    if (!res.getHeader('Content-Disposition')) {
      const fname = `Invoice-${payload.number || id}.pdf`;
      res.setHeader('Content-Disposition', `${disposition}; filename="${fname}"`);
    }
    return streamInvoicePdf(payload, res, { disposition }); // tu helper existente
  } catch (e) {
    console.error('pdf error:', e);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

// POST /invoices/:id/email  {to, subject?, message?}
router.post('/:id/email', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });
    const { to, cc, subject, message } = req.body || {};
    if (!to) return res.status(400).json({ error: '"to" is required' });

    const payload = await buildInvoicePayload(id);
    if (!payload) return res.status(404).json({ error: 'Not found' });

    const pdfBuffer = await renderInvoicePdfBuffer(payload); // tu helper existente
    const filename = `Invoice-${payload.number || id}.pdf`;

    const resp = await sendInvoiceEmail({
      to,
      cc,
      subject: subject || `Invoice ${payload.number || id}`,
      message: message || 'Please find your invoice attached.',
      pdfBuffer,
      filename,
    });

    return res.json({ ok: true, engine: resp.engine, status: resp.respCode || resp.messageId || 200 });
  } catch (e) {
    console.error('email invoice error:', e);
    res.status(500).json({ error: 'Email send failed' });
  }
});

module.exports = router;
