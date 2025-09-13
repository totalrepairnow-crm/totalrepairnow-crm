const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { pool } = require('./db');
dotenv.config();

(async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@totalrepairnow.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'TuClaveSegura123';
  const role = process.env.ADMIN_ROLE || 'admin';

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role',
    [email, hash, role]
  );
  console.log(`✔ Admin listo: ${email} (role=${role})`);
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
