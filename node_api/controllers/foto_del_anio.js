const LogOperacion = require('./log_operaciones.js');

/**
 * Obtiene un valor de un objeto usando una ruta tipo dot notation
 * Ej: "directorios.eleccion_jurado.archivos[0]"
 */
function obtenerValorPorRuta(objeto, ruta) {
    const partes = ruta.split('.');
    let valor = objeto;

    for (const parte of partes) {
        // Manejar acceso a arrays: "archivos[0]"
        const match = parte.match(/^(\w+)\[(\d+)\]$/);
        if (match) {
            const [, nombrePropiedad, indice] = match;
            valor = valor?.[nombrePropiedad]?.[parseInt(indice)];
        } else {
            valor = valor?.[parte];
        }

        if (valor === undefined || valor === null) {
            return null;
        }
    }

    return valor;
}

class FotoDelAnioController {
    
    /**
     * Registra o actualiza las fotos del año para una temporada específica
     * Procesa estructura jerárquica de directorios con fotografías seleccionadas
     * Si ya existen fotos para la temporada, las sobreescribe
     */
    async registrarFotosDelAnio(req, res) {
        try {
            const { raiz, directorios } = req.body;

            // Validación de entrada
            if (!raiz || !directorios) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere raiz y directorios'
                });
            }

            // Definir las rutas de las fotografías esperadas
            const rutasFotosEsperadas = [
                { ruta: 'directorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año - Elección Jurado', orden: 1 },
                { ruta: 'directorios.eleccion_publico.archivos[0]', puesto: 'Fotografía del Año - Elección Público', orden: 2 },
                { ruta: 'directorios.primera.subdirectorios.sub_seccion.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Primera - Subsección - Elección Jurado', orden: 3 },
                { ruta: 'directorios.primera.subdirectorios.color.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Primera - Color - Elección Jurado', orden: 4 },
                { ruta: 'directorios.primera.subdirectorios.monocromo.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Primera - Monocromo - Elección Jurado', orden: 5 },
                { ruta: 'directorios.estimulo.subdirectorios.sub_seccion.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Estímulo - Subsección - Elección Jurado', orden: 6 },
                { ruta: 'directorios.estimulo.subdirectorios.color.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Estímulo - Color - Elección Jurado', orden: 7 },
                { ruta: 'directorios.estimulo.subdirectorios.monocromo.subdirectorios.eleccion_jurado.archivos[0]', puesto: 'Fotografía del Año Estímulo - Monocromo - Elección Jurado', orden: 8 }
            ];

            // Extraer las fotografías de la estructura jerárquica
            const fotosExtraidas = [];
            const erroresValidacion = [];

            for (const rutaConfig of rutasFotosEsperadas) {
                try {
                    const archivo = obtenerValorPorRuta(req.body, rutaConfig.ruta);
                    
                    if (!archivo) {
                        erroresValidacion.push(`No se encontró fotografía en: ${rutaConfig.ruta}`);
                        continue;
                    }

                    fotosExtraidas.push({
                        nombreArchivo: archivo,
                        puesto: rutaConfig.puesto,
                        orden: rutaConfig.orden
                    });
                } catch (error) {
                    erroresValidacion.push(`Error al extraer fotografía de ${rutaConfig.ruta}: ${error.message}`);
                }
            }

            // Validar que se encontraron todas las fotografías
            if (fotosExtraidas.length !== 8) {
                return res.status(400).json({
                    success: false,
                    message: `Se requieren exactamente 8 fotografías, se encontraron ${fotosExtraidas.length}`,
                    errores: erroresValidacion
                });
            }

            // Usar transacción para garantizar consistencia
            const resultado = await global.knex.transaction(async (trx) => {
                // Extraer códigos de las fotografías (quitar extensión)
                const codigosFotos = fotosExtraidas.map(f => f.nombreArchivo.replace(/\.[^.]+$/, ''));
                
                // Obtener códigos únicos (pueden haber duplicados porque la misma foto gana en varias categorías)
                const codigosUnicos = [...new Set(codigosFotos)];

                // Buscar todas las fotografías en la base de datos
                const imagenes = await trx('image')
                    .whereIn('code', codigosUnicos)
                    .select('id', 'code', 'title', 'profile_id');

                // Validar que todas las fotografías únicas existan
                if (imagenes.length !== codigosUnicos.length) {
                    const codigosEncontrados = imagenes.map(img => img.code);
                    const codigosNoEncontrados = codigosUnicos.filter(c => !codigosEncontrados.includes(c));
                    throw new Error(`Fotografías no encontradas en la base de datos: ${codigosNoEncontrados.join(', ')}`);
                }

                // Crear mapa de código a imagen
                const mapaImagenes = {};
                imagenes.forEach(img => {
                    mapaImagenes[img.code] = img;
                });

                // Obtener IDs de imágenes
                const imageIds = imagenes.map(img => img.id);

                // Buscar en contest_result
                const contestResults = await trx('contest_result')
                    .whereIn('image_id', imageIds)
                    .select('image_id', 'contest_id');

                // Validar que todas las imágenes tengan contest_result
                if (contestResults.length !== imagenes.length) {
                    const imageIdsEnResultados = contestResults.map(cr => cr.image_id);
                    const imageIdsSinResultado = imageIds.filter(id => !imageIdsEnResultados.includes(id));
                    throw new Error(`Fotografías sin resultados de concurso: ${imageIdsSinResultado.join(', ')}`);
                }

                // Obtener IDs de concursos
                const contestIds = [...new Set(contestResults.map(cr => cr.contest_id))];

                // Obtener información de los concursos
                const concursos = await trx('contest')
                    .whereIn('id', contestIds)
                    .select('id', 'end_date');

                // Validar que todos los concursos pertenezcan a la misma temporada
                const anios = concursos.map(c => new Date(c.end_date).getFullYear());
                const aniosUnicos = [...new Set(anios)];
                
                if (aniosUnicos.length !== 1) {
                    throw new Error(`Las fotografías pertenecen a diferentes temporadas: ${aniosUnicos.join(', ')}`);
                }

                const temporada = aniosUnicos[0];

                // Crear mapa de image_id a contest_id
                const mapaContestResult = {};
                contestResults.forEach(cr => {
                    mapaContestResult[cr.image_id] = cr.contest_id;
                });

                // Obtener IDs de perfiles únicos
                const profileIds = [...new Set(imagenes.map(img => img.profile_id))];

                // Obtener información de autores
                const perfiles = await trx('profile')
                    .whereIn('id', profileIds)
                    .select('id', 'name', 'last_name');

                // Crear mapa de profile_id a nombre completo
                const mapaPerfiles = {};
                perfiles.forEach(perfil => {
                    mapaPerfiles[perfil.id] = `${perfil.last_name} ${perfil.name}`;
                });

                // Eliminar fotos existentes de la misma temporada
                await trx('foto_del_anio').where('temporada', temporada).del();

                // Preparar registros para insertar
                const fotosParaInsertar = fotosExtraidas.map(foto => {
                    const codigo = foto.nombreArchivo.replace(/\.[^.]+$/, '');
                    const imagen = mapaImagenes[codigo];
                    
                    return {
                        id_foto: imagen.id,
                        puesto: foto.puesto,
                        orden: foto.orden,
                        temporada: temporada,
                        nombre_obra: imagen.title,
                        nombre_autor: mapaPerfiles[imagen.profile_id],
                        url_imagen: foto.nombreArchivo
                    };
                });

                // Insertar los nuevos registros
                await trx('foto_del_anio').insert(fotosParaInsertar);

                return { temporada, cantidad: fotosParaInsertar.length };
            });

            // Log de la operación
            await LogOperacion(
                req.user.id,
                `Registro de fotos del año - Temporada ${resultado.temporada} - ${req.user.username}`,
                `Se registraron ${resultado.cantidad} fotos del año para la temporada ${resultado.temporada}`,
                new Date()
            );

            return res.json({
                success: true,
                message: `Se registraron exitosamente ${resultado.cantidad} fotos del año para la temporada ${resultado.temporada}`,
                data: {
                    temporada: resultado.temporada,
                    cantidad_fotos: resultado.cantidad
                }
            });

        } catch (error) {
            console.error('Error al registrar fotos del año:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al registrar fotos del año',
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
                .select('*')
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