const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Función asíncrona para complementar la información de cada resultado con datos de la imagen, el profile, el contest_result, la metric y la metric_abm
async function complementaInfoImagen(resultado, knex) {
  const imagen = await knex('image').where({ code: resultado.code }).first();
  let profile = null;
  let contestResult = null;
  let metric = null;
  let metricAbm = null;
  if (imagen) {
    if (imagen.profile_id) {
      profile = await knex('profile').where({ id: imagen.profile_id }).first();
    }
    contestResult = await knex('contest_result').where({ image_id: imagen.id }).first();
    if (contestResult && contestResult.metric_id) {
      metric = await knex('metric').where({ id: contestResult.metric_id }).first();
    }
  }
  // Buscar metric_abm por prize = resultado.premio
  metricAbm = await knex('metric_abm').where({ prize: resultado.premio }).first();
  if (!metricAbm) {
    throw new Error(`No se encontró metric_abm para el premio '${resultado.premio}' (code: ${resultado.code})`);
  }
  return {
    ...resultado,
    imagen: imagen || null,
    profile: profile || null,
    contest_result: contestResult || null,
    metric: metric || null,
    metric_abm: metricAbm
  };
}

// Función asíncrona para actualizar el prize y el score en la tabla metric
async function updatePrizeInMetric(obj, trx) {
  if (!obj.metric || !obj.metric.id) {
    throw new Error(`No se puede actualizar metric: objeto sin metric o sin id (code: ${obj.code})`);
  }
  const scoreInt = Math.round(Number(obj.metric_abm.score));
  await trx('metric').where({ id: obj.metric.id }).update({ prize: obj.premio, score: scoreInt });
  return { code: obj.code, metric_id: obj.metric.id, nuevo_prize: obj.premio, nuevo_score: scoreInt };
}

// Endpoint: POST /results/judging
router.post('/judging', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role_id != '1') {
    console.log(req.user)
    return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
  }

  try {
    // Logging detallado para debug
    console.log('═══════════════════════════════════════════════════════');
    console.log('POST /results/judging - Inicio del procesamiento');
    console.log('Body recibido - Keys:', Object.keys(req.body));
    console.log('Body recibido - Tipo:', typeof req.body);
    
    const estructura = req.body.estructura;
    console.log('Estructura - Tipo:', typeof estructura);
    console.log('Estructura - Es null:', estructura === null);
    console.log('Estructura - Es undefined:', estructura === undefined);
    
    // Validación mejorada
    if (!estructura) {
      console.error('ERROR: Estructura no definida');
      return res.status(400).json({ 
        success: false, 
        message: 'Estructura inválida o faltante',
        detalle: 'El campo "estructura" no está presente en el body'
      });
    }
    
    if (typeof estructura !== 'object' || Array.isArray(estructura)) {
      console.error('ERROR: Estructura no es un objeto válido');
      return res.status(400).json({ 
        success: false, 
        message: 'Estructura inválida o faltante',
        detalle: 'El campo "estructura" debe ser un objeto, no un array o valor primitivo'
      });
    }
    
    const concursosKeys = Object.keys(estructura);
    if (concursosKeys.length === 0) {
      console.error('ERROR: Estructura vacía');
      return res.status(400).json({ 
        success: false, 
        message: 'Estructura inválida o faltante',
        detalle: 'La estructura no contiene ningún concurso'
      });
    }
    
    console.log('Concursos encontrados:', concursosKeys);
    console.log('INICIO procesamiento de estructura');
    console.log('═══════════════════════════════════════════════════════');
    
    const informe = {
      no_encontradas: {
        metric: [],
        image: [],
      },
      procesadas: []
    };

    // Recorrido y extracción de información de la estructura
    const resultados = [];
  
  // Iterar sobre los concursos (primer nivel de la estructura)
  for (let nombreConcurso in estructura) {
    const concursoData = estructura[nombreConcurso];
    
    // Iterar sobre las categorías (segundo nivel: "Primera", "Estímulo", etc.)
    for (const categoria in concursoData) {
      let categoriaNormalizada = categoria === 'Estmulo' ? 'Estimulo' : categoria;
      const categoriaData = concursoData[categoria];
      
      // Iterar sobre las secciones (tercer nivel: "Sub Sección", "Monocromo", "Color")
      for (const seccion in categoriaData) {
        const seccionData = categoriaData[seccion];
        
        // Iterar sobre los premios (cuarto nivel: "1er PREMIO", "ACEPTADA", etc.)
        for (const premio in seccionData) {
          const premioData = seccionData[premio];
          
          // Verificar que exista __files
          if (!premioData.__files || !Array.isArray(premioData.__files)) {
            continue;
          }
          
          const archivos = premioData.__files;
          for (const archivo of archivos) {
            // Extracción de datos del nombre de archivo
            let nombreSinExtension = archivo.replace('.jpg', '').replace('Copia de ', '');
            let partes = nombreSinExtension.split('_');
            let id_usuario = partes[0];
            let anio = partes[1];
            let id_concurso = partes[2];
            // La sección puede tener guiones bajos si tiene espacios
            let id_imagen = partes[partes.length - 1];
            let seccionArchivo = partes.slice(3, partes.length - 1).join('_');
            let code = nombreSinExtension;
            resultados.push({
              nombreConcurso,
              categoria: categoriaNormalizada,
              seccion,
              premio,
              archivo,
              id_usuario,
              anio,
              id_concurso,
              seccionArchivo,
              id_imagen,
              code
            });
          }
        }
      }
    }
  }
  // Complementar la información de cada resultado con datos de la imagen y demás tablas
  const resultadosCompletos = await Promise.all(resultados.map(r => complementaInfoImagen(r, global.knex)));

  // Iniciar transacción y actualizar metric.prize y metric.score
  let updates = [];
  await global.knex.transaction(async trx => {
    updates = await Promise.all(resultadosCompletos.map(obj => updatePrizeInMetric(obj, trx)));
    // Obtener los contest_id únicos de los resultados
    const contestIds = [...new Set(resultadosCompletos.map(obj => obj.contest_result && obj.contest_result.contest_id).filter(Boolean))];
    if (contestIds.length !== 1) {
      throw new Error(`Solo se permite cargar resultados de un concurso por vez. Se detectaron los siguientes contest_id: ${contestIds.join(', ')}`);
    }
    // Actualizar judged=true en el único concurso involucrado
    await trx('contest').where({ id: contestIds[0] }).update({ judged: true });
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('POST /results/judging - Procesamiento exitoso');
  console.log('Total de actualizaciones:', updates.length);
  console.log('═══════════════════════════════════════════════════════');

  res.json({ success: true, actualizaciones: updates });
  
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('ERROR en POST /results/judging:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error al procesar los resultados',
      error: error.message,
      detalle: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint: POST /results/recalcular-ranking
router.post('/recalcular-ranking', authMiddleware, async (req, res) => {
  if (!req.user || req.user.role_id != '1') {
    console.log(req.user)
    return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
  }

  try {
    console.log('Iniciando recálculo de ranking...');
    
    // Ejecutar el comando PHP para actualizar el ranking
    const comando = 'php8.1 yii actualizar-ranking/index';
    const directorio = '/var/www/GFC-Back-PRD/php_api/';
    
    console.log(`Ejecutando comando: ${comando} en directorio: ${directorio}`);
    
    const { stdout, stderr } = await execAsync(comando, { 
      cwd: directorio,
      timeout: 300000 // 5 minutos de timeout
    });
    
    if (stderr) {
      console.error('Error en la ejecución del comando PHP:', stderr);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al ejecutar el comando de actualización de ranking',
        error: stderr 
      });
    }
    
    console.log('Comando ejecutado exitosamente:', stdout);
    
    res.json({ 
      success: true, 
      message: 'Ranking recalculado exitosamente',
      output: stdout 
    });
    
  } catch (error) {
    console.error('Error al recalcular ranking:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({ 
        success: false, 
        message: 'Timeout: El comando tardó demasiado en ejecutarse' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al recalcular ranking',
      error: error.message 
    });
  }
});

module.exports = router; 