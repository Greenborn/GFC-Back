const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const writeProtection = require('../middleware/writeProtection.js');

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Fotoclubes - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('fotoclub'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', writeProtection, async (req, res) => {
  try {
    const { id, name, description, facebook, instagram, email } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('fotoclub')
      .where('id', id)
      .update({
        name,
        description,
        facebook,
        instagram,
        email
      })

    await LogOperacion(req.session.user.id, 'Modificación de Fotoclub - ' + req.session.user.username, null, new Date()) 

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