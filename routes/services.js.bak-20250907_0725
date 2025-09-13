const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = new Pool();

/** Auth simple: Authorization: Bearer <token> (también soporta x-access-token / token) */
function requireAuth(req, res, next) {
  const h = req.headers['authorization'] || '';
  const m = h.match(/^Bearer\s+(.+)/i);
  const token =
    (m && m[1]) ||
    req.headers['x-access-token'] ||
    req.headers['token'];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const secret = process.env.JWT_SECRET || 'dev';
    req.user = jwt.verify(token, secret);
    return next();
  } catch (_e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function toInt(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET /api/clients/:clientId/services
 * Lista servicios del cliente
 */
router.get('/:clientId/services', requireAuth, async (req, res) => {
  const clientId = toInt(req.params.clientId);
  if (!clientId) return res.status(400).json({ error: 'Invalid clientId' });

  try {
    const { rows } = await pool.query(
      `SELECT id, client_id, service_name, status, created_at
       FROM public.services
       WHERE client_id = $1
       ORDER BY id DESC`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error('services list error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/clients/:clientId/services
 * Crea servicio para el cliente
 * Body: { service_name: string, status?: string }
 * (El normalizador ya mapea "servicio"->service_name y "estado"->status si viene en ES)
 */
router.post('/:clientId/services', requireAuth, async (req, res) => {
  const clientId = toInt(req.params.clientId);
  if (!clientId) return res.status(400).json({ error: 'Invalid clientId' });

  const { service_name } = req.body || {};
  const status = (req.body && req.body.status) || 'open';

  if (!service_name || typeof service_name !== 'string') {
    return res.status(400).json({ error: 'service_name is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.services (client_id, service_name, status)
       VALUES ($1, $2, COALESCE($3,'open'))
       RETURNING id, client_id, service_name, status, created_at`,
      [clientId, service_name, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('services create error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * PUT /api/clients/:clientId/services/:serviceId
 * Actualiza service_name y/o status
 */
router.put('/:clientId/services/:serviceId', requireAuth, async (req, res) => {
  const clientId = toInt(req.params.clientId);
  const serviceId = toInt(req.params.serviceId);
  if (!clientId || !serviceId) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  const fields = [];
  const values = [];
  let i = 1;

  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'service_name')) {
    fields.push(`service_name = $${i++}`);
    values.push(req.body.service_name);
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'status')) {
    fields.push(`status = $${i++}`);
    values.push(req.body.status);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(clientId, serviceId);

  try {
    const { rows } = await pool.query(
      `UPDATE public.services
         SET ${fields.join(', ')}
       WHERE client_id = $${i++} AND id = $${i}
       RETURNING id, client_id, service_name, status, created_at`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('services update error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * DELETE /api/clients/:clientId/services/:serviceId
 */
router.delete('/:clientId/services/:serviceId', requireAuth, async (req, res) => {
  const clientId = toInt(req.params.clientId);
  const serviceId = toInt(req.params.serviceId);
  if (!clientId || !serviceId) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM public.services
       WHERE client_id = $1 AND id = $2`,
      [clientId, serviceId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error('services delete error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;

