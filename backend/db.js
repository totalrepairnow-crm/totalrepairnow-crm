const { Pool } = require('pg');

// Usa variables de entorno ya configuradas por pg (PGHOST, PGUSER, etc.)
const pool = new Pool();

/**
 * Export universal:
 *  - Se puede usar como función: db(text, params)
 *  - Tiene método .query: db.query(text, params)
 *  - Expone el pool real en .pool por si se necesita.
 */
function db(text, params) {
  return pool.query(text, params);
}
db.query = (text, params) => pool.query(text, params);
db.pool  = pool;

module.exports = db;
