const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const writeProtection = require('../middleware/writeProtection.js');
const { invalidateCache } = require('../middleware/cacheInvalidator.js');

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Categorías - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('category'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', writeProtection, async (req, res) => {
  try {
    const { id, name, mostrar_en_ranking } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Validar que el campo mostrar_en_ranking sea un booleano
    if (typeof mostrar_en_ranking !== 'boolean') {
      return res.json({ stat: false, text: 'El campo mostrar_en_ranking debe ser un booleano' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('category')
      .where('id', id)
      .update({
        name,
        mostrar_en_ranking
      })

    await LogOperacion(req.session.user.id, 'Modificación de Categoría - ' + req.session.user.username, null, new Date()) 

    // Verificar si se actualizó el registro correctamente
    if (result === 1) {
      // Invalidar caché relacionado con categorías
      invalidateCache.categories();
      
      return res.json({ stat: true, text: 'Registro actualizado correctamente' });
    } else {
      return res.json({ stat: false, text: 'No se encontró el registro para actualizar' });
    }
  } catch (error) {
    console.error(error);
    return res.json({ stat: false, text: 'Ocurrió un error interno, contacte con soporte.' });
  }
})

module.exports = router;