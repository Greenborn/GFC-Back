const express      = require('express');
const router       = express.Router();
const LogOperacion = require('./log_operaciones.js');

router.get('/get_all_fotoclub', async (req, res) => {
    try {
      res.json({ 
        items: await global.knex('fotoclub'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

module.exports = router;