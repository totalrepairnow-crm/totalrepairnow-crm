const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const h = req.headers['authorization'] || '';
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: 'No autorizado' });
    const token = m[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { requireAuth };

/** Autorización por rol */
function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Prohibido' });
      next();
    } catch (e) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  };
}
module.exports.requireRole = requireRole;
