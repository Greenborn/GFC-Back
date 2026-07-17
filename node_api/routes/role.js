const express = require('express');
const router = express.Router();
const { logAction } = require('../utils/log.js');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/get_all', authMiddleware, async (req, res) => {
  try {
    await logAction(req, 'Consulta de Roles - ' + req.user.username);

    res.json({ items: await global.knex('role').orderBy('id', 'asc') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
});

module.exports = router;
