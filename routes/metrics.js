const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (_req, res) => {
  try {
    const [{ rows: tc }, { rows: ac }, { rows: ic }, { rows: sc }, { rows: ta }] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM clients"),
      pool.query("SELECT COUNT(*)::int AS n FROM clients WHERE LOWER(estado) = 'activo'"),
      pool.query("SELECT COUNT(*)::int AS n FROM clients WHERE LOWER(estado) <> 'activo'"),
      pool.query("SELECT COUNT(*)::int AS n FROM services"),
      pool.query("SELECT COALESCE(SUM(total), 0)::numeric(14,2) AS amount FROM services")
    ]);

    res.json({
      total_clients: tc[0].n,
      active_clients: ac[0].n,
      inactive_clients: ic[0].n,
      services_count: sc[0].n,
      services_total_amount: ta[0].amount
    });
  } catch (e) {
    console.error('metrics error:', e);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
