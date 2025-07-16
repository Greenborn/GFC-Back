const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')
const knex = require('../knexfile');

// Middleware de autenticación por token Bearer
async function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  const token = auth.slice(7);
  try {
    const user = await req.app.locals.knex('user').where({ access_token: token }).first();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error de servidor', error: err.message });
  }
}

// Endpoint: GET /user/me
router.get('/me', authMiddleware, (req, res) => {
  // Puedes filtrar los campos sensibles si lo deseas
  const { password_hash, access_token, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Usuarios - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('user'),
        profile: await global.knex('profile'),
        role: await global.knex('role'),
        fotoclub: await global.knex('fotoclub')
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

module.exports = router;