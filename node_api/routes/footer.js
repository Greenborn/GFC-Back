const express         = require('express');
const router          = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware.js');

router.get('/get', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ stat: false, text: 'El parámetro id es obligatorio' });
    }

    const item = await global.knex('footer').where('id', id).first();

    if (!item) {
      return res.status(404).json({ stat: false, text: 'Registro no encontrado' });
    }

    res.json({ stat: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ stat: false, text: 'Error al obtener el registro' });
  }
});

router.put('/edit', adminMiddleware, async (req, res) => {
  try {
    const { id, email, facebook, instagram, youtube } = req.body;

    if (!id) {
      return res.status(400).json({ stat: false, text: 'El campo id es obligatorio' });
    }

    const result = await global.knex('footer')
      .where('id', id)
      .update({ email, facebook, instagram, youtube });

    if (result === 1) {
      return res.json({ stat: true, text: 'Registro actualizado correctamente' });
    } else {
      return res.json({ stat: false, text: 'No se encontró el registro para actualizar' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ stat: false, text: 'Error al actualizar el registro' });
  }
});

module.exports = router;
