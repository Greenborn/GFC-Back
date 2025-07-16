const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

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
  const estructura = req.body.estructura;
  if (!estructura || !estructura.exportacion) {
    return res.status(400).json({ success: false, message: 'Estructura inválida o faltante' });
  }

  const informe = {
    no_encontradas: {
      metric: [],
      image: [],
    },
    procesadas: []
  };

  console.log('Estructura recibida:', JSON.stringify(estructura.exportacion, null, 2));
  console.log('INICIO procesamiento de estructura');
  // Recorrido y extracción de información de la estructura
  const resultados = [];
  for (let concurso in estructura.exportacion) {
    let categoriaNormalizada = concurso === 'Estmulo' ? 'Estimulo' : concurso;
    for (const seccion in estructura.exportacion[concurso]) {
      for (const premio in estructura.exportacion[concurso][seccion]) {
        const archivos = estructura.exportacion[concurso][seccion][premio].__files;
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

  res.json({ success: true, actualizaciones: updates });
});

module.exports = router; 