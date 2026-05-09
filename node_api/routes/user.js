const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')
const knex = require('../knexfile');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Endpoint: GET /user/me
router.get('/me', authMiddleware, (req, res) => {
  // Puedes filtrar los campos sensibles si lo deseas
  const { password_hash, access_token, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Usuarios - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('user'),
        profile: await global.knex('profile'),
        role: await global.knex('role'),
        fotoclub: await global.knex('fotoclub')
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

// PUT /user/:id/password
// Solo administradores pueden actualizar la contraseña de un usuario
router.put('/:id/password', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Falta la contraseña nueva' });
  }

  try {
    const user = await global.knex('user').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const saltRounds = 13;
    let hashedPassword = bcrypt.hashSync(password, saltRounds);
    hashedPassword = hashedPassword.replace(/^\$2[abxy]\$/, '$2y$');

    await global.knex('user')
      .update({ password_hash: hashedPassword })
      .where({ id: userId });

    await LogOperacion(req.user.id, `Actualización de contraseña de usuario ${userId}`, JSON.stringify({ targetUserId: userId }), new Date());

    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar contraseña' });
  }
});

// GET /user/:id?expand=profile,profile.fotoclub,role
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    // Obtener usuario
    const user = await global.knex('user').where('id', userId).first();
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Obtener profile
    const profile = await global.knex('profile').where('id', user.profile_id).first();
    // Obtener fotoclub si existe
    let fotoclub = null;
    if (profile && profile.fotoclub_id) {
      fotoclub = await global.knex('fotoclub').where('id', profile.fotoclub_id).first();
    }
    // Obtener role
    const role = await global.knex('role').where('id', user.role_id).first();

    // Armar respuesta
    const response = {
      ...user,
      profile: profile ? {
        ...profile,
        fotoclub: fotoclub || null
      } : null,
      role: role || null
    };
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

module.exports = router;
