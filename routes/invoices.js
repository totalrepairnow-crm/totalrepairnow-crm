// /home/crmadmin/crm_app/backend/routes/invoices.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db'); // usa el pool existente

// --- Utils ---
function toNumber(x, def = 0) {
  if (x === null || x === undefined) return def;
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

// Construye el payload para invoice-generator.com
async function buildPayload(invoiceId) {
  // 1) Carga factura
  const invSQL = `
    SELECT id, invoice_no, client_id, currency, subtotal, discount, tax, total, status, created_at
    FROM invoices
    WHERE id = $1
  `;
  const invRes = await db.query(invSQL, [invoiceId]);
  if (!invRes.rows.length) {
    const err = new Error('Invoice not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const inv = invRes.rows[0];

  // 2) Cliente (sin address)
  const cliSQL = `SELECT id, name, email, phone FROM clients WHERE id = $1`;
  const cliRes = await db.query(cliSQL, [inv.client_id]);
  const cli = cliRes.rows[0] || { name: 'Client' };

  // 3) Líneas
  const linesSQL = `
    SELECT id, invoice_id, service_id, description, quantity, unit_price, line_total
    FROM invoice_lines
    WHERE invoice_id = $1
    ORDER BY id
  `;
  const linesRes = await db.query(linesSQL, [invoiceId]);
  const lines = linesRes.rows || [];

  // 4) Arma destinatario "to"
  const toParts = [cli.name];
  if (cli.email) toParts.push(cli.email);
  if (cli.phone) toParts.push(cli.phone);
  const toField = toParts.join('\n');

  // 5) Items para invoice-generator
  const items = lines.map(l => ({
    name: l.description || 'Service',
    quantity: toNumber(l.quantity, 0),
    unit_cost: toNumber(l.unit_price, 0)
  }));

  // 6) Campos numéricos que entiende el proveedor
  const tax = toNumber(inv.tax, 0);
  const discounts = toNumber(inv.discount, 0);

  // 7) Payload mínimo válido
  const payload = {
    from: 'Total Repair Now\nCRM',
    to: toField || 'Client',
    number: String(inv.invoice_no || invoiceId),
    currency: inv.currency || 'USD',
    items,
    tax,
    discounts,
    fields: {
      tax: 'Tax',
      discounts: 'Discount'
    }
  };

  return { payload, invoice: inv, client: cli, lines };
}

// --- Rutas ---

// Health
router.get('/health', (_req, res) => res.json({ ok: true }));

// GET /api/invoices/:id  -> detalle + líneas
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const invSQL = `
      SELECT id, invoice_no, client_id, currency, subtotal, discount, tax, total, status, created_at
      FROM invoices
      WHERE id = $1
    `;
    const invRes = await db.query(invSQL, [id]);
    if (!invRes.rows.length) return res.status(404).json({ error: 'Not found' });
    const inv = invRes.rows[0];

    const linesSQL = `
      SELECT id, invoice_id, service_id, description, quantity, unit_price, line_total
      FROM invoice_lines
      WHERE invoice_id = $1
      ORDER BY id
    `;
    const linesRes = await db.query(linesSQL, [id]);

    res.json({ ...inv, lines: linesRes.rows || [] });
  } catch (err) {
    console.error('GET /invoices/:id ERROR:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/invoices/:id/pdf[?debug=1][&upstream=1]
router.get('/:id/pdf', async (req, res) => {
  const id = Number(req.params.id);
  const debug = String(req.query.debug || '') === '1';
  const forceUpstream = String(req.query.upstream || '') === '1';

  try {
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { payload, invoice } = await buildPayload(id);

    // Modo debug: NO llama al proveedor, solo muestra el JSON que enviaríamos.
    if (debug) return res.json({ payload });

    // Llamada real al proveedor (o si se fuerza con upstream=1)
    const API_KEY = process.env.INVOICEGEN_API_KEY || '';
    if (!API_KEY) {
      console.error('invoices.pdf ERROR: Missing INVOICEGEN_API_KEY');
      return res.status(500).json({ error: 'Internal error generating PDF' });
    }

    const upstreamURL = 'https://invoice-generator.com';
    const r = await axios.post(upstreamURL, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/pdf'
      },
      responseType: 'arraybuffer',
      timeout: 15000
    });

    if (r.status !== 200 || !r.data) {
      console.error('invoices.pdf upstream not OK:', r.status, r.data?.toString?.());
      return res.status(502).json({ error: 'Upstream PDF error' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoice_no || id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(r.data));
  } catch (err) {
    // Si el proveedor devolvió JSON de error, intentalo exponer en logs
    if (err.response) {
      const status = err.response.status;
      const detail = Buffer.isBuffer(err.response.data)
        ? err.response.data.toString('utf8')
        : (typeof err.response.data === 'object'
            ? JSON.stringify(err.response.data)
            : String(err.response.data || ''));

      console.error('GET /invoices/:id/pdf UPSTREAM ERROR:', status, detail);
      return res.status(500).json({ error: 'Internal error generating PDF' });
    }

    console.error('GET /invoices/:id/pdf ERROR:', err);
    res.status(500).json({ error: 'Internal error generating PDF' });
  }
});

module.exports = router;
