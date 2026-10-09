const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/log.js')
const { escapeLikePattern, baseUnaccent, sanitizeSearchTerm } = require('../utils/strings.js')
const { parseFilterParams, applyFilterObject } = require('../utils/filters.js')
const { buildPaginationResponse } = require('../utils/pagination.js')
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const { insertAndGet } = require('../utils/db.js');

router.get('/get_all', authMiddleware, async (req, res) => {
    try {
      await logAction(req, 'Consulta de Usuarios - ' + req.user.username);

      // ── Paginación ──
      const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
      const perPage = parseInt(req.query['per-page'], 10) > 0 ? parseInt(req.query['per-page'], 10) : 20;

      // ── Ordenado ──
      const sortDir = req.query.sort_dir === 'desc' ? 'desc' : 'asc';
      const validSorts = ['id', 'username', 'email', 'dni', 'status', 'role_id', 'profile_id', 'created_at', 'updated_at'];
      const sort = validSorts.includes(req.query.sort) ? req.query.sort : 'id';
      const orderBy = { column: sort, dir: sortDir };

      // ── Búsqueda ──
      const rawSearch = (typeof req.query.search === 'string' && req.query.search.trim()) ||
                        (typeof req.query.q === 'string' && req.query.q.trim()) || '';
      const searchTerm = sanitizeSearchTerm(rawSearch);

      // ── Filtros ──
      const filterParams = parseFilterParams(req.query);
      const filterKeys = Object.keys(filterParams).filter(k => validSorts.includes(k));

      // ── Aplicar filtros/búsqueda/restricción a un query de user ──
      const applyUserFilters = (query) => {
        if (filterKeys.length > 0) {
          const likeKeys = ['email', 'username', 'dni'];
          const exactKeys = filterKeys.filter(k => !likeKeys.includes(k));

          if (exactKeys.length > 0) {
            const filter = {};
            for (const k of exactKeys) filter[k] = filterParams[k];
            applyFilterObject(query, filter);
          }

          for (const k of likeKeys) {
            const raw = filterParams[k];
            if (raw == null || raw === '' || Array.isArray(raw) || typeof raw === 'object') continue;
            const likeSearch = `%${escapeLikePattern(String(raw).trim().toLowerCase())}%`;
            query.whereRaw(baseUnaccent(k) + " LIKE ? ESCAPE '\\'", [likeSearch]);
          }
        }

        if (searchTerm) {
          const likeSearch = `%${escapeLikePattern(searchTerm)}%`;
          query.where(function () {
            this.whereRaw(baseUnaccent('username') + " LIKE ? ESCAPE '\\'", [likeSearch])
              .orWhereRaw(baseUnaccent('email') + " LIKE ? ESCAPE '\\'", [likeSearch])
              .orWhereRaw(baseUnaccent('dni') + " LIKE ? ESCAPE '\\'", [likeSearch]);

            if (!Number.isNaN(Number(searchTerm))) {
              this.orWhere('id', Number(searchTerm));
            }
          });
        }

        if (isDelegate) {
          if (fotoclubId) {
            query
              .where('role_id', 3)
              .whereIn('profile_id', function () {
                this.select('id').from('profile').where({ fotoclub_id: fotoclubId });
              });
          } else {
            query.where('role_id', 3).where('profile_id', -1);
          }
        }
      };

      // ── Restricción para delegados ──
      const isDelegate = req.user.role_id == '2' || req.user.role_id === 2;
      let fotoclubId = null;
      if (isDelegate) {
        const currentProfile = await global.knex('profile').where({ id: req.user.profile_id }).first();
        fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
      }

      // ── Total (solo con filtros) ──
      const countQuery = global.knex('user').count({ total: 'id' });
      applyUserFilters(countQuery);
      const countRow = await countQuery.first();
      const totalCount = Number(countRow?.total) || 0;

      // ── Data con orden y paginación ──
      const itemsQuery = global.knex('user')
        .select('id', 'username', 'email', 'dni', 'status', 'role_id', 'profile_id', 'created_at', 'updated_at');
      applyUserFilters(itemsQuery);
      const items = await itemsQuery
        .orderBy(orderBy.column, orderBy.dir)
        .offset((page - 1) * perPage)
        .limit(perPage);

      const pagination = buildPaginationResponse(req, totalCount, page, perPage);

      res.json({
        items,
        ...pagination,
        profile: await global.knex('profile'),
        role: await global.knex('role'),
        fotoclub: await global.knex('fotoclub')
      });
    } catch (error) {
      console.error('Error en GET /user/get_all:', error);
      return res.status(500).json({ message: 'Error al obtener registros' });
    }
})

// POST /user
// Crea un usuario asociado a un perfil existente. Solo admin y delegado.
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  const payload = req.body || {};

  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    if (!isAdmin && !isDelegate) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo admin o delegado pueden crear usuarios.' });
    }

    const username = typeof payload.username === 'string' ? payload.username.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const password = payload.password;
    const roleId = payload.role_id;
    const profileId = payload.profile_id;
    const dni = payload.dni != null && payload.dni !== '' && typeof payload.dni === 'string' ? payload.dni.replace(/\D/g, '') : payload.dni;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'username, email y password son requeridos' });
    }

    if (!/^[a-zA-Z0-9]{1,20}$/.test(username)) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario debe ser alfanumérico (máx. 20 caracteres)' });
    }

    if (!Number.isFinite(Number(roleId))) {
      return res.status(400).json({ success: false, message: 'role_id es requerido' });
    }

    if (profileId == null || !Number.isFinite(Number(profileId)) || Number(profileId) <= 0) {
      return res.status(400).json({ success: false, message: 'profile_id es requerido' });
    }

    const profile = await global.knex('profile').where({ id: profileId }).first();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    const profileInUse = await global.knex('user').where({ profile_id: profileId }).first();
    if (profileInUse) {
      return res.status(409).json({ success: false, message: 'El perfil ya está asociado a otro usuario' });
    }

    if (isDelegate) {
      if (Number(roleId) !== 3) {
        return res.status(403).json({ success: false, message: 'Solo puede crear usuarios concursantes' });
      }
      const currentProfile = await global.knex('profile').where({ id: currentUser.profile_id }).first();
      const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
      if (!fotoclubId || Number(profile.fotoclub_id) !== Number(fotoclubId)) {
        return res.status(403).json({ success: false, message: 'No puede crear usuarios fuera de su fotoclub' });
      }
    }

    const duplicate = await global.knex('user')
      .whereRaw('LOWER(username) = ?', [username.toLowerCase()])
      .orWhereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();
    if (duplicate) {
      const isSameUsername = String(duplicate.username).toLowerCase() === username.toLowerCase();
      return res.status(409).json({ success: false, message: isSameUsername ? 'El nombre de usuario ya está en uso' : 'El correo electrónico ya está registrado' });
    }

    if (dni) {
      const dniExists = await global.knex('user').where({ dni }).first();
      if (dniExists) {
        return res.status(409).json({ success: false, message: 'El DNI ya está registrado' });
      }
    }

    const saltRounds = 13;
    let hashedPassword = bcrypt.hashSync(password, saltRounds);
    hashedPassword = hashedPassword.replace(/^\$2[abxy]\$/, '$2y$');

    const insertData = {
      username,
      email,
      password_hash: hashedPassword,
      role_id: Number(roleId),
      profile_id: Number(profileId),
      profile_completed: true,
      status: 1,
      is_test_enabled: !!payload.is_test_enabled,
      created_at: new Date().toISOString()
    };

    if (dni) {
      insertData.dni = dni;
    } else {
      insertData.dni = profile.dni ?? null;
    }

    const createdUser = await insertAndGet(global.knex, 'user', insertData);
    const { password_hash, password_reset_token, access_token, sign_up_verif_code, sign_up_verif_token, updated_at, ...safeUser } = createdUser;

    await logAction(req, `Creación de usuario ${createdUser.id} - ${currentUser.username}`, JSON.stringify({ targetUserId: createdUser.id, profileId: Number(profileId), roleId: Number(roleId) }));
    return res.status(201).json({ success: true, id: createdUser.id, user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
});

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

      if (typeof user.password_hash !== 'string') {
        return res.status(403).json({ success: false, message: 'Contraseña actual incorrecta' });
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

    await logAction(req, `Actualización de contraseña de usuario ${userId}`, JSON.stringify({ targetUserId: userId }));

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

    if (!isAdmin) {
      if (Object.prototype.hasOwnProperty.call(payload, 'is_test_enabled')) {
        return res.status(403).json({ success: false, message: 'Solo administradores pueden editar el campo is_test_enabled' });
      }
    }

    const allowedFields = isAdmin || isDelegate
      ? ['username', 'email', 'status', 'role_id', 'profile_id', 'dni', 'is_test_enabled']
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

        updateData[field] = field === 'dni' && typeof value === 'string' ? value.replace(/\D/g, '') : value;
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

    await logAction(req, `Actualización de usuario ${userId}`, JSON.stringify({ targetUserId: userId, updateData }));
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
    console.error('Error en GET /user/:id:', error);
    return res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

module.exports = router;
