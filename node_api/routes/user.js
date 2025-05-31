const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')

router.get('/get_all', async (req, res) => {
    try {
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