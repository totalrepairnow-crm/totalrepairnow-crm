const express = require('express');
const jwt = require('jsonwebtoken');

let pool;
try {
  // Si tienes un módulo db, úsalo
  const db = require('../db');
  pool = db.pool || db;
} catch (e) {
  // Fallback: crear Pool aquí
  const { Pool } = require('pg');
  pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'crm',
    user: process.env.PGUSER || 'crmuser',
    password: process.env.PGPASSWORD
  });
}

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    // Verificación en DB: password_hash = crypt(password, password_hash)
    const q = `
      SELECT id, username, email, role
      FROM users
      WHERE email = $1
        AND password_hash = crypt($2, password_hash)
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      secret,
      { expiresIn: '12h' }
    );

    return res.json({ token, user });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// (opcional) self-test sencillo
router.post('/_selftest', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const { rows } = await pool.query('SELECT 1 as ok');
    res.json({ ok: rows.length === 1, echo: { email: !!email, password: !!password } });
  } catch (e) {
    res.status(500).json({ error: 'selftest failed' });
  }
});

module.exports = router;
