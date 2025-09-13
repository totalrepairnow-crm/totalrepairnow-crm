// ~/crm_app/backend/server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');

// bcrypt con fallback a bcryptjs si no está instalado bcrypt nativo
let bcrypt;
try { bcrypt = require('bcrypt'); } catch { bcrypt = require('bcryptjs'); }

// CORS opcional (NO es obligatorio tenerlo instalado)
function safeRequire(name) {
  try { return require(name); } catch { return null; }
}
const cors = safeRequire('cors');

const app = express();

// Middlewares
if (cors) {
  app.use(cors());
}
app.use(express.json({ limit: '5mb' }));

// Healthcheck
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Login — devuelve { token, accessToken } (mismo valor)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Busca usuario por email (case-insensitive)
    const q = `
      SELECT id, email, password_hash, COALESCE(role,'admin') AS role
      FROM users
      WHERE lower(email) = lower($1)
      LIMIT 1
    `;
    const { rows } = await db.query(q, [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, accessToken: token });
  } catch (err) {
    console.error('LOGIN /api/login ERROR:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Montar routers (con protección para no romper el arranque si falta alguno)
function mountIfExists(prefix, relPath) {
  try {
    const mod = require(relPath);
    const isRouter =
      typeof mod === 'function' ||
      (mod && typeof mod === 'object' && (mod.stack || mod.handle));
    if (!isRouter) {
      console.error(`ERROR mounting ${prefix} from ${relPath}: Not an express router export`);
      return;
    }
    app.use(prefix, mod);
    console.log(`Mounted ${prefix} -> ${relPath}`);
  } catch (e) {
    console.error(`ERROR mounting ${prefix} from ${relPath}:`, e.message);
  }
}

mountIfExists('/api/clients',   './routes/clients');
mountIfExists('/api/services',  './routes/services');
mountIfExists('/api/users',     './routes/users');
mountIfExists('/api',           './routes/uploads');
mountIfExists('/api/metrics',   './routes/metrics');
mountIfExists('/api/dashboard', './routes/dashboard');
mountIfExists('/api/invoices', './routes/invoices');

// 404 para endpoints API no encontrados
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Manejador de errores no capturados
app.use((err, _req, res, _next) => {
  console.error('UNCAUGHT ERROR:', err);
  res.status(500).json({ error: 'Internal error' });
});

// Arranque
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`CRM backend running on port ${PORT}`));
