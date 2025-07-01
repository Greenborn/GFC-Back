const express = require('express');
const router = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js')
module.exports = router

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

router.delete('/delete', async (req, res) => {
    let trx = null
    try{
      trx = await global.knex.transaction();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en transacción' });
    }

    try {
      let ID = req.body.id

      if (!ID) {
        return res.status(500).json({ message: 'Error al obtener registros' });
      }

      let constest = await global.knex('contest').where({'id':ID}).first()
      if (!constest) {
        return res.status(500).json({ message: 'Error al obtener registros' });
      }

      if (constest?.judged == 1) {
        return res.status(500).json({ message: 'No se puede eliminar concurso que pasó por el Juzgamiento' });
      }

      if (constest?.judged == 1) {
        return res.status(500).json({ message: 'No se puede eliminar concurso que pasó por el Juzgamiento' });
      }

      let constest_records = await global.knex('contest_record').where({'contest_id':ID})
      if (constest_records.length > 0) {
        return res.status(500).json({ message: 'No se puede eliminar concurso con Grabaciones' });
      }

      let constest_results = await global.knex('constest_result').where({'contest_id':ID})
      if (constest_results.length > 0) {
        return res.status(500).json({ message: 'No se puede eliminar concurso con Fotografías' });
      }

      await LogOperacion(req.session.user.id, 'Borrado de Concursos - ' + req.session.user.username, null, new Date()) 

      await trx('contest').where({'id':ID}).delete()
      await trx('contest_category').where({'contest_id':ID}).delete()
      await trx('contests_section').where({'contest_id':ID}).delete()
      
      await trx.commit();
      return res.json({ 
        stat: true
      });
    } catch (error) {
      await trx.rollback();
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})