const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const pool = new Pool(); // usa PG* del entorno

async function doLogin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    const q = `
      SELECT id, email, password_hash, role
      FROM users
      WHERE lower(email)=lower($1)
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

router.post('/login', doLogin);       // POST /api/login
router.post('/auth/login', doLogin);  // POST /api/auth/login
module.exports = router;
