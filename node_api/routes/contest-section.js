const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
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

function buildQueryString(query, filterParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === 'filter') continue;
    if (/^filter\[.*\]$/.test(key)) continue;
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, String(v)));
    } else if (typeof value === 'object') {
      // skip nested objects except filter
      continue;
    } else {
      params.set(key, String(value));
    }
  }
  for (const [key, value] of Object.entries(filterParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach(v => params.append(`filter[${key}]`, String(v)));
    } else {
      params.set(`filter[${key}]`, String(value));
    }
  }
  return params.toString();
}

function applyFilterObject(query, filter) {
  if (!filter || typeof filter !== 'object') return;
  for (const [key, value] of Object.entries(filter)) {
    if (value == null) continue;
    if (key === 'section' && typeof value === 'object') {
      applyFilterObject(query, value);
      continue;
    }
    const filterKey = key.replace(/^section\./, '');
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

// GET /contest-section - Listar relaciones contest_section con filtros y expand
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filterParams = parseFilterParams(req.query);
    const expand = String(req.query.expand || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    const includeSection = expand.includes('section');

    const currentPage = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query['per-page'], 10) || 20;
    const offset = (currentPage - 1) * perPage;

    const countQuery = global.knex('contest_section').count('id as count').first();
    applyFilterObject(countQuery, filterParams);

    const dataQuery = global.knex('contest_section as cs')
      .select('cs.id', 'cs.contest_id', 'cs.section_id');
    applyFilterObject(dataQuery, filterParams);

    if (includeSection) {
      dataQuery
        .leftJoin('section as s', 'cs.section_id', 's.id')
        .select('s.id as section_id', 's.name as section_name');
    }

    const totalCountResult = await countQuery;
    const totalCount = parseInt(totalCountResult.count || 0, 10);
    const pageCount = Math.max(1, Math.ceil(totalCount / perPage));

    const rows = await dataQuery.orderBy('cs.id', 'asc').limit(perPage).offset(offset);
    const items = rows.map(row => {
      const item = {
        id: row.id,
        contest_id: row.contest_id,
        section_id: row.section_id
      };
      if (includeSection) {
        item.section = row.section_id != null ? {
          id: row.section_id,
          name: row.section_name
        } : null;
      }
      return item;
    });

    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const selfQuery = buildQueryString(req.query, { ...filterParams, page: currentPage });
    const firstQuery = buildQueryString(req.query, { ...filterParams, page: 1 });
    const lastQuery = buildQueryString(req.query, { ...filterParams, page: pageCount });

    res.json({
      items,
      _links: {
        self: { href: `${baseUrl}?${selfQuery}` },
        first: { href: `${baseUrl}?${firstQuery}` },
        last: { href: `${baseUrl}?${lastQuery}` }
      },
      _meta: {
        totalCount,
        pageCount,
        currentPage,
        perPage
      }
    });
  } catch (error) {
    console.error('Error en GET /contest-section:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contest_section',
      error: error.message
    });
  }
});

// POST /contest-section - Crear relación contest_section
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: solo administradores pueden crear contest_section'
      });
    }

    const { contest_id, section_id } = req.body;

    if (!contest_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: 'Los campos contest_id y section_id son obligatorios'
      });
    }

    const contestIdNumber = parseInt(contest_id, 10);
    const sectionIdNumber = parseInt(section_id, 10);

    if (isNaN(contestIdNumber) || isNaN(sectionIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'contest_id y section_id deben ser números'
      });
    }

    const contestExists = await global.knex('contest')
      .where('id', contestIdNumber)
      .first();

    if (!contestExists) {
      return res.status(404).json({
        success: false,
        message: 'El concurso especificado no existe'
      });
    }

    const sectionExists = await global.knex('section')
      .where('id', sectionIdNumber)
      .first();

    if (!sectionExists) {
      return res.status(404).json({
        success: false,
        message: 'La sección especificada no existe'
      });
    }

    const data = {
      contest_id: contestIdNumber,
      section_id: sectionIdNumber
    };

    await global.knex('contest_section').insert(data);

    await LogOperacion(
      req.user.id,
      `Creación de ContestSection - ${req.user.username}`,
      JSON.stringify(data),
      new Date()
    );

    return res.status(201).json({
      success: true,
      message: 'Contest section creada exitosamente',
      data
    });
  } catch (error) {
    console.error('Error en POST /contest-section:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear contest_section',
      error: error.message
    });
  }
});

module.exports = router;
