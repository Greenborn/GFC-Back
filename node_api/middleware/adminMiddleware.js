const authMiddleware = require('./authMiddleware');

// Middleware que combina autenticación con verificación de rol de administrador
async function adminMiddleware(req, res, next) {
  // Primero verificamos autenticación
  await authMiddleware(req, res, () => {
    // Luego verificamos si es administrador
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Solo administradores pueden acceder a este recurso.' 
      });
    }
    next();
  });
}

module.exports = adminMiddleware;