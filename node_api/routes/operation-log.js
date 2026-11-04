const express = require('express');
const router = express.Router();
const { escapeLikePattern, baseUnaccent, sanitizeSearchTerm } = require('../utils/strings.js');
const { buildPaginationResponse } = require('../utils/pagination.js');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /operation-log/get_all
// Listado paginado, ordenable y filtrable del log de operaciones. Solo admins.
router.get('/get_all', adminMiddleware, async (req, res) => {
  try {
    // ── Paginación ──
    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const perPage = parseInt(req.query['per-page'], 10) > 0 ? parseInt(req.query['per-page'], 10) : 20;

    // ── Ordenado ──
    const sortDir = req.query.sort_dir === 'asc' ? 'asc' : 'desc';
    const validSorts = ['id', 'id_usuario', 'evento', 'date_time'];
    const sort = validSorts.includes(req.query.sort) ? req.query.sort : 'date_time';

    // ── Búsqueda ──
    const rawSearch = (typeof req.query.search === 'string' && req.query.search.trim()) ||
                      (typeof req.query.q === 'string' && req.query.q.trim()) || '';
    const searchTerm = sanitizeSearchTerm(rawSearch);

    // ── Filtros ──
    const filterParams = {};
    for (const [key, value] of Object.entries(req.query)) {
      const match = key.match(/^filter\[(.+)\]$/);
      if (match) filterParams[match[1]] = value;
    }

    const applyLogFilters = (query) => {
      if (filterParams.id_usuario != null && filterParams.id_usuario !== '') {
        query.where('log_operaciones.id_usuario', filterParams.id_usuario);
      }

      if (filterParams.evento != null && filterParams.evento !== '' && typeof filterParams.evento === 'string') {
        const likeSearch = `%${escapeLikePattern(filterParams.evento.trim().toLowerCase())}%`;
        query.whereRaw(baseUnaccent('log_operaciones.evento') + " LIKE ? ESCAPE '\\'", [likeSearch]);
      }

      if (filterParams.username != null && filterParams.username !== '' && typeof filterParams.username === 'string') {
        const likeSearch = `%${escapeLikePattern(filterParams.username.trim().toLowerCase())}%`;
        query.whereRaw(baseUnaccent('user.username') + " LIKE ? ESCAPE '\\'", [likeSearch]);
      }

      // filter[date_time]=YYYY-MM-DD,YYYY-MM-DD (rango de fechas)
      const rawDateTime = filterParams.date_time;
      if (rawDateTime != null && rawDateTime !== '') {
        const parts = Array.isArray(rawDateTime) ? rawDateTime : String(rawDateTime).split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 2) {
          query.whereBetween('log_operaciones.date_time', [parts[0], parts[1] + ' 23:59:59']);
        } else if (parts.length === 1) {
          query.whereBetween('log_operaciones.date_time', [parts[0] + ' 00:00:00', parts[0] + ' 23:59:59']);
        }
      }

      if (searchTerm) {
        const likeSearch = `%${escapeLikePattern(searchTerm)}%`;
        query.where(function () {
          this.whereRaw(baseUnaccent('log_operaciones.evento') + " LIKE ? ESCAPE '\\'", [likeSearch])
            .orWhereRaw(baseUnaccent('user.username') + " LIKE ? ESCAPE '\\'", [likeSearch]);

          if (!Number.isNaN(Number(searchTerm))) {
            this.orWhere('log_operaciones.id_usuario', Number(searchTerm));
          }
        });
      }
    };

    // ── Total (solo con filtros) ──
    const countQuery = global.knex('log_operaciones')
      .leftJoin('user', 'user.id', 'log_operaciones.id_usuario')
      .count({ total: 'log_operaciones.id' });
    applyLogFilters(countQuery);
    const countRow = await countQuery.first();
    const totalCount = Number(countRow?.total) || 0;

    // ── Data con orden y paginación ──
    const itemsQuery = global.knex('log_operaciones')
      .leftJoin('user', 'user.id', 'log_operaciones.id_usuario')
      .select(
        'log_operaciones.id',
        'log_operaciones.id_usuario',
        'user.username',
        'log_operaciones.evento',
        'log_operaciones.meta_data',
        'log_operaciones.date_time'
      );
    applyLogFilters(itemsQuery);
    const items = await itemsQuery
      .orderBy(`log_operaciones.${sort}`, sortDir)
      .offset((page - 1) * perPage)
      .limit(perPage);

    const pagination = buildPaginationResponse(req, totalCount, page, perPage);

    res.json({ items, ...pagination });
  } catch (error) {
    console.error('Error en GET /operation-log/get_all:', error);
    return res.status(500).json({ message: 'Error al obtener registros' });
  }
});

module.exports = router;
