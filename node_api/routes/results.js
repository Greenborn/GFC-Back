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
  // Iniciar transacción
  await global.knex.transaction(async trx => {
    try {
      for (let concurso in estructura.exportacion) {
        // Normalizar 'Estmulo' a 'Estimulo'
        let concursoNormalizado = concurso === 'Estmulo' ? 'Estimulo' : concurso;
        console.log('Procesando concurso:', concursoNormalizado);
        for (const seccion in estructura.exportacion[concurso]) {
          console.log('Procesando sección:', seccion);
          for (const categoria in estructura.exportacion[concurso][seccion]) {
            console.log('Procesando categoría:', categoria);
            const archivos = estructura.exportacion[concurso][seccion][categoria].__files;
            console.log('Archivos:', archivos);
            // Procesar todos los archivos en paralelo con Promise.all
            await Promise.all(archivos.map(async (archivo) => {
              // Extracción del código de imagen (quitando '.jpg' y 'Copia de ')
              let code = archivo.replace('.jpg', '').replace('Copia de ', '');
              // Buscar la imagen en la base de datos por code
              let image = await trx('image').where({ code }).first();
              if (image) {
                // Buscar contest_result por image_id
                let contestResult = await trx('contest_result').where({ image_id: image.id }).first();
                if (!contestResult) {
                  informe.no_encontradas.image.push([code, categoria, seccion, concursoNormalizado]);
                  console.log(`No se encontró contest_result para imagen: ${code}`);
                  return;
                }
                // Obtener el concurso
                let contest = await trx('contest').where({ id: contestResult.contest_id }).first();
                if (!contest) {
                  informe.no_encontradas.image.push([code, categoria, seccion, concursoNormalizado]);
                  console.log(`No se encontró contest para contest_id: ${contestResult.contest_id}`);
                  return;
                }
                // Buscar puntaje en metric_abm
                let puntaje = await trx('metric_abm').where({ prize: categoria, organization_type: contest.organization_type }).first();
                if (!puntaje) {
                  informe.no_encontradas.metric.push(contest.organization_type + '|' + categoria);
                  console.log(`No se encontró metric_abm para prize: ${categoria}, organization_type: ${contest.organization_type}`);
                  return;
                }
                // Buscar metric por metric_id
                let metric = await trx('metric').where({ id: contestResult.metric_id }).first();
                if (!metric) {
                  informe.no_encontradas.metric.push(contestResult.metric_id);
                  console.log(`No se encontró metric para id: ${contestResult.metric_id}`);
                  return;
                }
                // Actualizar metric con premio y puntaje
                await trx('metric').where({ id: metric.id }).update({ prize: categoria, score: puntaje.score });
                informe.procesadas.push([code, categoria, seccion, concursoNormalizado, puntaje.score]);
                console.log(`Procesada: imagen ${code}, premio ${categoria}, puntaje ${puntaje.score}`);
              } else {
                informe.no_encontradas.image.push([code, categoria, seccion, concursoNormalizado]);
                console.log(`Imagen NO encontrada: code=${code}`);
              }
            }));
          }
        }
      }
      console.log('FIN procesamiento de estructura');
      // Forzar rollback manualmente para no aplicar cambios
      await trx.rollback();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  });

  res.json({ success: true, message: 'Importación finalizada', informe });
});

module.exports = router; 