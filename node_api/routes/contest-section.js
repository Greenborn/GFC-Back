const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const { logAction } = require('../utils/log.js');
const { parseFilterParams, applyFilterObject } = require('../utils/filters.js');
const { buildPaginationResponse } = require('../utils/pagination.js');

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
    applyFilterObject(countQuery, filterParams, { nestedKey: 'section' });

    const dataQuery = global.knex('contest_section as cs')
      .select('cs.id', 'cs.contest_id', 'cs.section_id');
    applyFilterObject(dataQuery, filterParams, { nestedKey: 'section' });

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

    const pagination = buildPaginationResponse(req, totalCount, currentPage, perPage);
    res.json({ items, ...pagination });
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

    await logAction(req, `Creación de ContestSection - ${req.user.username}`, JSON.stringify(data));

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
