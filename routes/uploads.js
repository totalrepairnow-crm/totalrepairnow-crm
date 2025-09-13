const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { pool } = require('../db');

const router = express.Router();
const BASE = '/var/www/crm_uploads';

// Resuelve id flexible (numérico o UUID de cliente)
async function resolveClientIdFlexible(param) {
  if (/^\d+$/.test(param)) return parseInt(param, 10);
  if (/^[0-9a-fA-F-]{36}$/.test(param)) {
    const q = await pool.query('SELECT id FROM clients WHERE client_id = $1 LIMIT 1', [param]);
    if (q.rowCount) return q.rows[0].id;
    const err = new Error('Cliente no encontrado'); err.status = 404; throw err;
  }
  const err = new Error('id inválido'); err.status = 400; throw err;
}

function clientDir(id) {
  return path.join(BASE, String(id));
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const cid = await resolveClientIdFlexible(req.params.id);
      const dir = clientDir(cid);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const safe = String(file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({ storage });

// POST /api/clients/:id/uploads  (admin, tech)
router.post('/clients/:id/uploads',
  requireAuth, requireRole(['admin','tech']),
  upload.array('files', 10),
  async (req, res) => {
    try {
      if (!req.files?.length) return res.status(400).json({ error: 'No files' });
      const cid = await resolveClientIdFlexible(req.params.id);
      const urls = req.files.map(f => `/uploads/${cid}/${path.basename(f.path)}`);
      res.status(201).json({ uploaded: urls });
    } catch (e) {
      console.error('upload error:', e);
      res.status(e.status || 500).json({ error: e.message || 'Error interno' });
    }
  }
);

// GET /api/clients/:id/uploads  (admin, tech)
router.get('/clients/:id/uploads', requireAuth, requireRole(['admin','tech']), async (req, res) => {
  try {
    const cid = await resolveClientIdFlexible(req.params.id);
    const dir = clientDir(cid);
    if (!fs.existsSync(dir)) return res.json({ items: [] });
    const files = fs.readdirSync(dir)
      .filter(n => !n.startsWith('.'))
      .map(n => ({ name: n, url: `/uploads/${cid}/${n}` }))
      .sort((a,b)=> a.name < b.name ? 1 : -1);
    res.json({ items: files });
  } catch (e) {
    console.error('uploads list error:', e);
    res.status(e.status || 500).json({ error: e.message || 'Error interno' });
  }
});

module.exports = router;

