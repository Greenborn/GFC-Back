const express = require('express');
const router = express.Router();
const FotoDelAnioController = require('../controllers/foto_del_anio');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @route POST /api/foto-del-anio
 * @desc Registra o actualiza las fotos del año para una temporada específica
 * @access Private (Solo administradores)
 * @body {
 *   temporada: number,
 *   fotos: [{
 *     id_foto: number,
 *     puesto: string,
 *     orden: number,
 *     nombre_obra: string,
 *     nombre_autor: string,
 *     url_imagen: string
 *   }]
 * }
 */
router.post('/', adminMiddleware, FotoDelAnioController.registrarFotosDelAnio);

/**
 * @route GET /api/foto-del-anio/:temporada
 * @desc Obtiene las fotos del año de una temporada específica
 * @access Private (Solo administradores)
 */
router.get('/:temporada', adminMiddleware, FotoDelAnioController.obtenerFotosDelAnio);

/**
 * @route GET /api/foto-del-anio
 * @desc Obtiene todas las fotos del año agrupadas por temporada
 * @access Private (Solo administradores)
 */
router.get('/', adminMiddleware, FotoDelAnioController.obtenerTodasLasFotosDelAnio);

module.exports = router;