const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/services
 * Query:
 *   page  -> number (1..N, default 1)
 *   limit -> number (1..100, default 10)
 */
router.get('/', async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page, 10);
    const rawLim  = parseInt(req.query.limit, 10);

    const page  = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLim)  && rawLim  > 0 ? Math.min(rawLim, 100) : 10;
    const offset = (page - 1) * limit;

    // ¿Existe la tabla services?
    const { rows: chk } = await db.query(`SELECT to_regclass('public.services') IS NOT NULL AS exists`);
    if (!chk[0]?.exists) {
      return res.json({ items: [], page, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
    }

    const { rows: cr } = await db.query(`SELECT COUNT(*)::int AS total FROM services`);
    const total = cr[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    const { rows: items } = await db.query(
      `SELECT * FROM services ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.json({ items, page, limit, total, totalPages, hasPrev, hasNext });
  } catch (e) {
    console.error('GET /api/services failed:', e);
    // fallback que evita 502
    return res.json({ items: [], page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
  }
});

/**
 * GET /api/services/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { rows: chk } = await db.query(`SELECT to_regclass('public.services') IS NOT NULL AS exists`);
    if (!chk[0]?.exists) return res.status(404).json({ error: 'Not found' });

    const { rows } = await db.query(`SELECT * FROM services WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    return res.json(rows[0]);
  } catch (e) {
    console.error('GET /api/services/:id failed:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
