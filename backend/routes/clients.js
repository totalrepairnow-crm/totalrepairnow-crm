// ~/crm_app/backend/routes/clients.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Debe exportar { query }

// Helpers
function toInt(v, d = 1) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
function toLimit(v) { const n = toInt(v, 10); return Math.min(Math.max(n, 1), 100); }
const fullNameExpr = `concat_ws(' ', coalesce(first_name,''), coalesce(last_name,''))`;

// Lista con filtros básicos
// GET /api/clients?q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q = '', page = '1', limit = '10' } = req.query;
    const pg = Math.max(toInt(page, 1), 1);
    const lm = toLimit(limit);
    const off = (pg - 1) * lm;

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(
        (name ILIKE $${params.length}) OR
        (${fullNameExpr} ILIKE $${params.length}) OR
        (email ILIKE $${params.length}) OR
        (phone ILIKE $${params.length}) OR
        (phone_home ILIKE $${params.length}) OR
        (phone_mobile ILIKE $${params.length})
      )`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const csql = `SELECT COUNT(*)::int AS c FROM clients ${whereSql}`;
    const { rows: crows } = await db.query(csql, params);
    const total = crows[0]?.c || 0;

    const dsql = `
      SELECT
        id,
        COALESCE(NULLIF(name,''), ${fullNameExpr}) AS name,
        first_name, last_name,
        email,
        COALESCE(phone_mobile, phone_home, phone) AS phone,
        phone_home, phone_mobile,
        address_line1, address_line2, city, state, postal_code, country,
        warranty_company, lead_source, referred_by,
        created_at
      FROM clients
      ${whereSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ${lm} OFFSET ${off}
    `;
    const { rows } = await db.query(dsql, params);

    res.json({
      page: pg,
      limit: lm,
      total,
      totalPages: Math.max(Math.ceil(total / lm), 1),
      hasPrev: pg > 1,
      hasNext: off + rows.length < total,
      items: rows,
    });
  } catch (err) {
    console.error('GET /clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        id,
        COALESCE(NULLIF(name,''), ${fullNameExpr}) AS name,
        first_name, last_name,
        email,
        COALESCE(phone_mobile, phone_home, phone) AS phone,
        phone_home, phone_mobile,
        address_line1, address_line2, city, state, postal_code, country,
        warranty_company, lead_source, referred_by,
        created_at
      FROM clients
      WHERE id = $1
    `;
    const { rows } = await db.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /clients/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/clients
// body: { first_name, last_name, email?, phone_home?, phone_mobile?,
//         address_line1?, address_line2?, city?, state?, postal_code?, country?,
//         warranty_company?, lead_source?, referred_by? }
router.post('/', async (req, res) => {
  try {
    const {
      first_name = '', last_name = '',
      email = '',
      phone_home = null, phone_mobile = null,
      address_line1 = null, address_line2 = null, city = null, state = null, postal_code = null, country = null,
      warranty_company = null, lead_source = null, referred_by = null,
      name   // opcional para compatibilidad
    } = req.body || {};

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'first_name and last_name are required' });
    }
    const computedName = (name && String(name).trim()) || `${first_name} ${last_name}`.trim();
    const phone = phone_mobile || phone_home || null;

    const sql = `
      INSERT INTO clients
        (name, first_name, last_name, email, phone, phone_home, phone_mobile,
         address_line1, address_line2, city, state, postal_code, country,
         warranty_company, lead_source, referred_by)
      VALUES
        ($1,   $2,         $3,        $4,    $5,    $6,         $7,
         $8,            $9,            $10,  $11,   $12,         $13,
         $14,             $15,        $16)
      RETURNING
        id,
        COALESCE(NULLIF(name,''), ${fullNameExpr}) AS name,
        first_name, last_name, email,
        COALESCE(phone_mobile, phone_home, phone) AS phone,
        phone_home, phone_mobile,
        address_line1, address_line2, city, state, postal_code, country,
        warranty_company, lead_source, referred_by,
        created_at
    `;
    const params = [
      computedName, first_name, last_name, email, phone, phone_home, phone_mobile,
      address_line1, address_line2, city, state, postal_code, country,
      warranty_company, lead_source, referred_by,
    ];
    const { rows } = await db.query(sql, params);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const fields = [
      'name','first_name','last_name','email',
      'phone','phone_home','phone_mobile',
      'address_line1','address_line2','city','state','postal_code','country',
      'warranty_company','lead_source','referred_by'
    ];
    const sets = [];
    const params = [];
    fields.forEach(f => {
      if (f in req.body) {
        params.push(req.body[f]);
        sets.push(`${f} = $${params.length}`);
      }
    });

    // Si actualizan first/last sin "name", recalculamos name
    const hasFirst = ('first_name' in req.body);
    const hasLast  = ('last_name'  in req.body);
    const hasName  = ('name' in req.body);
    if (!hasName && (hasFirst || hasLast)) {
      sets.push(`name = ${fullNameExpr}`);
    }

    if (!sets.length) return res.status(400).json({ error: 'No changes' });

    params.push(id);
    const sql = `
      UPDATE clients SET ${sets.join(', ')}
      WHERE id = $${params.length}
      RETURNING
        id,
        COALESCE(NULLIF(name,''), ${fullNameExpr}) AS name,
        first_name, last_name, email,
        COALESCE(phone_mobile, phone_home, phone) AS phone,
        phone_home, phone_mobile,
        address_line1, address_line2, city, state, postal_code, country,
        warranty_company, lead_source, referred_by,
        created_at
    `;
    const { rows } = await db.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /clients/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// (opcional) DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM clients WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /clients/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// *** YA EXISTE en tu backend: /api/clients/:id/services (lo añadimos en pasos previos)

module.exports = router;

