// ~/crm_app/backend/routes/clients.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/clients
 * Query:
 *   q      -> string (nombre completo, email, phone, id)
 *   page   -> number (1..N, default 1)
 *   limit  -> number (1..100, default 10)
 */
router.get('/', async (req, res) => {
  try {
    const rawQ    = (req.query.q || '').toString().trim();
    const rawPage = parseInt(req.query.page, 10);
    const rawLim  = parseInt(req.query.limit, 10);

    const page  = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLim)  && rawLim  > 0 ? Math.min(rawLim, 100) : 10;
    const offset = (page - 1) * limit;

    const params = [];
    let where = '';
    if (rawQ) {
      params.push(`%${rawQ}%`);
      where = `
        WHERE
          (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) ILIKE $1
          OR email ILIKE $1
          OR phone ILIKE $1
          OR CAST(id AS TEXT) ILIKE $1
      `;
    }

    // total filtrado
    const { rows: cr } = await db.query(
      `SELECT COUNT(*)::int AS total FROM clients ${where}`,
      params
    );
    const total = cr[0]?.total ?? 0;

    // página
    const { rows: items } = await db.query(
      `
        SELECT id, first_name, last_name, email, phone, created_at
        FROM clients
        ${where}
        ORDER BY id DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
      [...params, limit, offset]
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({
      items,
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: offset + items.length < total,
      q: rawQ
    });
  } catch (e) {
    console.error('GET /api/clients failed:', e);
    // fallback seguro para no tirar el server
    return res.json({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false
    });
  }
});

/**
 * GET /api/clients/:id  (detalle)
 */
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { rows } = await db.query(
      `SELECT id, first_name, last_name, email, phone, created_at
       FROM clients
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (e) {
    console.error('GET /api/clients/:id failed:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/clients  (crear)
 * body: { first_name, last_name, email, phone }
 */
router.post('/', async (req, res) => {
  try {
    const { first_name = null, last_name = null, email = null, phone = null } = req.body || {};

    const { rows } = await db.query(
      `INSERT INTO clients (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, phone, created_at`,
      [first_name, last_name, email, phone]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error('POST /api/clients failed:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
