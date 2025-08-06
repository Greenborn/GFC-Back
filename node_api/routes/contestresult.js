const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

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

    // Query principal: contest_result + joins
    // Selección explícita de columnas para evitar ambigüedad
    let selectColumns = [
      'contest_result.id as contest_result_id',
      'contest_result.contest_id',
      'contest_result.image_id as contest_result_image_id'
    ];

    let query = global.knex('contest_result')
      .where('contest_result.contest_id', contestId)
      .leftJoin('image', 'contest_result.image_id', 'image.id');

    // Expansiones correctas: image -> profile -> user/fotoclub
    if (expand.includes('profile')) {
      query = query.leftJoin('profile', 'image.profile_id', 'profile.id');
      selectColumns = selectColumns.concat([
        'profile.id as profile_id',
        'profile.name as profile_name',
        'profile.last_name as profile_last_name',
        'profile.fotoclub_id as profile_fotoclub_id'
      ]);
    }
    // Eliminar joins y selects de user y fotoclub (no existen en profile)
    if (expand.includes('image.profile') || expand.includes('image.thumbnail')) {
      // Ya está el join a image arriba
      selectColumns = selectColumns.concat([
        'image.id as image_id',
        'image.profile_id as image_profile_id',
        'image.url as image_url',
        'image.title as image_title',
        'image.code as image_code'
      ]);
    }

    query = query.select(selectColumns);

    const items = await query;

    // Meta y links (simples, no paginación real)
    const totalCount = items.length;
    const perPage = 1000;
    const pageCount = 1;
    const currentPage = 1;
    const baseUrl = req.protocol + '://' + req.get('host') + req.originalUrl.split('?')[0];
    const filterStr = `filter[contest_id]=${contestId}`;
    const expandStr = expand.length ? `expand=${expand.join(',')}` : '';
    const queryStr = [expandStr, filterStr].filter(Boolean).join('&');
    const link = baseUrl + (queryStr ? '?' + queryStr : '');

    res.json({
      items,
      _meta: {
        totalCount,
        pageCount,
        currentPage,
        perPage
      },
      _links: {
        self: { href: link },
        first: { href: link },
        last: { href: link }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
