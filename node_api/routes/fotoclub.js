const express      = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const writeProtection = require('../middleware/writeProtection.js');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/get_all', async (req, res) => {
    try {
      if (req?.user?.role_id == '1') {
        await LogOperacion(req.user.id, 'Consulta de Fotoclubes - ' + req.user.username, null, new Date()) 
      }

      // Por defecto solo retorna fotoclubes habilitados
      // Si se especifica inc_disabled=true, incluye también los deshabilitados
      let query = global.knex('fotoclub');
      if (req.query.inc_disabled !== 'true') {
        query = query.where('enabled', true);
      }

      res.json({ 
        items: await query,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const fotoclub = await global.knex('fotoclub').where('id', id).first();
      
      if (!fotoclub) {
        return res.status(404).json({ message: 'Fotoclub no encontrado' });
      }

      res.json(fotoclub);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener el fotoclub' });
    }
})

router.put('/edit', authMiddleware, writeProtection, async (req, res) => {
  try {
    // Solo admin puede editar
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ stat: false, text: 'Acceso denegado: solo administradores pueden editar fotoclubs' });
    }
    const { id, name, description, facebook, instagram, email, image } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Obtener el valor anterior antes de actualizar
    const oldFotoclub = await global.knex('fotoclub').where('id', id).first();
    let photo_url = oldFotoclub.photo_url;
    if (image) {
      try {
        const uploadsBasePath = process.env.UPLOADS_BASE_PATH;
        const year = new Date().getFullYear();
        const dir = path.join(uploadsBasePath, year.toString());
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Detect extension from base64 string
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        const ext = matches ? matches[1] : 'jpg';
        const base64Data = matches ? matches[2] : image;
        const filename = `foto_club_${Date.now()}.${ext}`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, base64Data, 'base64');
        photo_url = path.join(year.toString(), filename);
      } catch (err) {
        console.error('Error guardando imagen:', err);
        return res.status(500).json({ stat: false, text: 'Error al guardar la imagen.' });
      }
    }
    const newFotoclub = {
      name,
      description,
      facebook,
      instagram,
      email,
      photo_url
    };

    // Actualizar el registro en la base de datos
    const result = await global.knex('fotoclub')
      .where('id', id)
      .update(newFotoclub)

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

// Crear nuevo fotoclub
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // Solo admin puede crear
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ stat: false, text: 'Acceso denegado: solo administradores pueden crear fotoclubs' });
    }
    const { name, description, facebook, instagram, email, image, mostrar_en_ranking, organization_type } = req.body;
    let photo_url = null;
    if (image) {
      try {
        const uploadsBasePath = process.env.UPLOADS_BASE_PATH;
        const year = new Date().getFullYear();
        const dir = path.join(uploadsBasePath, year.toString());
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Detect extension from base64 string
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        const ext = matches ? matches[1] : 'jpg';
        const base64Data = matches ? matches[2] : image;
        const filename = `foto_club_${Date.now()}.${ext}`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, base64Data, 'base64');
        photo_url = path.join(year.toString(), filename);
      } catch (err) {
        console.error('Error guardando imagen:', err);
        return res.status(500).json({ stat: false, text: 'Error al guardar la imagen.' });
      }
    }

    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Crear fotoclub en la base de datos
    const [fotoclubId] = await global.knex('fotoclub').insert({
      name,
      description,
      facebook,
      instagram,
      email,
      photo_url,
      mostrar_en_ranking,
      organization_type
    }).returning('id');

    const newFotoclub = await global.knex('fotoclub').where('id', fotoclubId).first();

    await LogOperacion(
      req.user.id,
      'Creación de Fotoclub - ' + req.user.username,
      { new: newFotoclub },
      new Date()
    );

    res.status(201).json({
      stat: true,
      text: 'Fotoclub creado exitosamente',
      item: newFotoclub
    });
  } catch (error) {
    console.error(error);
    await LogOperacion(
      req.user?.id || null,
      'Error al crear Fotoclub',
      { error: error.message },
      new Date()
    );
    res.status(500).json({ stat: false, text: 'Ocurrió un error al crear el fotoclub.' });
  }
});

module.exports = router;