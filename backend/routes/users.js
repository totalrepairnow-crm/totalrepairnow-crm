const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        email,
        COALESCE(role, 'user') AS role,
        split_part(email,'@',1) AS username
      FROM users
      ORDER BY id DESC
      LIMIT 500
    `);
    return res.json(rows);
  } catch (e) {
    console.error('GET /api/users failed:', e);
    // No tirar el server: responder arreglo vacío
    return res.json([]);
  }
});

module.exports = router;
