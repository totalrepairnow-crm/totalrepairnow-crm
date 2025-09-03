// server.js
require('dotenv').config();
const express = require('express');
const path = require('path'); // por si lo necesitas en otros módulos
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// --- Base middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normaliza llaves ES -> EN para mantener compatibilidad
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const map = {
      nombre: 'first_name',
      apellido: 'last_name',
      correo: 'email',
      telefono: 'phone',
      cliente_id: 'client_id',
      servicio: 'service_name',
      estado: 'status',
      username: 'email'
    };
    for (const [from, to] of Object.entries(map)) {
      if (req.body[from] != null && req.body[to] == null) {
        req.body[to] = req.body[from];
      }
    }
  }
  next();
});

app.set('trust proxy', 1); // detrás de Nginx

// --- Normalizador ES -> EN (compatibilidad hacia adelante) ---
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const map = {
      nombre: 'first_name',
      apellido: 'last_name',
      correo: 'email',
      telefono: 'phone',
      cliente_id: 'client_id',
      servicio: 'service_name',
      estado: 'status',
      username: 'email' // legacy login por "username"
    };
    for (const [from, to] of Object.entries(map)) {
      if (req.body[from] != null && req.body[to] == null) {
        req.body[to] = req.body[from];
      }
    }
  }
  next();
});

// --- Static uploads (en prod Nginx también sirve /uploads) ---
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/var/www/crm_uploads';
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Health ---
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// --- Debug echo temporal (activar solo cuando se necesite) ---
if (process.env.ENABLE_DEBUG_ECHO === '1') {
  app.post('/api/_debug_echo', (req, res) => {
    res.json({
      received: req.body,
      note: 'This endpoint exists only when ENABLE_DEBUG_ECHO=1'
    });
  });
}



// --- DB pool ---
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// --- Alias de login estable (/api/login) ---
// Nota: mantiene la semántica actual: users(email, password_hash, role)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const q = 'SELECT id, email, password_hash, role FROM users WHERE email=$1 LIMIT 1';
    const { rows } = await pool.query(q, [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role || 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error('LOGIN /api/login ERROR:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// --- Montaje de rutas existentes (si están presentes en el proyecto) ---
function mountIfExists(prefix, file) {
  try {
    const r = require(file);
    app.use(prefix, r);
  } catch (_e) {}
}

// Si tu routes/auth también expone /auth/login, seguirá disponible.
try {
  const authRoutes = require('./routes/auth');
  app.use('/api', authRoutes); // expone /api/auth/login (y cualquier otra de auth)
} catch (e) {
  console.warn('Auth routes no disponibles:', e.message);
}

mountIfExists('/api/clients', './routes/clients');   // CRUD clientes
mountIfExists('/api/clients', './routes/services');  // /:id/services + fotos
mountIfExists('/api/users',   './routes/users');     // gestión de usuarios
mountIfExists('/api',         './routes/uploads');   // subida de archivos
mountIfExists('/api/metrics', './routes/metrics');   // métricas (si existe)

// --- 404 API ---
app.use('/api', (_req, res, _next) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('UNCAUGHT ERROR:', err);
  res.status(500).json({ error: 'Internal error' });
});

// --- Start ---
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`CRM backend running on port ${PORT}`));

