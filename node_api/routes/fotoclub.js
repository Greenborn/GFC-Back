const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const writeProtection = require('../middleware/writeProtection.js');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/get_all', async (req, res) => {
    try {
      if (req?.user?.role_id == '1') {
        await LogOperacion(req.user.id, 'Consulta de Fotoclubes - ' + req.user.username, null, new Date()) 
      }

      res.json({ 
        items: await global.knex('fotoclub'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', authMiddleware, writeProtection, async (req, res) => {
  try {
    // Solo admin puede editar
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ stat: false, text: 'Acceso denegado: solo administradores pueden editar fotoclubs' });
    }
    const { id, name, description, facebook, instagram, email } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Obtener el valor anterior antes de actualizar
    const oldFotoclub = await global.knex('fotoclub').where('id', id).first();
    const newFotoclub = {
      name,
      description,
      facebook,
      instagram,
      email
    };

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

    await LogOperacion(
      req.user.id,
      'Modificación de Fotoclub - ' + req.user.username,
      {
        old: oldFotoclub,
        new: newFotoclub
      },
      new Date()
    );

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