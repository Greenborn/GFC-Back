const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { logAction } = require('../utils/log.js');
const { insertAndGetId } = require('../utils/db.js');
const { extractBase64, getUploadsBasePath, ensureDir, processImageBuffer, saveImageFromBase64, getMimeType, getThumbnailGuard } = require('../utils/images.js');
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { baseUnaccent, sanitizeSearchTerm } = require('../utils/strings.js');
const { buildPaginationResponse } = require('../utils/pagination.js');

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

function applyImageSearchFilters(query, filters, joins) {
  const { filterProfileId, filterContestId, filterSectionIds, filterPrizes, filterCode, filterAuthor, filterCategoryIds, search } = filters;
  if (filterProfileId) {
    query = query.where('image.profile_id', filterProfileId);
  }
  if (filterContestId) {
    query = query.where('contest_result.contest_id', filterContestId);
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

/**
 * @route GET /api/images/search
 * @desc Buscar fotografías por código o título con filtros de concurso
 * @access Private
 * @param {string} q - Término de búsqueda (retrocompatibilidad, solo código/título)
 * @param {string} search - Término de búsqueda (title, code, prize, autor, sección, fotoclub)
 * @param {number} filter[contest_id] - Opcional
 * @param {number} filter[profile_id] - Opcional
 * @param {number|array} filter[section_id] - Opcional
 * @param {number|array} filter[category_id] - Opcional
 * @param {string|array} filter[prize] - Opcional
 * @param {string} filter[author] - Opcional
 * @param {string} filter[code] - Opcional
 * @param {string} sort / sort_dir - Opcional
 * @param {number} page / per-page - Opcional
 */
router.get('/search', authMiddleware, async (req, res) => {
    try {
        // ── Parse pagination ──
        const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
        const perPage = parseInt(req.query['per-page'], 10) > 0 ? parseInt(req.query['per-page'], 10) : 10;

        // ── Parse sort ──
        const sort = req.query.sort || '';
        const sortDir = req.query.sort_dir === 'desc' ? 'desc' : 'asc';

        // ── Parse filters ──
        const filterProfileId = Number(extractFilterString(req.query, 'profile_id')) || null;
        const filterContestId = Number(extractFilterString(req.query, 'contest_id')) || null;
        const filterSectionIds = extractFilterArray(req.query, 'section_id');
        const filterCategoryIds = extractFilterArray(req.query, 'category_id');
        const filterPrizes = extractFilterStringArray(req.query, 'prize');
        const filterAuthor = sanitizeSearchTerm(extractFilterString(req.query, 'author'));
        const filterCode = sanitizeSearchTerm(extractFilterString(req.query, 'code'));

        // ── Búsqueda: q (retrocompat, código/título) y/o search (multicampo) ──
        const q = (req.query.q || '').trim();
        const rawSearch = (req.query.search || '').trim();
        let search = sanitizeSearchTerm(rawSearch || q);
        if (q && !rawSearch) {
            search = sanitizeSearchTerm(q);
        }
        const needsSearchOrQ = !!(q || rawSearch);

        // ── Determine conditional joins needed for filtering ──
        const needsProfile = !!(search || filterAuthor || filterCategoryIds.length > 0);
        const needsSection = !!search;
        const needsFotoclub = !!(search && needsProfile);
        const needsMetric = !!(filterPrizes.length > 0 || search);

        // ── Base query ──
        let baseQuery = global.knex('contest_result')
            .leftJoin('image', 'contest_result.image_id', 'image.id');

        if (needsMetric) {
            baseQuery = baseQuery.leftJoin('metric', 'contest_result.metric_id', 'metric.id');
        }
        if (needsProfile) {
            baseQuery = baseQuery.leftJoin('profile', 'image.profile_id', 'profile.id');
        }
        if (needsSection) {
            baseQuery = baseQuery.leftJoin('section', 'contest_result.section_id', 'section.id');
        }
        if (needsFotoclub) {
            baseQuery = baseQuery.leftJoin('fotoclub', 'profile.fotoclub_id', 'fotoclub.id');
        }

        const joins = { profile: needsProfile, section: needsSection, fotoclub: needsFotoclub };

        // ── Apply filters ──
        baseQuery = applyImageSearchFilters(baseQuery, {
            filterProfileId, filterContestId, filterSectionIds, filterPrizes, filterCode,
            filterAuthor, filterCategoryIds, search
        }, joins);

        // ── Total count (unique images) ──
        const countRow = await baseQuery.clone().countDistinct({ total: 'image.id' }).first();
        const totalCount = Number(countRow?.total) || 0;
        const pageCount = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;
        const currentPage = page > pageCount ? pageCount : page;

        // ── Paginated unique image IDs with sorting ──
        const validSorts = { title: 'image.title', code: 'image.code' };
        let imageQuery = baseQuery.clone()
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

        let data = [];
        if (pagedImageIds.length > 0) {
            const rows = await global.knex('contest_result')
                .whereIn('contest_result.image_id', pagedImageIds)
                .leftJoin('image', 'contest_result.image_id', 'image.id')
                .leftJoin('profile', 'image.profile_id', 'profile.id')
                .leftJoin('section', 'contest_result.section_id', 'section.id')
                .leftJoin('contest', 'contest_result.contest_id', 'contest.id')
                .leftJoin('profile_contest', function() {
                    this.on('profile.id', '=', 'profile_contest.profile_id')
                         .andOn('contest.id', '=', 'profile_contest.contest_id');
                })
                .leftJoin('category', 'profile_contest.category_id', 'category.id')
                .select(
                    'image.id as id',
                    'image.code',
                    'image.title',
                    'image.profile_id',
                    'image.url',
                    'image.width',
                    'image.height',
                    'image.mime_type',
                    'image.image_metadata',
                    'profile.name as author_name',
                    'profile.last_name as author_last_name',
                    'section.name as section_name',
                    'contest.id as contest_id',
                    'contest.name as contest_name',
                    'contest.judged',
                    'contest.sub_title as contest_subtitle',
                    'category.id as category_id',
                    'category.name as category_name'
                );

            const imageMap = {};
            for (const r of rows) {
                if (!imageMap[r.id]) {
                    const isJudged = r.judged === true || r.judged === 1 || r.judged === 't';
                    const result = {
                        id: r.id,
                        code: r.code,
                        title: r.title,
                        profile_id: r.profile_id,
                        url: `${process.env.IMG_BASE_PATH || ''}${r.url}`,
                        author: `${r.author_name || ''} ${r.author_last_name || ''}`.trim() || 'Autor no disponible',
                        section: r.section_name || 'Sin sección asignada',
                        contest: r.contest_name ? {
                            id: r.contest_id,
                            name: r.contest_name,
                            subtitle: r.contest_subtitle
                        } : null,
                        category: r.category_name ? {
                            id: r.category_id,
                            name: r.category_name
                        } : null
                    };
                    if (!isJudged) {
                        delete result.width;
                        delete result.height;
                        delete result.mime_type;
                        delete result.image_metadata;
                    }
                    imageMap[r.id] = result;
                }
            }
            data = pagedImageIds.map(id => imageMap[id]).filter(Boolean);
        }

        await logAction(req, `Búsqueda de imágenes: "${q || rawSearch}"`);

        const pagination = buildPaginationResponse(req, totalCount, currentPage, perPage);

        res.json({
            success: true,
            message: 'Búsqueda realizada correctamente',
            data,
            total: data.length,
            totalCount,
            searchTerm: (q || rawSearch).trim(),
            ...pagination
        });

    } catch (error) {
        console.error('Error en búsqueda de imágenes:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            data: []
        });
    }
});

/**
 * @route GET /api/images/all
 * @desc Obtener todas las fotografías
 * @access Public
 */
router.get('/all', async (req, res) => {
    try {
        const images = await global.knex('image')
            .select(
                'image.id',
                'image.code',
                'image.title',
                'image.profile_id',
                'image.url',
                'profile.name as author_name',
                'profile.last_name as author_last_name',
                'section.name as section_name',
                'contest.id as contest_id',
                'contest.name as contest_name',
                'contest.judged',
                'contest.sub_title as contest_subtitle',
                'category.id as category_id',
                'category.name as category_name'
            )
            .leftJoin('profile', 'image.profile_id', 'profile.id')
            .leftJoin('contest_result', 'image.id', 'contest_result.image_id')
            .leftJoin('section', 'contest_result.section_id', 'section.id')
            .leftJoin('contest', 'contest_result.contest_id', 'contest.id')
            .leftJoin('profile_contest', function() {
                this.on('profile.id', '=', 'profile_contest.profile_id')
                     .andOn('contest.id', '=', 'profile_contest.contest_id');
            })
            .leftJoin('category', 'profile_contest.category_id', 'category.id')
            .orderBy('image.title', 'asc')
            .limit(10);

        // Agregar URL base a las imágenes y formatear nombre del autor, sección, concurso y categoría
        const imagesWithFullUrl = images.map(image => {
            const isJudged = image.judged === true || image.judged === 1 || image.judged === 't';
            const result = {
                ...image,
                url: `${process.env.IMG_BASE_PATH || ''}${image.url}`,
                author: `${image.author_name || ''} ${image.author_last_name || ''}`.trim() || 'Autor no disponible',
                section: image.section_name || 'Sin sección asignada',
                contest: image.contest_name ? {
                    id: image.contest_id,
                    name: image.contest_name,
                    subtitle: image.contest_subtitle
                } : null,
                category: image.category_name ? {
                    id: image.category_id,
                    name: image.category_name
                } : null
            };
            if (!isJudged) {
                delete result.width;
                delete result.height;
                delete result.mime_type;
                delete result.image_metadata;
            }
            return result;
        });

        await logAction({ user: null }, 'Consulta de todas las imágenes');

        res.json({
            success: true,
            message: 'Imágenes obtenidas correctamente',
            data: imagesWithFullUrl,
            total: imagesWithFullUrl.length
        });

    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            data: []
        });
    }
});

async function generateThumbnails(imageId, sourcePath) {
  try {
    const types = await global.knex('thumbnail_type').select('*');
    if (!types || types.length === 0) return;

    const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || process.env.UPLOADS_BASE_PATH || './uploads';
    const year = new Date().getFullYear().toString();
    const thumbDir = path.join(uploadsBasePath, 'thumbnails', year);

    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    for (const t of types) {
      const timestamp = Date.now();
      const filename = `${t.width}_.${t.height}_${imageId}_${timestamp}.jpg`;
      const filepath = path.join(thumbDir, filename);

      const outputBuffer = await sharp(sourcePath)
        .rotate()
        .resize(t.width, t.height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      fs.writeFileSync(filepath, outputBuffer);

      const existing = await global.knex('thumbnail')
        .where({ image_id: imageId, thumbnail_type: t.id })
        .first();

      const thumbUrl = path.posix.join('thumbnails', year, filename);

      if (existing) {
        await global.knex('thumbnail').where({ id: existing.id }).update({ url: thumbUrl });
      } else {
        await global.knex('thumbnail').insert({
          image_id: imageId,
          thumbnail_type: t.id,
          url: thumbUrl
        });
      }
    }
  } catch (err) {
    console.error(`[Thumbnails] Error generando thumbnails para image_id=${imageId}:`, err.message);
  }
}



router.post('/', authMiddleware, writeProtection, async (req, res) => {
  const { title, profile_id, photo_base64, url } = req.body;

  if (!title || !profile_id) {
    return res.status(400).json({ success: false, message: 'title y profile_id son requeridos' });
  }

  try {
    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isConcursante = String(currentUser.role_id) === '3';

    if (isConcursante && Number(profile_id) !== Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'No puede crear una imagen para un perfil que no le pertenece' });
    }

    if (isAdmin && Number(profile_id) === Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'Un administrador no puede crear imágenes para su propio perfil' });
    }

    let imageUrl = (url && url !== '_') ? url : null;
    let imgResult = null;

    if (photo_base64 && photo_base64.file) {
      imgResult = await saveImageFromBase64(photo_base64.file);
      if (!imgResult) {
        return res.status(400).json({ success: false, message: 'Formato de imagen inválido' });
      }
      imageUrl = imgResult.url;
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Debe proporcionar una imagen (photo_base64) o una url' });
    }

    const code = `temp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const insertData = {
      code,
      title,
      profile_id: Number(profile_id),
      url: imageUrl
    };

    if (imgResult) {
      insertData.width = imgResult.width;
      insertData.height = imgResult.height;
      insertData.mime_type = getMimeType(imgResult.format);
    }

    const id = await insertAndGetId(global.knex, 'image', insertData);

    const created = await global.knex('image').where({ id }).first();

    const guard = getThumbnailGuard(id, created.url);
    if (guard) generateThumbnails(guard.imageId, guard.sourcePath);

    await logAction(req, `Creación de imagen - ${req.user.username}`, JSON.stringify({ code, title, profile_id, id }));

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error en POST /images:', error);
    return res.status(500).json({ success: false, message: 'Error al crear imagen', error: error.message });
  }
});

router.put('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const existing = await global.knex('image').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }

    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isConcursante = String(currentUser.role_id) === '3';

    const { title, url, profile_id, photo_base64 } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title;

    if (profile_id !== undefined) {
      const newProfileId = Number(profile_id);
      if (isConcursante && newProfileId !== Number(currentUser.profile_id)) {
        return res.status(403).json({ success: false, message: 'No puede modificar una imagen para un perfil que no le pertenece' });
      }
      if (isAdmin && newProfileId === Number(currentUser.profile_id)) {
        return res.status(403).json({ success: false, message: 'Un administrador no puede modificar imágenes de su propio perfil' });
      }
      updateData.profile_id = newProfileId;
    }

    if (url !== undefined && url !== '_') {
      updateData.url = url;
    }

    if (photo_base64 && photo_base64.file) {
      const result = await saveImageFromBase64(photo_base64.file);
      if (result) {
        updateData.url = result.url;
        updateData.width = result.width;
        updateData.height = result.height;
        updateData.mime_type = getMimeType(result.format);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar' });
    }

    await global.knex('image').where({ id }).update(updateData);
    const updated = await global.knex('image').where({ id }).first();

    const guard = getThumbnailGuard(id, updated.url);
    if (guard) generateThumbnails(guard.imageId, guard.sourcePath);

    await logAction(req, `Actualización de imagen id=${id} - ${req.user.username}`, JSON.stringify(updateData));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error en PUT /images/:id:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar imagen', error: error.message });
  }
});

router.delete('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const existing = await global.knex('image').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }

    const currentUser = req.user;
    const isAdmin = String(currentUser.role_id) === '1';
    const isConcursante = String(currentUser.role_id) === '3';

    if (isConcursante && Number(existing.profile_id) !== Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'No puede eliminar una imagen que no le pertenece' });
    }
    if (isAdmin && Number(existing.profile_id) === Number(currentUser.profile_id)) {
      return res.status(403).json({ success: false, message: 'Un administrador no puede eliminar sus propias imágenes' });
    }

    await global.knex('thumbnail').where({ image_id: id }).del();
    await global.knex('image').where({ id }).del();

    await logAction(req, `Eliminación de imagen id=${id} - ${req.user.username}`, JSON.stringify({ code: existing.code, title: existing.title, profile_id: existing.profile_id }));

    res.json({ success: true, message: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('Error en DELETE /images/:id:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar imagen', error: error.message });
  }
});

module.exports = router;
module.exports.generateThumbnails = generateThumbnails;