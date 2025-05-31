const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');

router.get('/get_all', async (req, res) => {
    try {
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
    if (isNaN(score) || score <= 0) {
      return res.json({ stat: false, text: 'El score debe ser un número entero positivo' });
    }

    // Validar que el organization_type sea uno de los valores permitidos
    const allowedOrganizationTypes = ['INTERNO', 'EXTERNO', 'EXTERNO_UNICEN'];
    if (!allowedOrganizationTypes.includes(organization_type)) {
      return res.json({ stat: false, text: 'El tipo de organización no es válido' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('metric_abm')
      .where('id', id)
      .update({
        prize,
        score,
        organization_type
      });

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