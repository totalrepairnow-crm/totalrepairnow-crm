const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verifyJWT } = require('../middleware/auth'); // debe existir en tu backend

// Helpers de rol
function requireRole(...roles){
  return (req,res,next)=>{
    const role = req.user?.role;
    if(!role || !roles.includes(role)) return res.status(403).json({error:'forbidden'});
    next();
  };
}

// GET /api/clients?page=&pageSize=&q=&status=&sort=&order=
router.get('/', verifyJWT, async (req,res)=>{
  try{
    const page = Math.max(parseInt(req.query.page||'1',10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize||'20',10),1),100);
    const q = (req.query.q||'').trim();
    const status = (req.query.status||'').trim();
    const sort = ['created_at','company_name','email','status','id'].includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = (req.query.order||'desc').toLowerCase()==='asc' ? 'asc' : 'desc';

    const params = [];
    let where = 'WHERE 1=1';
    if(q){
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(company_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }
    if(status){
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    // total
    const { rows: cRows } = await pool.query(`SELECT COUNT(*)::int AS total FROM clients ${where}`, params);
    const total = cRows[0].total;

    // data
    const offset = (page-1)*pageSize;
    params.push(pageSize); params.push(offset);
    const { rows } = await pool.query(
      `SELECT id, company_name, email, phone, status, created_at
       FROM clients
       ${where}
       ORDER BY ${sort} ${order}
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    res.json({ items: rows, total, page, pageSize });
  } catch(e){
    console.error('clients list error:', e.message);
    res.status(500).json({error:'clients list failed'});
  }
});

// POST /api/clients
router.post('/', verifyJWT, requireRole('admin','tecnico'), async (req,res)=>{
  try{
    const { company_name, email, phone, status } = req.body || {};
    if(!company_name) return res.status(400).json({error:'company_name requerido'});

    const { rows } = await pool.query(
      `INSERT INTO clients (company_name, email, phone, status)
       VALUES ($1, COALESCE($2,''), COALESCE($3,''), COALESCE($4,'activo'))
       RETURNING id, company_name, email, phone, status, created_at`,
      [company_name, email, phone, status]
    );
    res.status(201).json(rows[0]);
  } catch(e){
    console.error('clients POST error:', e.message);
    res.status(500).json({error:'clients insert failed'});
  }
});

// POST /api/clients/:id/services
router.post('/:id/services', verifyJWT, requireRole('admin','tecnico'), async (req,res)=>{
  try{
    const clientId = req.params.id;
    const { titulo, descripcion, precioUnitario, estado } = req.body || {};
    if(!clientId) return res.status(400).json({error:'client id requerido'});
    if(!titulo)    return res.status(400).json({error:'titulo requerido'});

    const { rows } = await pool.query(
      `INSERT INTO services (client_id, title, description, price, status)
       VALUES ($1, $2, COALESCE($3,''), COALESCE($4,0), COALESCE($5,'activo'))
       RETURNING id, client_id, title, status, created_at`,
      [clientId, titulo, descripcion, precioUnitario, estado]
    );
    res.status(201).json(rows[0]);
  } catch(e){
    console.error('services POST error:', e.message);
    res.status(500).json({error:'services insert failed'});
  }
});

module.exports = router;
