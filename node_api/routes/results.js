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
      // Recorrido y extracción de información de la estructura
      for (let concurso in estructura.exportacion) {
        let concursoNormalizado = concurso === 'Estmulo' ? 'Estimulo' : concurso;
        for (const seccion in estructura.exportacion[concurso]) {
          for (const categoria in estructura.exportacion[concurso][seccion]) {
            const archivos = estructura.exportacion[concurso][seccion][categoria].__files;
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
              console.log({
                concurso: concursoNormalizado,
                seccion,
                categoria,
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
      console.log('FIN procesamiento de estructura');
      // Forzar rollback manualmente para no aplicar cambios
      await trx.rollback();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  });

  res.json({ success: true, message: 'Extracción de información completada (ver consola)' });
});

module.exports = router; 