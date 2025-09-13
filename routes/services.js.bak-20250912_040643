// routes/services.js
const express = require('express');
const router = express.Router();

// El módulo ../db debe exportar un Pool de pg o algo con .query(sql, params)
const db = require('../db');

// Helpers
function toInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

// GET /api/services?client_id=&status=&q=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    const { client_id, status, q } = req.query;

    const where = [];
    const params = [];
    let p = 1;

    if (client_id) {
      where.push(`s.client_id = $${p++}`);
      params.push(Number(client_id));
    }
    if (status) {
      where.push(`s.status = $${p++}`);
      params.push(status);
    }
    if (q && q.trim()) {
      where.push(`(s.service_name ILIKE $${p} OR s.description ILIKE $${p})`);
      params.push(`%${q.trim()}%`);
      p++;
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int AS count FROM services s ${whereSQL}`;
    const countRow = await db.query(countSql, params);
    const total = countRow.rows[0]?.count || 0;

    const listSql = `
      SELECT
        s.id,
        s.client_id,
        s.service_name,
        s.description,
        s.quantity,
        s.unit_price,
        COALESCE(s.total, s.quantity * s.unit_price) AS total,
        s.status,
        s.created_at
      FROM services s
      ${whereSQL}
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT $${p++} OFFSET $${p++}
    `;
    const listParams = params.concat([limit, offset]);
    const rows = (await db.query(listSql, listParams)).rows;

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
      items: rows
    });
  } catch (err) {
    console.error('GET /services error:', err);
    res.status(500).json({ error: 'Internal error listing services' });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sql = `
      SELECT
        s.id,
        s.client_id,
        s.service_name,
        s.description,
        s.quantity,
        s.unit_price,
        COALESCE(s.total, s.quantity * s.unit_price) AS total,
        s.status,
        s.created_at
      FROM services s
      WHERE s.id = $1
    `;
    const r = await db.query(sql, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('GET /services/:id error:', err);
    res.status(500).json({ error: 'Internal error fetching service' });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const {
      client_id,
      service_name,
      description = '',
      quantity,
      unit_price,
      status = 'open'
    } = req.body || {};

    if (!client_id || !service_name || !quantity || !unit_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const qty = Number(quantity);
    const price = Number(unit_price);
    if (!(qty > 0) || !(price >= 0)) {
      return res.status(400).json({ error: 'Invalid quantity or unit_price' });
    }

    const sql = `
      INSERT INTO services
        (client_id, service_name, description, quantity, unit_price, total, status)
      VALUES ($1, $2, $3, $4, $5, $4 * $5, $6)
      RETURNING id, client_id, service_name, description, quantity, unit_price,
                total, status, created_at
    `;
    const params = [client_id, service_name, description, qty, price, status];
    const r = await db.query(sql, params);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('POST /services error:', err);
    res.status(500).json({ error: 'Internal error creating service' });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { client_id, service_name, description, quantity, unit_price, status } = req.body || {};

    // SET dinámico
    const sets = [];
    const params = [];
    let p = 1;

    if (client_id !== undefined) { sets.push(`client_id = $${p++}`); params.push(client_id); }
    if (service_name !== undefined) { sets.push(`service_name = $${p++}`); params.push(service_name); }
    if (description !== undefined) { sets.push(`description = $${p++}`); params.push(description); }
    if (quantity !== undefined) { sets.push(`quantity = $${p++}`); params.push(Number(quantity)); }
    if (unit_price !== undefined) { sets.push(`unit_price = $${p++}`); params.push(Number(unit_price)); }
    if (status !== undefined) { sets.push(`status = $${p++}`); params.push(status); }

    // Si cambian qty o price, recalcular total siempre que alguno cambie
    if (quantity !== undefined || unit_price !== undefined) {
      // usa los valores nuevos si llegan, si no, los existentes en la fila
      sets.push(`total = COALESCE($${p++}, quantity) * COALESCE($${p++}, unit_price)`);
      params.push(
        quantity !== undefined ? Number(quantity) : null,
        unit_price !== undefined ? Number(unit_price) : null
      );
    }

    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });

    const sql = `
      UPDATE services
      SET ${sets.join(', ')}
      WHERE id = $${p}
      RETURNING id, client_id, service_name, description, quantity, unit_price,
                total, status, created_at
    `;
    params.push(id);
    const r = await db.query(sql, params);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /services/:id error:', err);
    res.status(500).json({ error: 'Internal error updating service' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await db.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('DELETE /services/:id error:', err);
    res.status(500).json({ error: 'Internal error deleting service' });
  }
});

module.exports = router;

