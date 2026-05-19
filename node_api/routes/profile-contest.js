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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isDelegate = String(currentUser.role_id) === '2';

    const filterParams = req.query.filter || {};

    if (req.query['filter[contest_id]'] !== undefined) {
      filterParams.contest_id = req.query['filter[contest_id]'];
    }

    if (req.query['filter[profile_id]'] !== undefined) {
      filterParams.profile_id = req.query['filter[profile_id]'];
    }

    const roleGet = req.query.role || filterParams.role || '3';

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

    await LogOperacion(
      currentUser.id,
      `Consulta de profile-contest - ${currentUser.username}`,
      { filter: filterParams, role: roleGet },
      new Date()
    );

    res.json({ items });
  } catch (error) {
    console.error('Error en GET /profile-contest:', error);
    res.status(500).json({ success: false, message: 'Error al obtener profile_contest', error: error.message });
  }
});

module.exports = router;
