const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard
router.get('/', async (_req, res) => {
  try {
    const { rows: c1 } = await db.query(`SELECT COUNT(*)::int AS n FROM clients`);
    const { rows: c2 } = await db.query(`SELECT COUNT(*)::int AS n FROM users`);

    const totals = { clients: c1[0].n, users: c2[0].n, services: 0 };
    let servicesPerWeek = [];

    // ¿Existe la tabla services?
    const { rows: chk } = await db.query(`SELECT to_regclass('public.services') IS NOT NULL AS exists`);
    if (chk[0].exists) {
      const { rows: s1 } = await db.query(`SELECT COUNT(*)::int AS n FROM services`);
      totals.services = s1[0].n;

      const { rows: s2 } = await db.query(`
        SELECT date_trunc('week', created_at) AS week, COUNT(*)::int AS count
        FROM services
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 8
      `);
      servicesPerWeek = s2;
    }

    return res.json({ totals, series: { servicesPerWeek } });
  } catch (e) {
    console.error('GET /api/dashboard failed:', e);
    // Fallback mínimo que evita 502
    return res.json({ status: 'ok' });
  }
});

module.exports = router;
