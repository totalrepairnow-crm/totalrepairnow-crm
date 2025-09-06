// ~/crm_app/backend/routes/clients.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool(); // Toma PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE del entorno

// =============== AUTH MIDDLEWARE ROBUSTO ===============
function extractToken(req) {
  const h = req.headers || {};
  const auth = h.authorization || h.Authorization;
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  if (h['x-access-token']) return String(h['x-access-token']).trim();
  if (h.token) return String(h.token).trim();
  return null;
}

function verifyJWT(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    console.warn('[clients][AUTH] token ausente (Authorization/x-access-token/token)');
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (e) {
    console.warn('[clients][AUTH] token inválido:', e.message);
    return res.status(401).json({ error: 'No autorizado' });
  }
}

// Aplica el middleware a TODO lo de clientes
router.use(verifyJWT);

// =============== RUTAS ===============
// GET /api/clients  -> lista clientes
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, created_at
         FROM public.clients
        ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[clients][GET /] error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/clients/:id -> detalle
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, created_at
         FROM public.clients
        WHERE id = $1`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[clients][GET /:id] error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/clients -> crear
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email es requerido' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.clients (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, phone, created_at`,
      [first_name ?? null, last_name ?? null, email, phone ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (String(err.message || '').includes('unique') || String(err.detail || '').includes('already exists')) {
      return res.status(409).json({ error: 'email ya existe' });
    }
    console.error('[clients][POST /] error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/clients/:id -> actualizar parcial
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  const { first_name, last_name, email, phone } = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE public.clients
          SET first_name = COALESCE($1, first_name),
              last_name  = COALESCE($2, last_name),
              email      = COALESCE($3, email),
              phone      = COALESCE($4, phone)
        WHERE id = $5
      RETURNING id, first_name, last_name, email, phone, created_at`,
      [first_name ?? null, last_name ?? null, email ?? null, phone ?? null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[clients][PUT /:id] error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/clients/:id -> eliminar (ON DELETE CASCADE si FK en services)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    const r = await pool.query(`DELETE FROM public.clients WHERE id=$1`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[clients][DELETE /:id] error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
