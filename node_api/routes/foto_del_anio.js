const express = require('express');
const router = express.Router();
const FotoDelAnioController = require('../controllers/foto_del_anio');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @route POST /api/foto-del-anio
 * @desc Registra o actualiza las fotos del año para una temporada específica
 * @access Private (Solo administradores)
 * @body {
 *   raiz: string, // Ej: "Fotos del año 2025"
 *   directorios: {
 *     eleccion_jurado: { archivos: [string] },
 *     eleccion_publico: { archivos: [string] },
 *     estimulo: {
 *       subdirectorios: {
 *         sub_seccion: { subdirectorios: { eleccion_jurado: { archivos: [string] } } },
 *         color: { subdirectorios: { eleccion_jurado: { archivos: [string] } } },
 *         monocromo: { subdirectorios: { eleccion_jurado: { archivos: [string] } } }
 *       }
 *     },
 *     primera: {
 *       subdirectorios: {
 *         sub_seccion: { subdirectorios: { eleccion_jurado: { archivos: [string] } } },
 *         color: { subdirectorios: { eleccion_jurado: { archivos: [string] } } },
 *         monocromo: { subdirectorios: { eleccion_jurado: { archivos: [string] } } }
 *       }
 *     }
 *   }
 * }
 * @description
 * Procesa una estructura jerárquica de directorios con fotografías seleccionadas.
 * Extrae exactamente 8 fotografías de ubicaciones específicas:
 * - 1 foto general - elección jurado
 * - 1 foto general - elección público
 * - 3 fotos categoría Primera (subsección, color, monocromo)
 * - 3 fotos categoría Estímulo (subsección, color, monocromo)
 * 
 * Valida que:
 * - Todas las fotografías existan en la tabla 'image' (por código)
 * - Todas tengan registros en 'contest_result'
 * - Todas pertenezcan a la misma temporada (mismo año en contest.end_date)
 * 
 * Si ya existen fotos para la temporada, las reemplaza.
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