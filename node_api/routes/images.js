const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { logAction } = require('../utils/log.js');
const { insertAndGetId } = require('../utils/db.js');
const { extractBase64, getUploadsBasePath, ensureDir, processImageBuffer, getMimeType, getThumbnailGuard } = require('../utils/images.js');
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');

/**
 * @route GET /api/images/search
 * @desc Buscar fotografías por código o título
 * @access Public
 * @param {string} q - Término de búsqueda
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        // Validar que se proporcione un término de búsqueda
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El parámetro de búsqueda "q" es requerido',
                data: []
            });
        }

        const searchTerm = `%${q.trim()}%`;

        // Consultar imágenes que coincidan con el código o título
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
            .where(function() {
                this.where('image.code', 'like', searchTerm)
                    .orWhere('image.title', 'like', searchTerm);
            })
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

        await logAction({ user: null }, `Búsqueda de imágenes: "${q}"`);

        res.json({
            success: true,
            message: 'Búsqueda realizada correctamente',
            data: imagesWithFullUrl,
            total: imagesWithFullUrl.length,
            searchTerm: q.trim()
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