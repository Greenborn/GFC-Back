const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const LogOperacion = require('../controllers/log_operaciones.js');

// GET /contest-result?expand=profile,profile.user,profile.fotoclub,image.profile,image.thumbnail&filter[contest_id]=51
router.get('/contest-result', authMiddleware, async (req, res) => {
  try {
    let contestId = req.query['filter[contest_id]'];
    if (!contestId && req.query.filter && typeof req.query.filter === 'object') {
      contestId = req.query.filter.contest_id;
    }
    if (!contestId) {
      return res.status(400).json({ message: 'Falta contest_id en el filtro' });
    }

    const expand = req.query.expand ? req.query.expand.split(',').map(v => v.trim()).filter(Boolean) : [];
    const expandImageProfile = expand.includes('image.profile') || expand.includes('profile');
    const expandImageThumbnail = expand.includes('image.thumbnail') || expand.includes('thumbnail');
    const expandProfileUser = expand.includes('profile.user');
    const expandProfileFotoclub = expand.includes('profile.fotoclub');

    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const perPage = parseInt(req.query['per-page'], 10) > 0 ? parseInt(req.query['per-page'], 10) : 20;

    const selectColumns = [
      'contest_result.id as id',
      'contest_result.contest_id',
      'contest_result.image_id',
      'contest_result.metric_id',
      'contest_result.section_id',
      global.knex.raw('NULL as type'),
      global.knex.raw('NULL as temporada'),
      'image.id as image_id',
      'image.code as image_code',
      'image.title as image_title',
      'image.url as image_url',
      'image.profile_id as image_profile_id',
      'metric.id as metric_id',
      'metric.prize as metric_prize',
      'metric.score as metric_score',
      'metric.dni as metric_dni',
      'thumbnail.id as thumbnail_id',
      'thumbnail.url as thumbnail_url',
      'thumbnail.thumbnail_type as thumbnail_type'
    ];

    if (expandImageProfile) {
      selectColumns.push(
        'profile.id as profile_id',
        'profile.name as profile_name',
        'profile.last_name as profile_last_name',
        'profile.fotoclub_id as profile_fotoclub_id',
        'profile.img_url as profile_img_url',
        'profile.executive as profile_executive',
        'profile.executive_rol as profile_executive_rol',
        'profile.dni as profile_dni'
      );
    }
    if (expandProfileUser) {
      selectColumns.push(
        'user.id as user_id',
        'user.username as user_username',
        'user.email as user_email',
        'user.dni as user_dni'
      );
    }
    if (expandProfileFotoclub) {
      selectColumns.push(
        'fotoclub.id as fotoclub_id',
        'fotoclub.name as fotoclub_name',
        'fotoclub.photo_url as fotoclub_photo_url'
      );
    }

    let query = global.knex('contest_result')
      .where('contest_result.contest_id', contestId)
      .leftJoin('image', 'contest_result.image_id', 'image.id')
      .leftJoin('metric', 'contest_result.metric_id', 'metric.id')
      .leftJoin('thumbnail', 'image.id', 'thumbnail.image_id');

    if (expandImageProfile) {
      query = query.leftJoin('profile', 'image.profile_id', 'profile.id');
    }
    if (expandProfileUser) {
      query = query.leftJoin('user', 'profile.id', 'user.profile_id');
    }
    if (expandProfileFotoclub) {
      query = query.leftJoin('fotoclub', 'profile.fotoclub_id', 'fotoclub.id');
    }

    const itemsRaw = await query.select(selectColumns);

    const grouped = {};
    for (const item of itemsRaw) {
      const {
        id,
        contest_id,
        image_id,
        metric_id,
        section_id,
        type,
        temporada,
        image_code,
        image_title,
        image_url,
        image_profile_id,
        metric_prize,
        metric_score,
        metric_dni,
        thumbnail_id,
        thumbnail_url,
        thumbnail_type,
        profile_id,
        profile_name,
        profile_last_name,
        profile_fotoclub_id,
        profile_img_url,
        profile_executive,
        profile_executive_rol,
        profile_dni,
        user_id,
        user_username,
        user_email,
        user_dni,
        fotoclub_id,
        fotoclub_name,
        fotoclub_photo_url,
        ...rest
      } = item;

      if (!grouped[id]) {
        const image = image_id ? {
          id: image_id,
          code: image_code,
          title: image_title,
          profile_id: image_profile_id,
          url: image_url
        } : null;

        if (expandImageProfile && profile_id && image) {
          image.profile = {
            id: profile_id,
            name: profile_name,
            last_name: profile_last_name,
            fotoclub_id: profile_fotoclub_id,
            img_url: profile_img_url,
            executive: profile_executive,
            executive_rol: profile_executive_rol,
            dni: profile_dni
          };

          if (expandProfileUser && user_id) {
            image.profile.user = {
              id: user_id,
              username: user_username,
              email: user_email,
              dni: user_dni
            };
          }
          if (expandProfileFotoclub && fotoclub_id) {
            image.profile.fotoclub = {
              id: fotoclub_id,
              name: fotoclub_name,
              photo_url: fotoclub_photo_url
            };
          }
        }

        grouped[id] = {
          id,
          contest_id,
          image_id,
          metric_id,
          section_id,
          type: null,
          temporada: null,
          image,
          metric: metric_id ? {
            id: metric_id,
            prize: metric_prize,
            score: metric_score,
            dni: metric_dni
          } : null
        };
      }

      if (thumbnail_id && grouped[id].image) {
        const currentThumbnail = grouped[id].image.thumbnail;
        if (!currentThumbnail || (thumbnail_type === 1 && currentThumbnail.thumbnail_type !== 1)) {
          grouped[id].image.thumbnail = {
            id: thumbnail_id,
            url: thumbnail_url,
            thumbnail_type: thumbnail_type
          };
        }
      }
    }

    const allItems = Object.values(grouped);
    const pageCount = allItems.length > 0 ? Math.ceil(allItems.length / perPage) : 1;
    const currentPage = page > pageCount ? pageCount : page;
    const pagedItems = allItems.slice((currentPage - 1) * perPage, currentPage * perPage);

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const buildLink = (pageNumber) => {
      const params = new URLSearchParams();
      Object.entries(req.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
      params.set('page', String(pageNumber));
      params.set('per-page', String(perPage));
      if (!params.has('viewpage')) {
        params.set('viewpage', 'contest-result');
      }
      return `${baseUrl}?${params.toString()}`;
    };

    res.json({
      items: pagedItems,
      _meta: {
        totalCount: allItems.length,
        pageCount,
        currentPage,
        perPage
      },
      _links: {
        self: { href: buildLink(currentPage) },
        first: { href: buildLink(1) },
        last: { href: buildLink(pageCount) }
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

// GET /foto-del-anio - Endpoint público para listar fotos del año de la última temporada
router.get('/foto-del-anio', async (req, res) => {
  try {
    // Obtener la última temporada (el valor máximo de temporada)
    const maxTemporadaResult = await global.knex('foto_del_anio')
      .max('temporada as max_temporada')
      .first();

    const maxTemporada = maxTemporadaResult?.max_temporada;

    if (!maxTemporada) {
      return res.json({
        items: [],
        temporada: null
      });
    }

    // Obtener los registros de la última temporada ordenados por orden
    const items = await global.knex('foto_del_anio')
      .where('temporada', maxTemporada)
      .orderBy('orden', 'asc')
      .select([
        'id',
        'id_foto',
        'puesto',
        'orden',
        'temporada',
        'nombre_obra',
        'nombre_autor',
        'url_imagen'
      ]);

    // Obtener IDs de fotos únicos
    const fotoIds = [...new Set(items.map(f => f.id_foto))];

    // Obtener todas las miniaturas de las fotos en una sola consulta
    const thumbnails = await global.knex('thumbnail')
      .whereIn('image_id', fotoIds)
      .select('*');

    // Crear mapa de miniaturas por image_id
    const thumbnailsMap = {};
    thumbnails.forEach(thumb => {
      if (!thumbnailsMap[thumb.image_id]) {
        thumbnailsMap[thumb.image_id] = [];
      }
      thumbnailsMap[thumb.image_id].push(thumb);
    });

    // Agregar miniaturas a cada foto
    const itemsConThumbnails = items.map(foto => ({
      ...foto,
      thumbnails: thumbnailsMap[foto.id_foto] || []
    }));

    // Obtener URL de grabación desde contests_records si existe
    const contestRecord = await global.knex('contests_records')
      .where('type', 'FOTO_DEL_ANIO')
      .andWhere('temporada', maxTemporada)
      .first();

    res.json({
      items: itemsConThumbnails,
      temporada: maxTemporada,
      url_grabacion: contestRecord?.url || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
