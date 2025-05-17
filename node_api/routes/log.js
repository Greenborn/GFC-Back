const express = require('express');
const router = express.Router();

router.get('/get_all', async (req, res) => {
  try {
    const registros = await global.knex('log_operaciones')
    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener registros' });
  }
});

module.exports = router;