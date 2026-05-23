const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const LogOperacion = require('../controllers/log_operaciones.js');
const upload = multer({ storage: multer.memoryStorage() });

function normalizeFilterValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value;
}

function applyFilterObject(query, filter) {
  if (!filter || typeof filter !== 'object') return;

  for (const [key, value] of Object.entries(filter)) {
    if (value == null) continue;

    if (key === 'profile' && typeof value === 'object') {
      applyFilterObject(query, value);
      continue;
    }

    const filterKey = key.replace(/^profile\./, '');

    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.in != null) {
        const normalized = normalizeFilterValue(value.in);
        query.whereIn(filterKey, Array.isArray(normalized) ? normalized : [normalized]);
        continue;
      }
      if (value.between != null) {
        const normalized = normalizeFilterValue(value.between);
        if (Array.isArray(normalized) && normalized.length === 2) {
          const [a, b] = normalized.map(Number).sort((x, y) => x - y);
          query.whereBetween(filterKey, [a, b]);
        }
        continue;
      }
      if (value.inside != null) {
        const normalized = normalizeFilterValue(value.inside);
        if (Array.isArray(normalized) && normalized.length === 2) {
          const [a, b] = normalized.map(Number).sort((x, y) => x - y);
          query.where(filterKey, '>', a).andWhere(filterKey, '<', b);
        }
        continue;
      }
    }

    const normalized = normalizeFilterValue(value);

    if (Array.isArray(normalized)) {
      query.whereIn(filterKey, normalized);
    } else {
      query.where(filterKey, normalized);
    }
  }
}

function escapeLikePattern(value) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

router.get('/:id', authMiddleware, async (req, res) => {
  const profileId = parseInt(req.params.id, 10);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return res.status(400).json({ message: 'ID de perfil inválido' });
  }

  try {
    const profile = await global.knex('profile').where({ id: profileId }).first();
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    if (!isAdmin && !isDelegate && currentUser.profile_id !== profileId) {
      return res.status(403).json({ message: 'No tiene permisos para ver este perfil' });
    }

    if (isDelegate) {
      const currentProfile = await global.knex('profile').where({ id: currentUser.profile_id }).first();
      const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
      if (!fotoclubId || profile.fotoclub_id !== fotoclubId) {
        return res.status(403).json({ message: 'No tiene permisos para ver este perfil' });
      }

      const profileUser = await global.knex('user').where({ profile_id: profileId }).first();
      if (!profileUser || String(profileUser.role_id) !== '3') {
        return res.status(403).json({ message: 'No tiene permisos para ver este perfil' });
      }
    }

    const expand = req.query.expand ? req.query.expand.split(',').map(s => s.trim()) : [];
    const response = { ...profile };

    if (expand.includes('user')) {
      response.user = await global.knex('user').where({ profile_id: profileId }).first() || null;
    }

    await LogOperacion(currentUser.id, `Consulta de perfil ${profileId}${expand.includes('user') ? ' con user expandido' : ''} - ${currentUser.username}`, null, new Date());
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

router.put('/:id', authMiddleware, upload.single('image_file'), async (req, res) => {
  const profileId = parseInt(req.params.id, 10);
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return res.status(400).json({ message: 'ID de perfil inválido' });
  }

  try {
    const profile = await global.knex('profile').where({ id: profileId }).first();
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    if (!isAdmin && !isDelegate && currentUser.profile_id !== profileId) {
      return res.status(403).json({ message: 'No tiene permisos para editar este perfil' });
    }

    const requestBody = req.body || {};
    const allowedFields = ['name', 'last_name', 'fotoclub_id', 'img_url', 'dni'];
    const adminFields = ['executive', 'executive_rol'];
    const updateData = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(requestBody, field) && requestBody[field] !== null) {
        updateData[field] = requestBody[field];
      }
    }

    if (req.file && req.file.fieldname === 'image_file') {
      const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || process.env.UPLOADS_BASE_PATH || './uploads';
      const imagesDir = path.join(uploadsBasePath, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const filename = `profile_${profileId}_${Date.now()}_${uniqueSuffix}.jpg`;
      const filepath = path.join(imagesDir, filename);
      const outputBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 100, mozjpeg: true })
        .toBuffer();

      fs.writeFileSync(filepath, outputBuffer);
      updateData.img_url = path.posix.join('images', filename);
    }

    if (isAdmin || isDelegate) {
      for (const field of adminFields) {
        if (Object.prototype.hasOwnProperty.call(requestBody, field) && requestBody[field] !== null) {
          updateData[field] = requestBody[field];
        }
      }
    } else {
      for (const field of adminFields) {
        if (Object.prototype.hasOwnProperty.call(requestBody, field)) {
          return res.status(403).json({ message: `Solo admin o delegado pueden modificar '${field}'` });
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar' });
    }

    await global.knex('profile').where({ id: profileId }).update(updateData);
    const updatedProfile = await global.knex('profile').where({ id: profileId }).first();

    await LogOperacion(currentUser.id, `Actualización de perfil ${profileId} - ${currentUser.username}`, JSON.stringify({ profileId, updateData }), new Date());
    return res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const expand = req.query.expand ? req.query.expand.split(',').map(s => s.trim()) : [];
    const filterParams = req.query.filter || {};
    const profileId = req.query['filter[profile.id]'] || req.query['filter[id]'] || filterParams['profile.id'] || filterParams.id || (filterParams.profile && filterParams.profile.id);

    let query = global.knex('profile').orderBy('id', 'asc');

    if (profileId != null) {
      query.where('id', profileId);
    }

    applyFilterObject(query, filterParams);

    const rawSearchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const searchTerm = rawSearchTerm.substring(0, 100);
    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      const likeSearch = `%${escapeLikePattern(normalizedSearch)}%`;
      query.andWhere(function () {
        this.whereRaw("LOWER(name) LIKE ? ESCAPE '\\'", [likeSearch])
          .orWhereRaw("LOWER(last_name) LIKE ? ESCAPE '\\'", [likeSearch])
          .orWhereRaw("LOWER(dni) LIKE ? ESCAPE '\\'", [likeSearch])
          .orWhereRaw("LOWER(executive_rol) LIKE ? ESCAPE '\\'", [likeSearch])
          .orWhereRaw("LOWER(img_url) LIKE ? ESCAPE '\\'", [likeSearch]);

        if (!Number.isNaN(Number(searchTerm))) {
          this.orWhere('id', Number(searchTerm));
        }
      });
    }

    if (req.user.role_id == '2' || req.user.role_id === 2 || req.user.role_id === '2') {
      const currentProfile = await global.knex('profile').where({ id: req.user.profile_id }).first();
      const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;

      if (fotoclubId) {
        query
          .where('fotoclub_id', fotoclubId)
          .whereIn('id', function () {
            this.select('profile_id').from('user').where('role_id', 3);
          });
      } else {
        query
          .where('fotoclub_id', -1)
          .whereIn('id', function () {
            this.select('profile_id').from('user').where('role_id', 3);
          });
      }
    }

    const profiles = await query;
    const items = profiles.map(profile => ({ ...profile }));

    if (expand.includes('user')) {
      const profileIds = items.map(profile => profile.id);
      const users = await global.knex('user').whereIn('profile_id', profileIds).select('*');
      const usersByProfileId = new Map(users.map(user => [user.profile_id, user]));

      for (const profile of items) {
        profile.user = usersByProfileId.get(profile.id) || null;
      }
    }

    await LogOperacion(req.user.id, `Consulta de perfiles${expand.includes('user') ? ' con user expandido' : ''} - ${req.user.username}`, null, new Date());
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener perfiles' });
  }
});

module.exports = router;
