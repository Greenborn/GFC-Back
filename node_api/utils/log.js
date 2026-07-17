const LogOperacion = require('../controllers/log_operaciones.js');

function logAction(req, event, meta) {
  return LogOperacion(req.user?.id || 0, event, meta || null, new Date());
}

module.exports = { logAction };
