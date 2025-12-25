const LogOperacion = require('./log_operaciones.js');

class FotoDelAnioController {
    
    /**
     * Registra o actualiza las fotos del año para una temporada específica
     * Si ya existen fotos para la temporada, las sobreescribe
     */
    async registrarFotosDelAnio(req, res) {
        try {
            const { temporada, fotos } = req.body;

            // Validación de entrada
            if (!temporada || !fotos || !Array.isArray(fotos)) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere temporada y un array de fotos'
                });
            }

            // Validar que cada foto tenga los campos requeridos
            for (const foto of fotos) {
                if (!foto.id_foto || !foto.puesto || !foto.orden || 
                    !foto.nombre_obra || !foto.nombre_autor || !foto.url_imagen) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cada foto debe tener: id_foto, puesto, orden, nombre_obra, nombre_autor y url_imagen'
                    });
                }
            }

            // Usar transacción para garantizar consistencia
            await global.knex.transaction(async (trx) => {
                // Eliminar fotos existentes de la misma temporada
                await trx('foto_del_anio').where('temporada', temporada).del();

                // Insertar las nuevas fotos
                const fotosParaInsertar = fotos.map(foto => ({
                    id_foto: foto.id_foto,
                    puesto: foto.puesto,
                    orden: foto.orden,
                    temporada: parseInt(temporada),
                    nombre_obra: foto.nombre_obra,
                    nombre_autor: foto.nombre_autor,
                    url_imagen: foto.url_imagen
                }));

                await trx('foto_del_anio').insert(fotosParaInsertar);
            });

            // Log de la operación
            await LogOperacion(
                req.user.id,
                `Registro de fotos del año - Temporada ${temporada} - ${req.user.username}`,
                `Se registraron ${fotos.length} fotos del año para la temporada ${temporada}`,
                new Date()
            );

            return res.json({
                success: true,
                message: `Se registraron exitosamente ${fotos.length} fotos del año para la temporada ${temporada}`,
                data: {
                    temporada: parseInt(temporada),
                    cantidad_fotos: fotos.length
                }
            });

        } catch (error) {
            console.error('Error al registrar fotos del año:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al registrar fotos del año',
                error: error.message
            });
        }
    }

    /**
     * Obtiene las fotos del año de una temporada específica
     */
    async obtenerFotosDelAnio(req, res) {
        try {
            const { temporada } = req.params;

            if (!temporada) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere especificar la temporada'
                });
            }

            const fotos = await global.knex('foto_del_anio')
                .where('temporada', temporada)
                .orderBy('orden', 'asc');

            return res.json({
                success: true,
                data: fotos,
                total: fotos.length
            });

        } catch (error) {
            console.error('Error al obtener fotos del año:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener fotos del año',
                error: error.message
            });
        }
    }

    /**
     * Obtiene todas las fotos del año agrupadas por temporada
     */
    async obtenerTodasLasFotosDelAnio(req, res) {
        try {
            const fotos = await global.knex('foto_del_anio')
                .select('*')
                .orderBy('temporada', 'desc')
                .orderBy('orden', 'asc');

            // Agrupar por temporada
            const fotosPorTemporada = fotos.reduce((acc, foto) => {
                if (!acc[foto.temporada]) {
                    acc[foto.temporada] = [];
                }
                acc[foto.temporada].push(foto);
                return acc;
            }, {});

            return res.json({
                success: true,
                data: fotosPorTemporada,
                total_temporadas: Object.keys(fotosPorTemporada).length,
                total_fotos: fotos.length
            });

        } catch (error) {
            console.error('Error al obtener todas las fotos del año:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener fotos del año',
                error: error.message
            });
        }
    }
}

module.exports = new FotoDelAnioController();