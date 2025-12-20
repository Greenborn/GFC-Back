const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')
const knex = require('../knexfile');
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');

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

// PUT /user/:id/status
// Cambia el estado del usuario (0 = deshabilitado, 1 = habilitado)
router.put('/:id/status', authMiddleware, writeProtection, async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  const nuevoEstado = req.body?.status;
  try {
    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Parámetro id inválido' });
    }
    if (nuevoEstado !== 0 && nuevoEstado !== 1) {
      return res.status(400).json({ success: false, message: 'El campo status debe ser 0 o 1' });
    }
    if (!(req?.user?.role_id == '1')) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
    }
    const usuarioObjetivo = await global.knex('user').where('id', targetUserId).first();
    if (!usuarioObjetivo) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const updates = { status: nuevoEstado, updated_at: new Date().toISOString() };
    if (nuevoEstado === 0) {
      updates.access_token = null;
    }
    const result = await global.knex('user').where('id', targetUserId).update(updates);
    await LogOperacion(
      req.user.id,
      (nuevoEstado === 0 ? 'Deshabilitar' : 'Habilitar') + ' Usuario - ' + req.user.username,
      JSON.stringify({ targetUserId, status: nuevoEstado }),
      new Date()
    );
    if (result === 1) {
      return res.json({
        success: true,
        message: nuevoEstado === 0 ? 'Usuario deshabilitado' : 'Usuario habilitado',
        data: { id: targetUserId, status: nuevoEstado }
      });
    } else {
      return res.status(500).json({ success: false, message: 'No se pudo actualizar el usuario' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado de usuario', error: error.message });
  }
});

module.exports = router;
