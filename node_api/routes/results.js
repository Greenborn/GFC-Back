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

  // Recorrer la estructura y mostrar los datos relevantes
  for (const concurso in estructura.exportacion) {
    for (const seccion in estructura.exportacion[concurso]) {
      for (const categoria in estructura.exportacion[concurso][seccion]) {
        const archivos = estructura.exportacion[concurso][seccion][categoria].__files;
        for (const archivo of archivos) {
          // Aquí podrías extraer datos del nombre del archivo si es necesario
          // Por ahora, solo mostramos la información
          console.log(`Concurso: ${concurso} | Sección: ${seccion} | Categoría: ${categoria} | Archivo: ${archivo}`);
        }
      }
    }
  }

  res.json({ success: true, message: 'Estructura procesada y mostrada por consola' });
});

module.exports = router; 