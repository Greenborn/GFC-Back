const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
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
    const roleGet = req.query.role || filterParams.role || '3';
    delete filterParams.role;

    const expand = String(req.query.expand || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    let query = global.knex('profile_contest').select('*');
    applyFilterObject(query, filterParams);

    if (!isAdmin) {
      const activeContestIdsQuery = global.knex('contest')
        .select('id')
        .where('end_date', '>', new Date());

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
        this.whereIn('contest_id', activeContestIdsQuery).orWhere(function () {
          profileCondition.call(this);
        });
      });
    }

    query.orderBy('id', 'asc');
    const items = await query;

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

module.exports = router;
