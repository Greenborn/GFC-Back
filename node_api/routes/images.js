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
            .select('id', 'code', 'title', 'profile_id', 'url')
            .where(function() {
                this.where('code', 'like', searchTerm)
                    .orWhere('title', 'like', searchTerm);
            })
            .orderBy('title', 'asc');

        // Log de la operación (sin usuario ya que es público)
        await LogOperacion(0, `Búsqueda de imágenes: "${q}"`, null, new Date());

        res.json({
            success: true,
            message: 'Búsqueda realizada correctamente',
            data: images,
            total: images.length,
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
            .select('id', 'code', 'title', 'profile_id', 'url')
            .orderBy('title', 'asc');

        // Log de la operación
        await LogOperacion(0, 'Consulta de todas las imágenes', null, new Date());

        res.json({
            success: true,
            message: 'Imágenes obtenidas correctamente',
            data: images,
            total: images.length
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