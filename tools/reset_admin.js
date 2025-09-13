require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../db');

(async () => {
  const email = process.argv[2] || 'admin@totalrepairnow.com';
  const pass  = process.argv[3] || 'TuClaveSegura123';
  const hash  = await bcrypt.hash(pass, 10);

  // Ajusta el nombre de la columna si tu esquema difiere.
  await pool.query(
    "UPDATE users SET password_hash=$1, role='admin' WHERE email=$2",
    [hash, email]
  );
  console.log(`OK: contraseña reseteada para ${email}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
