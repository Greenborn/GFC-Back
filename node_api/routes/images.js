const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const LogOperacion = require('../controllers/log_operaciones.js');
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
        const imagesWithFullUrl = images.map(image => ({
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
        }));

        // Log de la operación (sin usuario ya que es público)
        await LogOperacion(0, `Búsqueda de imágenes: "${q}"`, null, new Date());

        res.json({
            success: true,
            message: 'Búsqueda realizada correctamente',
            data: imagesWithFullUrl,
            total: imagesWithFullUrl.length,
            searchTerm: q.trim()
        });

    } catch (error) {
        console.error('Error en búsqueda de imágenes:', error);
        res.status(500).json({
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
        const imagesWithFullUrl = images.map(image => ({
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
        }));

        // Log de la operación
        await LogOperacion(0, 'Consulta de todas las imágenes', null, new Date());

        res.json({
            success: true,
            message: 'Imágenes obtenidas correctamente',
            data: imagesWithFullUrl,
            total: imagesWithFullUrl.length
        });

    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            data: []
        });
    }
});

function extractBase64(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  const raw = dataUri.includes('base64,') ? dataUri.split('base64,')[1] : dataUri;
  return raw;
}

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  const { code, title, profile_id, photo_base64, url } = req.body;

  if (!code || !title || !profile_id) {
    return res.status(400).json({ success: false, message: 'code, title y profile_id son requeridos' });
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

    if (photo_base64 && photo_base64.file) {
      const base64Data = extractBase64(photo_base64.file);
      if (!base64Data) {
        return res.status(400).json({ success: false, message: 'Formato de imagen inválido' });
      }

      const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || process.env.UPLOADS_BASE_PATH || './uploads';
      const imagesDir = path.join(uploadsBasePath, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const filename = `${Date.now()}_${uniqueSuffix}.jpg`;
      const filepath = path.join(imagesDir, filename);

      const buffer = Buffer.from(base64Data, 'base64');
      const outputBuffer = await sharp(buffer)
        .rotate()
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 100, mozjpeg: true })
        .toBuffer();

      fs.writeFileSync(filepath, outputBuffer);
      imageUrl = path.posix.join('images', filename);
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Debe proporcionar una imagen (photo_base64) o una url' });
    }

    const [insertRow] = await global.knex('image').insert({
      code,
      title,
      profile_id: Number(profile_id),
      url: imageUrl
    }).returning('id');
    const id = insertRow?.id ?? insertRow;

    const created = await global.knex('image').where({ id }).first();

    await LogOperacion(
      currentUser.id,
      `Creación de imagen - ${currentUser.username}`,
      JSON.stringify({ code, title, profile_id, id }),
      new Date()
    );

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error en POST /images:', error);
    res.status(500).json({ success: false, message: 'Error al crear imagen', error: error.message });
  }
});

module.exports = router; 