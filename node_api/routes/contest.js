const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Concursos - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('contest'),
        contest_category: await global.knex('contest_category'),
        category: await global.knex('category'),
        //section: await global.knex('section'),
        contests_records: await global.knex('contests_records'),
        contest_result: await global.knex('contest_result')
});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

module.exports = router;