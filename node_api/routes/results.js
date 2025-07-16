const express = require('express');
const router = express.Router();

// Middleware de autenticación por token Bearer
async function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  const token = auth.slice(7);
  try {
    const user = await global.knex('user').where({ access_token: token }).first();
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error de servidor', error: err.message });
  }
}

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
  await trx('metric').where({ id: obj.metric.id }).update({ prize: obj.premio, score: obj.metric_abm.score });
  return { code: obj.code, metric_id: obj.metric.id, nuevo_prize: obj.premio, nuevo_score: obj.metric_abm.score };
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

  // Iniciar transacción y actualizar metric.prize
  let updates = [];
  await global.knex.transaction(async trx => {
    updates = await Promise.all(resultadosCompletos.map(obj => updatePrizeInMetric(obj, trx)));
  });

  res.json({ success: true, actualizaciones: updates });
});

module.exports = router; 