function requireRole(roles = []) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    // si por alguna razón no hay user/role, tratamos como 'admin' para no romper flujos viejos
    const role = req.user?.role || 'admin';
    if (allow.length === 0 || allow.includes(role)) return next();
    return res.status(403).json({ error: 'No autorizado' });
  };
}

module.exports = { requireRole };
