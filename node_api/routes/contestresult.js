const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const { logAction } = require('../utils/log.js');
const { sanitizarNombreSeccion, sanitizeSearchTerm, baseUnaccent } = require('../utils/strings.js');
const { insertAndGetId } = require('../utils/db.js');
const { buildPaginationResponse } = require('../utils/pagination.js');
const { createCache } = require('../utils/cache');

const contestResultCache = createCache(24 * 60 * 60 * 1000);

function cacheKeyFromQuery(query) {
  const sorted = {};
  Object.keys(query).sort().forEach(k => { sorted[k] = query[k]; });
  return JSON.stringify(sorted);
}

// GET /contest-result?expand=profile,profile.user,profile.fotoclub,image.profile,image.thumbnail&filter[contest_id]=58&page=1&per-page=20&search=paisaje&sort=title&sort_dir=asc&filter[section_id]=1&filter[section_id]=3&filter[category_id]=2&filter[prize]=Oro&filter[author]=García&filter[code]=ABC
router.get('/contest-result', authMiddleware, async (req, res) => {
  try {
    // ── Parse required ──
    let contestId = req.query['filter[contest_id]'];
    if (!contestId && req.query.filter && typeof req.query.filter === 'object') {
      contestId = req.query.filter.contest_id;
    }
    if (!contestId) {
      return res.status(400).json({ message: 'Falta contest_id en el filtro' });
    }

    // ── Fetch contest ──
    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    // ── Parse profile_id filter ──
    let filterProfileId = null;
    const bracketProfileId = req.query['filter[profile_id]'];
    if (bracketProfileId) {
      filterProfileId = Number(bracketProfileId);
    } else if (req.query.filter && req.query.filter.profile_id) {
      filterProfileId = Number(req.query.filter.profile_id);
    }

    // ── Sólo aplicar filterProfileId si el usuario es admin/delegado, el concurso está juzgado, o es su propio perfil ──
    const esAdmin = String(req.user.role_id) === '1';
    const esDelegado = String(req.user.role_id) === '2';
    const userProfileId = req.user ? Number(req.user.profile_id) : null;
    const esPropioPerfil = filterProfileId && userProfileId && filterProfileId === userProfileId;
    if (filterProfileId && !esAdmin && !esDelegado && !contest.judged && !esPropioPerfil) {
      filterProfileId = null;
    }

    // ── Parse expand ──
    const expand = req.query.expand ? req.query.expand.split(',').map(v => v.trim()).filter(Boolean) : [];
    const expandImageProfile = expand.includes('image.profile') || expand.includes('profile');
    const expandImageThumbnail = expand.includes('image.thumbnail') || expand.includes('thumbnail');
    const expandProfileUser = expand.includes('profile.user');
    const expandProfileFotoclub = expand.includes('profile.fotoclub');

    // ── Parse pagination ──
    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const perPage = parseInt(req.query['per-page'], 10) > 0 ? parseInt(req.query['per-page'], 10) : 20;

    // ── Parse new filter/sort params ──
    const sort = req.query.sort || '';
    const sortDir = req.query.sort_dir === 'desc' ? 'desc' : 'asc';

    // Extract multi-value filters (support both bracket and dot notation)
    const filterSectionIds = extractFilterArray(req.query, 'section_id');
    const filterCategoryIds = extractFilterArray(req.query, 'category_id');
    const filterPrizes = extractFilterStringArray(req.query, 'prize');
    const rawSearch = (req.query.search || '').trim();
    const filterAuthor = sanitizeSearchTerm(extractFilterString(req.query, 'author'));
    const filterCode = sanitizeSearchTerm(extractFilterString(req.query, 'code'));
    const search = sanitizeSearchTerm(rawSearch);

    const crCacheKey = contest.judged ? 'cr:' + cacheKeyFromQuery(req.query) : null;
    if (crCacheKey) {
      const cached = contestResultCache.getIfPresent(crCacheKey);
      if (cached) return res.json(cached);
    }

    // ── Determine conditional joins needed for filtering/sorting ──
    const needsProfile = !!(search || sort === 'author' || filterAuthor || filterCategoryIds.length > 0);
    const needsSection = !!search;
    const needsFotoclub = !!(search && needsProfile);

    // ── Build filter query (base for COUNT + paginated IDs) ──
    let filterQuery = global.knex('contest_result')
      .where('contest_result.contest_id', contestId)
      .leftJoin('image', 'contest_result.image_id', 'image.id')
      .leftJoin('metric', 'contest_result.metric_id', 'metric.id');

    if (needsProfile) {
      filterQuery = filterQuery.leftJoin('profile', 'image.profile_id', 'profile.id');
    }
    if (needsSection) {
      filterQuery = filterQuery.leftJoin('section', 'contest_result.section_id', 'section.id');
    }
    if (needsFotoclub) {
      filterQuery = filterQuery.leftJoin('fotoclub', 'profile.fotoclub_id', 'fotoclub.id');
    }

    const filterJoins = { profile: needsProfile, section: needsSection, fotoclub: needsFotoclub };
    filterQuery = applyContestResultFilters(filterQuery, {
      filterProfileId, filterSectionIds, filterPrizes, filterCode, filterAuthor, filterCategoryIds, search
    }, filterJoins);

    // ── Total count (unique images matching filters) ──
    const countRow = await filterQuery.clone().countDistinct({ total: 'image.id' }).first();
    const totalCount = Number(countRow?.total) || 0;
    const pageCount = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;
    const currentPage = page > pageCount ? pageCount : page;

    // ── Paginated unique image IDs with sorting ──
    const validSorts = { title: 'image.title', prize: 'metric.score', code: 'image.code' };

    let imageQuery = filterQuery.clone()
      .select('image.id')
      .whereNotNull('image.id')
      .groupBy('image.id');

    if (sort === 'author' && needsProfile) {
      imageQuery = imageQuery
        .select(global.knex.raw(
          "MIN(" + baseUnaccent("CONCAT_WS(' ', profile.name, profile.last_name)") + ") as sort_value"
        ))
        .orderByRaw("MIN(" + baseUnaccent("CONCAT_WS(' ', profile.name, profile.last_name)") + ") " + sortDir)
        .orderBy('image.id', sortDir === 'desc' ? 'desc' : 'asc');
    } else if (validSorts[sort]) {
      imageQuery = imageQuery
        .select(global.knex.raw('MIN(??) as sort_value', [validSorts[sort]]))
        .orderByRaw('MIN(??) ' + sortDir, [validSorts[sort]])
        .orderBy('image.id', sortDir);
    } else {
      imageQuery = imageQuery
        .select(global.knex.raw('MIN(??) as sort_value', ['image.code']))
        .orderByRaw('MIN(??) ' + sortDir, ['image.code'])
        .orderBy('image.id', sortDir);
    }

    const pagedImageRows = await imageQuery
      .offset((currentPage - 1) * perPage)
      .limit(perPage);

    const pagedImageIds = pagedImageRows.map(r => r.id);

    // ── Early return if no results ──
    if (pagedImageIds.length === 0) {
      const pagination = buildPaginationResponse(req, totalCount, currentPage, perPage);
      const result = { items: [], ...pagination };
      if (crCacheKey) contestResultCache.set(crCacheKey, result);
      return res.json(result);
    }

    // ── Full data query (with filters applied) for all contest_results of paginated images ──
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

    // ── Determine which joins are needed for data display ──
    const dataJoins = {
      profile: expandImageProfile || expandProfileUser || expandProfileFotoclub || (needsProfile && (search || filterAuthor)),
      section: needsSection && search,
      fotoclub: expandProfileFotoclub || (needsFotoclub && search),
      user: expandProfileUser
    };

    let dataQuery = global.knex('contest_result')
      .whereIn('contest_result.image_id', pagedImageIds)
      .where('contest_result.contest_id', contestId)
      .leftJoin('image', 'contest_result.image_id', 'image.id')
      .leftJoin('metric', 'contest_result.metric_id', 'metric.id')
      .leftJoin('thumbnail', 'image.id', 'thumbnail.image_id');

    if (dataJoins.profile) {
      dataQuery = dataQuery.leftJoin('profile', 'image.profile_id', 'profile.id');
    }
    if (dataJoins.section) {
      dataQuery = dataQuery.leftJoin('section', 'contest_result.section_id', 'section.id');
    }
    if (dataJoins.user) {
      dataQuery = dataQuery.leftJoin('user', 'profile.id', 'user.profile_id');
    }
    if (dataJoins.fotoclub) {
      dataQuery = dataQuery.leftJoin('fotoclub', 'profile.fotoclub_id', 'fotoclub.id');
    }

    dataQuery = applyContestResultFilters(dataQuery, {
      filterProfileId, filterSectionIds, filterPrizes, filterCode, filterAuthor, filterCategoryIds, search
    }, { profile: dataJoins.profile, section: dataJoins.section, fotoclub: dataJoins.fotoclub });

    const itemsRaw = await dataQuery.select(selectColumns);

    // ── Group in memory (handles 1:N thumbnail join) + index by image ──
    const grouped = {};
    const crIdsByImage = {};
    for (const item of itemsRaw) {
      const {
        id,
        contest_id,
        image_id,
        metric_id,
        section_id,
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
        fotoclub_photo_url
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

        if (!crIdsByImage[image_id]) crIdsByImage[image_id] = [];
        crIdsByImage[image_id].push(id);
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

    // ── Flatten by image order (same image never split across pages) ──
    const allItems = [];
    for (const imgId of pagedImageIds) {
      const crIds = crIdsByImage[imgId];
      if (crIds) {
        crIds.sort((a, b) => a - b);
        for (const crId of crIds) {
          allItems.push(grouped[crId]);
        }
      }
    }

    const pagination = buildPaginationResponse(req, totalCount, currentPage, perPage);
    const result = { items: allItems, ...pagination };
    if (crCacheKey) contestResultCache.set(crCacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en GET /contest-result:', error);
    return res.status(500).json({ message: 'Error interno' });
  }
});



function extractFilterArray(query, key) {
  const vals = [];
  const bracket = query[`filter[${key}]`];
  if (Array.isArray(bracket)) {
    bracket.forEach(v => { const n = Number(v); if (!isNaN(n)) vals.push(n); });
  } else if (bracket !== undefined && bracket !== null) {
    const n = Number(bracket); if (!isNaN(n)) vals.push(n);
  }
  if (query.filter && query.filter[key] !== undefined) {
    const src = query.filter[key];
    if (Array.isArray(src)) {
      src.forEach(v => { const n = Number(v); if (!isNaN(n)) vals.push(n); });
    } else {
      const n = Number(src); if (!isNaN(n)) vals.push(n);
    }
  }
  return [...new Set(vals)];
}

function extractFilterStringArray(query, key) {
  const vals = [];
  const bracket = query[`filter[${key}]`];
  if (Array.isArray(bracket)) {
    bracket.forEach(v => { if (v) vals.push(v); });
  } else if (bracket) {
    vals.push(bracket);
  }
  if (query.filter && query.filter[key] !== undefined) {
    const src = query.filter[key];
    if (Array.isArray(src)) {
      src.forEach(v => { if (v) vals.push(v); });
    } else if (src) {
      vals.push(src);
    }
  }
  return [...new Set(vals)];
}

function extractFilterString(query, key) {
  const bracket = query[`filter[${key}]`];
  if (bracket) return bracket;
  if (query.filter && query.filter[key]) return query.filter[key];
  return '';
}

// ── Apply contest result filters (shared between count + data queries) ──

function applyContestResultFilters(query, filters, joins) {
  const { filterProfileId, filterSectionIds, filterPrizes, filterCode, filterAuthor, filterCategoryIds, search } = filters;
  if (filterProfileId) {
    query = query.where('image.profile_id', filterProfileId);
  }
  if (filterSectionIds.length > 0) {
    query = query.whereIn('contest_result.section_id', filterSectionIds);
  }
  if (filterPrizes.length > 0) {
    query = query.whereIn('metric.prize', filterPrizes);
  }
  if (filterCode) {
    query = query.whereRaw(baseUnaccent('image.code') + ' LIKE ?', [`%${filterCode}%`]);
  }
  if (filterAuthor && joins.profile) {
    query = query.whereRaw(
      baseUnaccent('CONCAT_WS(\' \', profile.name, profile.last_name)') + ' LIKE ?',
      [`%${filterAuthor}%`]
    );
  }
  if (filterCategoryIds.length > 0) {
    query = query.whereExists(function () {
      this.select('*')
        .from('profile_contest')
        .whereRaw('profile_contest.profile_id = image.profile_id')
        .whereRaw('profile_contest.contest_id = contest_result.contest_id')
        .whereIn('profile_contest.category_id', filterCategoryIds);
    });
  }
  if (search) {
    query = query.andWhere(function () {
      this.whereRaw(baseUnaccent('image.title') + ' LIKE ?', [`%${search}%`])
        .orWhereRaw(baseUnaccent('image.code') + ' LIKE ?', [`%${search}%`])
        .orWhereRaw(baseUnaccent('metric.prize') + ' LIKE ?', [`%${search}%`]);
      if (joins.profile) {
        this.orWhereRaw(
          baseUnaccent('CONCAT_WS(\' \', profile.name, profile.last_name)') + ' LIKE ?',
          [`%${search}%`]
        );
      }
      if (joins.section) {
        this.orWhereRaw(baseUnaccent('section.name') + ' LIKE ?', [`%${search}%`]);
      }
      if (joins.fotoclub) {
        this.orWhereRaw(baseUnaccent('fotoclub.name') + ' LIKE ?', [`%${search}%`]);
      }
    });
  }
  return query;
}

// POST /contest-result — Crear un resultado de concurso
router.post('/contest-result', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { contest_id, image_id, metric_id, section_id } = req.body;

    if (!contest_id || !image_id || !metric_id || !section_id) {
      return res.status(400).json({ success: false, message: 'contest_id, image_id, metric_id y section_id son requeridos' });
    }

    const id = await insertAndGetId(global.knex, 'contest_result', {
      contest_id: Number(contest_id),
      image_id: Number(image_id),
      metric_id: Number(metric_id),
      section_id: Number(section_id)
    });

    // ── Generar código de imagen en formato [random4d]_[año]_[id_concurso]_[nombre_seccion]_[id_image] ──
    await generarCodigoImagen(global.knex, image_id, contest_id, section_id);

    const created = await global.knex('contest_result').where({ id }).first();

    await logAction(req, `Creación de resultado de concurso - ${req.user.username}`, JSON.stringify({ contest_id, image_id, metric_id, section_id }));

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error en POST /contest-result:', error);
    return res.status(500).json({ success: false, message: 'Error al crear resultado de concurso', error: error.message });
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
    await logAction(req, (status === 0 ? 'Deshabilitar' : 'Habilitar') + ' Usuario - ' + req.user.username, JSON.stringify({ targetUserId: id, status }));
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
    console.error('Error en GET /foto-del-anio:', error);
    return res.status(500).json({ message: 'Error interno' });
  }
});

// DELETE /contest-result/:id — Eliminar un resultado de concurso
router.delete('/contest-result/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const existing = await global.knex('contest_result').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resultado de concurso no encontrado' });
    }

    await global.knex('contest_result').where({ id }).del();

    await logAction(req, `Eliminación de resultado de concurso id=${id} - ${req.user.username}`, JSON.stringify(existing));

    res.json({ success: true, message: 'Resultado de concurso eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE /contest-result/:id:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar resultado de concurso', error: error.message });
  }
});

// ── Generar código de imagen ──
// Formato: [random4d]_[año]_[id_concurso]_[nombre_seccion]_[id_image]
async function generarCodigoImagen(knex, imageId, contestId, sectionId) {
  const image = await knex('image').where({ id: imageId }).first();
  if (!image) return;

  const section = sectionId ? await knex('section').where({ id: sectionId }).first() : null;
  const year = new Date().getFullYear().toString();
  const sectionName = section
    ? sanitizarNombreSeccion(section.name)
    : 'sin_seccion';

  let randomNum;
  let attempts = 0;
  do {
    randomNum = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await knex('image')
      .join('contest_result', 'image.id', 'contest_result.image_id')
      .where('contest_result.contest_id', contestId)
      .where('image.code', 'like', randomNum + '%')
      .whereNot('image.id', imageId)
      .first();
    if (!existing) break;
    attempts++;
  } while (attempts < 50);

  const newCode = `${randomNum}_${year}_${contestId}_${sectionName}_${imageId}`;
  await knex('image').where({ id: imageId }).update({ code: newCode });
}



module.exports = router;
