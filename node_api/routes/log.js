const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/get_all', adminMiddleware, async (req, res) => {
  try {
    const registros = await global.knex('log_operaciones')
    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener registros' });
  }
});

module.exports = router;