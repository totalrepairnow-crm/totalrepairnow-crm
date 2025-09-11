/**
 * ~/crm_app/backend/routes/clients.js
 * Listado con búsqueda (q), paginación (page/limit) y ORDENAMIENTO (sort/dir).
 * sort: id|first_name|last_name|email|phone|created_at
 * dir: asc|desc
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

// --- util: parse número con mínimos y máximos
function parsePositiveInt(v, def, min, max) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n) || n < (min ?? 1)) return def;
  if (max && n > max) return max;
  return n;
}

// --- GET /api/clients
router.get('/', async (req, res) => {
  try {
    const rawQ = (req.query.q || '').trim();
    const page  = parsePositiveInt(req.query.page, 1, 1, 1000000);
    const limit = parsePositiveInt(req.query.limit, 10, 1, 100);

    // Ordenamiento seguro (whitelist)
    const ALLOWED = new Set(['id','first_name','last_name','email','phone','created_at']);
    const sortParam = String(req.query.sort || 'created_at').toLowerCase();
    const sortCol = ALLOWED.has(sortParam) ? sortParam : 'created_at';
    const dirParam = String(req.query.dir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Búsqueda
    const params = [];
    const whereParts = [];
    if (rawQ) {
      params.push(`%${rawQ}%`);
      whereParts.push(
        `(
          (COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) ILIKE $${params.length}
          OR email ILIKE $${params.length}
          OR phone ILIKE $${params.length}
        )`
      );
    }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Conteo total
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*)::int AS total FROM clients ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    // Página y offset
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const p = Math.min(page, totalPages);
    const offset = (p - 1) * limit;

    // LIMIT/OFFSET índices paramétricos
    const limitIdx  = params.length + 1;
    const offsetIdx = params.length + 2;

    // ORDER BY (columna/sentido validados arriba)
    const orderClause = `ORDER BY ${sortCol} ${dirParam}, id DESC`;

    // Items
    const { rows: items } = await db.query(
      `
        SELECT id, first_name, last_name, email, phone, created_at
        FROM clients
        ${where}
        ${orderClause}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      [...params, limit, offset]
    );

    return res.json({
      items,
      page: p,
      limit,
      total,
      totalPages,
      hasPrev: p > 1,
      hasNext: p < totalPages,
      q: rawQ,
      sort: sortCol,
      dir: dirParam,
    });
  } catch (e) {
    console.error('GET /api/clients failed:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// --- GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });

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

// --- POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { first_name = null, last_name = null, email = null, phone = null } = req.body || {};
    const { rows } = await db.query(
      `
        INSERT INTO clients (first_name, last_name, email, phone)
        VALUES ($1,$2,$3,$4)
        RETURNING id, first_name, last_name, email, phone, created_at
      `,
      [first_name, last_name, email, phone]
    );
    return res.json(rows[0]);
  } catch (e) {
    console.error('POST /api/clients failed:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
