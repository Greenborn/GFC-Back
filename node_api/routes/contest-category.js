const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const { logAction } = require('../utils/log.js');
const { parseFilterParams, applyFilterObject } = require('../utils/filters.js');
const { buildPaginationResponse } = require('../utils/pagination.js');

// GET /contest-category - Listar relaciones contest_category con filtros y expand
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user;
    const filterParams = parseFilterParams(req.query);
    const expand = String(req.query.expand || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const currentPage = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query['per-page'], 10) || 20;
    const offset = (currentPage - 1) * perPage;

    const countQuery = global.knex('contest_category').count('id as count').first();
    const dataQuery = global.knex('contest_category as cc').select('cc.id', 'cc.contest_id', 'cc.category_id');

    applyFilterObject(countQuery, filterParams, { nestedKey: 'category' });
    applyFilterObject(dataQuery, filterParams, { nestedKey: 'category' });

    const includeCategory = expand.includes('category');
    if (includeCategory) {
      dataQuery
        .leftJoin('category as c', 'cc.category_id', 'c.id')
        .select('c.id as category_id', 'c.name as category_name', 'c.mostrar_en_ranking');
    }

    const totalCountResult = await countQuery;
    const totalCount = parseInt(totalCountResult.count || 0, 10);
    const pageCount = Math.max(1, Math.ceil(totalCount / perPage));

    const itemsRaw = await dataQuery.orderBy('cc.id', 'asc').limit(perPage).offset(offset);
    const items = itemsRaw.map(item => {
      const result = {
        id: item.id,
        contest_id: item.contest_id,
        category_id: item.category_id
      };
      if (includeCategory) {
        result.category = item.category_id != null ? {
          id: item.category_id,
          name: item.category_name,
          mostrar_en_ranking: item.mostrar_en_ranking
        } : null;
      }
      return result;
    });



    await logAction(req, `Consulta de contest-category - ${req.user.username}`, { filter: filterParams, expand });

    const pagination = buildPaginationResponse(req, totalCount, currentPage, perPage);
    res.json({ items, ...pagination });
  } catch (error) {
    console.error('Error en GET /contest-category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener contest_category',
      error: error.message
    });
  }
});

// POST /contest-category - Crear relación contest_category
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: solo administradores pueden crear contest_category'
      });
    }

    const { contest_id, category_id } = req.body;

    if (!contest_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Los campos contest_id y category_id son obligatorios'
      });
    }

    const contestIdNumber = parseInt(contest_id, 10);
    const categoryIdNumber = parseInt(category_id, 10);

    if (isNaN(contestIdNumber) || isNaN(categoryIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'contest_id y category_id deben ser números'
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

    const categoryExists = await global.knex('category')
      .where('id', categoryIdNumber)
      .first();

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }

    const data = {
      contest_id: contestIdNumber,
      category_id: categoryIdNumber
    };

    await global.knex('contest_category').insert(data);

    await logAction(req, `Creación de ContestCategory - ${req.user.username}`, JSON.stringify(data));

    return res.status(201).json({
      success: true,
      message: 'Contest category creada exitosamente',
      data
    });
  } catch (error) {
    console.error('Error en POST /contest-category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear contest_category',
      error: error.message
    });
  }
});

module.exports = router;
