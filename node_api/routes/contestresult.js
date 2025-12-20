const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const LogOperacion = require('../controllers/log_operaciones.js');

// GET /contest-result?expand=profile,profile.user,profile.fotoclub,image.profile,image.thumbnail&filter[contest_id]=51
router.get('/contest-result', authMiddleware, async (req, res) => {

  try {
    // Permitir contest_id como filter[contest_id] o filter.contest_id
    let contestId = req.query['filter[contest_id]'];
    if (!contestId && req.query.filter && typeof req.query.filter === 'object') {
      contestId = req.query.filter.contest_id;
    }
    if (!contestId) {
      return res.status(400).json({ message: 'Falta contest_id en el filtro' });
    }

    // Parse expand (no se usa en la query, pero se puede parsear para futuro)
    const expand = req.query.expand ? req.query.expand.split(',') : [];

  // Parámetros de paginación
  const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    // Solo soporta per-page
    const perPage = parseInt(req.query['per-page'] || 20);

  // Query principal: contest_result + joins

  // Selección explícita de columnas para evitar ambigüedad
  let selectColumns = [
      'contest_result.id as contest_result_id',
      'contest_result.contest_id',
      'contest_result.image_id as contest_result_image_id',
      'contest_result.metric_id as contest_result_metric_id',
      'contest_result.section_id as contest_result_section_id',
      'image.id as image_id',
      'image.profile_id as image_profile_id',
      'image.url as image_url',
      'image.title as image_title',
      'image.code as image_code',
      'metric.id as metric_id',
      'metric.prize as metric_prize',
      'metric.score as metric_score',
      'thumbnail.id as thumbnail_id',
      'thumbnail.url as thumbnail_url',
      'thumbnail.thumbnail_type as thumbnail_type',
      'contest_section.id as contest_section_id',
      'contest_section.section_id as contest_section_section_id',
      'section.id as section_id',
      'section.name as section_name'
    ];

    let query = global.knex('contest_result')
      .where('contest_result.contest_id', contestId)
      .leftJoin('image', 'contest_result.image_id', 'image.id')
      .leftJoin('metric', 'contest_result.metric_id', 'metric.id')
      .leftJoin('thumbnail', 'image.id', 'thumbnail.image_id')
      .leftJoin('contest_section', 'contest_result.section_id', 'contest_section.section_id')
      .leftJoin('section', 'contest_result.section_id', 'section.id');

    if (expand.includes('profile')) {
      query = query.leftJoin('profile', 'image.profile_id', 'profile.id');
      selectColumns = selectColumns.concat([
        'profile.id as profile_id',
        'profile.name as profile_name',
        'profile.last_name as profile_last_name',
        'profile.fotoclub_id as profile_fotoclub_id'
      ]);
    }

  // Obtener todos los resultados sin paginación SQL
  query = query.select(selectColumns);

    // Obtener el total de elementos sin paginación
    const totalCountQuery = global.knex('contest_result')
      .where('contest_result.contest_id', contestId)
      .count('id as total');

    const [itemsRaw, totalCountResult] = await Promise.all([
      query,
      totalCountQuery
    ]);
    const totalCount = totalCountResult[0]?.total || 0;

    // Agrupar thumbnails en array por contest_result_id
    const grouped = {};
    for (const item of itemsRaw) {
      const {
        image_id, image_profile_id, image_url, image_title, image_code,
        thumbnail_id, thumbnail_url, thumbnail_type,
        metric_id, metric_prize, metric_score,
        profile_id, profile_name, profile_last_name, profile_fotoclub_id,
        section_id, section_name, section_description,
        contest_result_id,
        ...rest
      } = item;
      if (!grouped[contest_result_id]) {
        grouped[contest_result_id] = {
          ...rest,
          contest_result_id,
          image: (image_id ? {
            id: image_id,
            profile_id: image_profile_id,
            url: image_url,
            title: image_title,
            code: image_code
          } : null),
          metric: (metric_id ? {
            id: metric_id,
            prize: metric_prize,
            score: metric_score
          } : null),
          thumbnails: [],
          profile: (profile_id ? {
            id: profile_id,
            name: profile_name,
            last_name: profile_last_name,
            fotoclub_id: profile_fotoclub_id
          } : null),
          section: (section_id ? {
            section_id: section_id,
            name: section_name
          } : null)
        };
      }
      if (thumbnail_id) {
        // Solo agregar thumbnails únicos por id
        if (!grouped[contest_result_id].thumbnails.some(t => t.id === thumbnail_id)) {
          grouped[contest_result_id].thumbnails.push({
            id: thumbnail_id,
            url: thumbnail_url,
            type: thumbnail_type
          });
        }
      }
    }
    // Paginar los elementos únicos agrupados
    const allItems = Object.values(grouped);
    const pageCount = Math.ceil(allItems.length / perPage);
    const currentPage = page;
    const pagedItems = allItems.slice((page - 1) * perPage, page * perPage);

    res.json({
      items: pagedItems,
      _meta: {
        totalCount: allItems.length,
        pageCount,
        currentPage,
        perPage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// POST /disable_user
// Cambia el estado de un usuario mediante JSON: { id: number, status: 0 | 1 }
router.post('/disable_user', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = req.body?.id;
    const status = req.body?.status;
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Parámetro id inválido o faltante' });
    }
    if (!(status === 0 || status === 1)) {
      return res.status(400).json({ success: false, message: 'El campo status debe ser 0 o 1' });
    }
    if (!(req?.user?.role_id == '1')) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
    }
    const usuario = await global.knex('user').where({ id }).first();
    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const updates = { status, updated_at: new Date().toISOString() };
    if (status === 0) {
      updates.access_token = null;
    }
    const result = await global.knex('user').where({ id }).update(updates);
    await LogOperacion(
      req.user.id,
      (status === 0 ? 'Deshabilitar' : 'Habilitar') + ' Usuario - ' + req.user.username,
      JSON.stringify({ targetUserId: id, status }),
      new Date()
    );
    if (result === 1) {
      return res.json({
        success: true,
        message: status === 0 ? 'Usuario deshabilitado' : 'Usuario habilitado',
        data: { id, status }
      });
    } else {
      return res.status(500).json({ success: false, message: 'No se pudo actualizar el usuario' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado de usuario', error: error.message });
  }
});

module.exports = router;
