const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const LogOperacion = require('../controllers/log_operaciones.js');

function normalizeFilterValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value;
}

function parseFilterParams(query) {
  const filter = {};

  if (query.filter && typeof query.filter === 'object') {
    Object.assign(filter, query.filter);
  }

  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^filter\[(.+)\]$/);
    if (match) {
      filter[match[1]] = value;
    }
  }

  return filter;
}

function applyFilterObject(query, filter) {
  if (!filter || typeof filter !== 'object') return;

  for (const [key, value] of Object.entries(filter)) {
    if (value == null || key === 'role') continue;

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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    const filterParams = parseFilterParams(req.query);

    if (filterParams.contest_id == null) {
      return res.status(400).json({ success: false, message: 'El parámetro filter[contest_id] es obligatorio' });
    }

    const roleGet = req.query.role || filterParams.role || '3';
    delete filterParams.role;

    const expand = String(req.query.expand || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    let query = global.knex('profile_contest').select('*');
    applyFilterObject(query, filterParams);

    if (!isAdmin) {
      const judgedContestIdsQuery = global.knex('contest')
        .select('id')
        .where('judged', true);

      let profileCondition;
      if (isDelegate) {
        const currentProfile = await global.knex('profile').where({ id: currentUser.profile_id }).first();
        const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
        if (fotoclubId) {
          profileCondition = function () {
            this.whereIn('profile_id', function () {
              this.select('id').from('profile').where({ fotoclub_id: fotoclubId });
            });
          };
        } else {
          profileCondition = function () {
            this.where('profile_id', -1);
          };
        }
      } else {
        profileCondition = function () {
          this.where('profile_id', currentUser.profile_id);
        };
      }

      query.andWhere(function () {
        this.whereIn('contest_id', judgedContestIdsQuery).orWhere(function () {
          profileCondition.call(this);
        });
      });
    }

    query.orderBy('id', 'asc');
    const items = await query;

    const contestId = normalizeFilterValue(filterParams.contest_id);
    const contestIds = Array.isArray(contestId) ? contestId : [contestId];

    if (items.length > 0) {
      const profileIds = Array.from(new Set(items.map(item => item.profile_id).filter(Boolean)));
      if (profileIds.length > 0 && contestIds.length > 0) {
        const photoCountRows = await global.knex('contest_result as cr')
          .join('image as i', 'cr.image_id', 'i.id')
          .select('i.profile_id')
          .select(global.knex.raw('COUNT(*) as count'))
          .whereIn('cr.contest_id', contestIds)
          .whereIn('i.profile_id', profileIds)
          .groupBy('i.profile_id');

        const photoCountsByProfile = new Map(photoCountRows.map(row => [row.profile_id, Number(row.count)]));
        for (const item of items) {
          item.photo_count = photoCountsByProfile.get(item.profile_id) || 0;
        }
      } else {
        for (const item of items) {
          item.photo_count = 0;
        }
      }
    }

    const profileExpand = expand.includes('profile') || expand.some(item => item.startsWith('profile.'));
    const profileUserExpand = expand.includes('profile.user');
    const profileFotoclubExpand = expand.includes('profile.fotoclub');

    if (profileExpand && items.length > 0) {
      const profileIds = Array.from(new Set(items.map(item => item.profile_id).filter(Boolean)));
      const profiles = await global.knex('profile').whereIn('id', profileIds).select('*');
      const profilesById = new Map(profiles.map(profile => [profile.id, { ...profile }]));

      if (profileUserExpand) {
        const userRows = await global.knex('user')
          .whereIn('profile_id', profileIds)
          .select('*');
        const usersByProfileId = new Map(userRows.map(user => [user.profile_id, user]));
        for (const profile of profilesById.values()) {
          profile.user = usersByProfileId.get(profile.id) || null;
        }
      }

      if (profileFotoclubExpand) {
        const fotoclubIds = Array.from(new Set(profiles
          .map(profile => profile.fotoclub_id)
          .filter(Boolean)));
        if (fotoclubIds.length > 0) {
          const fotoclubs = await global.knex('fotoclub')
            .whereIn('id', fotoclubIds)
            .select('*');
          const fotoclubsById = new Map(fotoclubs.map(fc => [fc.id, fc]));
          for (const profile of profilesById.values()) {
            profile.fotoclub = profile.fotoclub_id ? fotoclubsById.get(profile.fotoclub_id) || null : null;
          }
        } else {
          for (const profile of profilesById.values()) {
            profile.fotoclub = null;
          }
        }
      }

      for (const item of items) {
        item.profile = profilesById.get(item.profile_id) || null;
      }
    }

    await LogOperacion(
      currentUser.id,
      `Consulta de profile-contest - ${currentUser.username}`,
      { filter: filterParams, expand, role: roleGet },
      new Date()
    );

    res.json({ items });
  } catch (error) {
    console.error('Error en GET /profile-contest:', error);
    res.status(500).json({ success: false, message: 'Error al obtener profile_contest', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  const { profile_id, contest_id, category_id } = req.body;

  if (!profile_id || !contest_id) {
    return res.status(400).json({ success: false, message: 'profile_id y contest_id son requeridos' });
  }

  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';
    const isConcursante = String(currentUser.role_id) === '3';

    if (isAdmin && Number(profile_id) === Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'Un administrador no puede inscribirse a sí mismo' });
    }

    if (isConcursante && Number(profile_id) !== Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'No puede inscribir un perfil que no le pertenece' });
    }

    if (isDelegate) {
      const currentProfile = await global.knex('profile').where({ id: currentUser.profile_id }).first();
      const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
      if (fotoclubId) {
        const targetProfile = await global.knex('profile').where({ id: profile_id }).first();
        if (!targetProfile || Number(targetProfile.fotoclub_id) !== Number(fotoclubId)) {
          return res.status(403).json({ success: false, message: 'No puede inscribir un perfil fuera de su fotoclub' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'No tiene fotoclub asignado' });
      }
    }

    const existing = await global.knex('profile_contest')
      .where({ profile_id, contest_id }).first();
    if (existing) {
      return res.status(409).json({ success: false, message: 'El perfil ya está inscrito en este concurso' });
    }

    const [insertRow] = await global.knex('profile_contest').insert({
      profile_id,
      contest_id,
      category_id: category_id || null
    }).returning('id');
    const id = insertRow?.id ?? insertRow;

    let item = await global.knex('profile_contest').where({ id }).first();

    const expand = String(req.query.expand || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    const categoryExpand = expand.includes('category');
    const profileExpand = expand.includes('profile') || expand.some(e => e.startsWith('profile.'));
    const profileUserExpand = expand.includes('profile.user');
    const profileFotoclubExpand = expand.includes('profile.fotoclub');

    if (categoryExpand && item.category_id) {
      item.category = await global.knex('category').where({ id: item.category_id }).first() || null;
    }

    if (profileExpand && item.profile_id) {
      const profile = await global.knex('profile').where({ id: item.profile_id }).first();
      if (profile) {
        if (profileUserExpand) {
          profile.user = await global.knex('user').where({ profile_id: profile.id }).first() || null;
        }
        if (profileFotoclubExpand && profile.fotoclub_id) {
          profile.fotoclub = await global.knex('fotoclub').where({ id: profile.fotoclub_id }).first() || null;
        }
        item.profile = profile;
      }
    }

    await LogOperacion(
      currentUser.id,
      `Inscripción en concurso - ${currentUser.username}`,
      JSON.stringify({ profile_id, contest_id, category_id }),
      new Date()
    );

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'El perfil ya está inscrito en este concurso' });
    }
    console.error('Error en POST /profile-contest:', error);
    res.status(500).json({ success: false, message: 'Error al inscribir perfil en concurso', error: error.message });
  }
});

module.exports = router;
