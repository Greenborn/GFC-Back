const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')
const knex = require('../knexfile');
const authMiddleware = require('../middleware/authMiddleware');

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