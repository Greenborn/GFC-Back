const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { isValidOrganizationType } = require('../utils/organizationType');

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { prize, score } = req.body;

    if (!prize || score === undefined || score === null) {
      return res.status(400).json({ success: false, message: 'prize y score son requeridos' });
    }
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum) || !Number.isInteger(scoreNum) || scoreNum < 0) {
      return res.status(400).json({ success: false, message: 'El score debe ser un número entero positivo' });
    }

    const [row] = await global.knex('metric').insert({
      prize,
      score: scoreNum
    }).returning('id');
    const id = row?.id ?? row;
    const created = await global.knex('metric').where({ id }).first();

    await LogOperacion(
      req.user.id,
      `Creación de métrica - ${req.user.username}`,
      JSON.stringify({ prize, score }),
      new Date()
    );

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error en POST /metric:', error);
    res.status(500).json({ success: false, message: 'Error al crear métrica', error: error.message });
  }
});

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Métrica - '+req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('metric_abm'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', async (req, res) => {
  try {
    const { id, prize, score, organization_type } = req.body;

    // Validar que todos los campos estén correctos
    if (!id || !prize || !score || !organization_type) {
      return res.json({ stat: false, text: 'Faltan campos obligatorios' });
    }

    // Validar que el score sea un número entero
    if (isNaN(score)) {
      return res.json({ stat: false, text: 'El score debe ser un número entero positivo' });
    }

    // Validar que el organization_type sea uno de los valores permitidos (util central)
    if (!isValidOrganizationType(organization_type)) {
      return res.json({ stat: false, text: 'El tipo de organización no es válido' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('metric_abm')
      .where('id', id)
      .update({
        prize,
        score,
        organization_type
      })
      
    await LogOperacion(req.session.user.id, 'Modificación de Métrica - ' + req.session.user.username, null, new Date()) 

    // Verificar si se actualizó el registro correctamente
    if (result === 1) {
      return res.json({ stat: true, text: 'Registro actualizado correctamente' });
    } else {
      return res.json({ stat: false, text: 'No se encontró el registro para actualizar' });
    }
  } catch (error) {
    console.error(error);
    return res.json({ stat: false, text: 'Ocurrió un error interno, contacte con soporte.' });
  }
});

module.exports = router;