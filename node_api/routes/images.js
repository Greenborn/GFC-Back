const express = require('express');
const router = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');

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
                'profile.last_name as author_last_name'
            )
            .leftJoin('profile', 'image.profile_id', 'profile.id')
            .where(function() {
                this.where('image.code', 'like', searchTerm)
                    .orWhere('image.title', 'like', searchTerm);
            })
            .orderBy('image.title', 'asc')
            .limit(10);

        // Agregar URL base a las imágenes y formatear nombre del autor
        const imagesWithFullUrl = images.map(image => ({
            ...image,
            url: `${process.env.IMG_BASE_PATH || ''}${image.url}`,
            author: `${image.author_name || ''} ${image.author_last_name || ''}`.trim() || 'Autor no disponible'
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
                'profile.last_name as author_last_name'
            )
            .leftJoin('profile', 'image.profile_id', 'profile.id')
            .orderBy('image.title', 'asc')
            .limit(10);

        // Agregar URL base a las imágenes y formatear nombre del autor
        const imagesWithFullUrl = images.map(image => ({
            ...image,
            url: `${process.env.IMG_BASE_PATH || ''}${image.url}`,
            author: `${image.author_name || ''} ${image.author_last_name || ''}`.trim() || 'Autor no disponible'
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

module.exports = router; 