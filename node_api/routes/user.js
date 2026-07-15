const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const axios = require('axios');
const LogOperacion = require('../controllers/log_operaciones.js')
const authMiddleware = require('../middleware/authMiddleware');

const AUTH_SERVICE_URL = process.env.URL_AUTH_SERVICE || 'https://auth.greenborn.com.ar';

// GET /user/me — Devuelve el usuario autenticado (requiere authMiddleware)
router.get('/me', authMiddleware, (req, res) => {
  const { password_hash, access_token, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// GET /user/sso-profile — Busca usuario local por email del SSO sin crearlo
router.get('/sso-profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const uniqueId = req.query.unique_id;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }
  if (!uniqueId) {
    return res.status(400).json({ success: false, message: 'unique_id requerido' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/auth/verify?unique_id=${encodeURIComponent(uniqueId)}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
    );

    if (!response.data?.success || !response.data?.data?.valid) {
      return res.status(401).json({ success: false, message: 'Token SSO inválido' });
    }

    const ssoUser = response.data.data.user;
    const localUser = await global.knex('user').where({ email: ssoUser.email }).first();

    if (!localUser) {
      return res.json({ success: true, exists: false, user: null });
    }

    const { password_hash, access_token, ...safeUser } = localUser;
    return res.json({ success: true, exists: true, user: safeUser });
  } catch (error) {
    const ssoBody = error.response?.data;
    console.error(`[SSO-Profile] Error: ${JSON.stringify(ssoBody) || error.message}`);
    return res.status(500).json({ success: false, message: 'Error al verificar SSO', error: ssoBody || error.message });
  }
});

router.get('/get_all', authMiddleware, async (req, res) => {
    try {
      await LogOperacion(req.user.id, 'Consulta de Usuarios - ' + req.user.username, null, new Date());

      const usersQuery = global.knex('user').orderBy('id', 'asc');

      if (req.user.role_id == '2' || req.user.role_id === 2) {
        const currentProfile = await global.knex('profile').where({ id: req.user.profile_id }).first();
        const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;

        if (fotoclubId) {
          usersQuery
            .where('role_id', 3)
            .whereIn('profile_id', function () {
              this.select('id').from('profile').where({ fotoclub_id: fotoclubId });
            });
        } else {
          usersQuery.where('role_id', 3).where('profile_id', -1);
        }
      }

      res.json({
        items: await usersQuery,
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
// Admins y delegados pueden actualizar la contraseña de cualquier usuario.
// Un usuario común solo puede actualizar su propia contraseña.
router.put('/:id/password', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, message: 'Falta la contraseña nueva' });
  }

  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';
    const isSelfUpdate = String(currentUser.id) === String(userId);

    if (!isAdmin && !isDelegate && !isSelfUpdate) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo puede cambiar su propia contraseña.' });
    }

    const user = await global.knex('user').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (isSelfUpdate) {
      const { actual_password } = req.body;
      if (!actual_password) {
        return res.status(400).json({ success: false, message: 'Falta la contraseña actual' });
      }

      const isCurrentPasswordValid = bcrypt.compareSync(actual_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(403).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
    }

    const saltRounds = 13;
    let hashedPassword = bcrypt.hashSync(password, saltRounds);
    hashedPassword = hashedPassword.replace(/^\$2[abxy]\$/, '$2y$');

    await global.knex('user')
      .update({ password_hash: hashedPassword })
      .where({ id: userId });

    await LogOperacion(currentUser.id, `Actualización de contraseña de usuario ${userId}`, JSON.stringify({ targetUserId: userId }), new Date());

    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar contraseña' });
  }
});

// PUT /user/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const payload = req.body || {};

  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    if (!isAdmin && !isDelegate && String(currentUser.id) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo puede editar su propio usuario.' });
    }

    const user = await global.knex('user').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const forbiddenFields = ['password', 'password_hash', 'password_reset_token', 'access_token', 'sign_up_verif_code', 'sign_up_verif_token', 'created_at', 'updated_at'];
    for (const field of forbiddenFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        return res.status(403).json({ success: false, message: `No se puede editar el campo '${field}' en este endpoint` });
      }
    }

    if (!isAdmin && !isDelegate) {
      const adminOnlyFields = ['role_id', 'profile_id'];
      for (const field of adminOnlyFields) {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          return res.status(403).json({ success: false, message: `Solo admin o delegado pueden editar '${field}'` });
        }
      }
    }

    const allowedFields = isAdmin || isDelegate
      ? ['username', 'email', 'status', 'role_id', 'profile_id', 'dni']
      : ['username', 'email', 'dni'];

    const updateData = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        const value = payload[field];
        if (value === null || value === undefined) {
          return res.status(400).json({ success: false, message: `El campo '${field}' no puede ser vacío` });
        }

        if (['username', 'email', 'dni'].includes(field) && typeof value === 'string' && value.trim() === '') {
          return res.status(400).json({ success: false, message: `El campo '${field}' no puede ser vacío` });
        }

        updateData[field] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos válidos para actualizar' });
    }

    // Validar unicidad de username, dni y email para otro usuario distinto
    const uniqueChecks = [
      { field: 'username', value: updateData.username, label: 'nombre de usuario' },
      { field: 'dni', value: updateData.dni, label: 'DNI' },
      { field: 'email', value: updateData.email, label: 'correo electrónico' }
    ];

    for (const check of uniqueChecks) {
      if (check.value !== undefined) {
        const existing = await global.knex('user')
          .where({ [check.field]: check.value })
          .andWhereNot({ id: userId })
          .first();

        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Ya existe otro usuario con el mismo ${check.label}`
          });
        }
      }
    }

    await global.knex('user').where({ id: userId }).update(updateData);
    const updatedUser = await global.knex('user').where({ id: userId }).first();
    const { password_hash, password_reset_token, access_token, updated_at, sign_up_verif_code, sign_up_verif_token, ...safeUser } = updatedUser;

    await LogOperacion(currentUser.id, `Actualización de usuario ${userId}`, JSON.stringify({ targetUserId: userId, updateData }), new Date());
    return res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

// GET /user/:id?expand=profile,profile.fotoclub,role
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    if (!isAdmin && !isDelegate && String(currentUser.id) !== String(userId)) {
      return res.status(403).json({ message: 'Acceso denegado. Solo puede consultar su propio usuario.' });
    }

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

    // Filtrar campos sensibles
    const { password_hash, password_reset_token, access_token, updated_at, sign_up_verif_code, sign_up_verif_token, ...safeUser } = user;

    // Armar respuesta
    const response = {
      ...safeUser,
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
