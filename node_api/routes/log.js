const express = require('express');
const router = express.Router();

router.get('/get_all', async (req, res) => {
  try {
    let registros = global.knex('log_operaciones')
    if (req.query?.count) {
      registros = registros.limit(req.query?.count)
    }
    res.json(await registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener registros' });
  }
});

module.exports = router;