const express      = require('express');
const router       = express.Router();
const { logAction } = require('../utils/log.js');
const { buildPaginationResponse } = require('../utils/pagination.js');
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');

/**
 * GET /category
 * Lista las categorías para todos los usuarios autenticados.
 *
 * Ejemplo curl equivalente a API PHP:
 * curl 'https://gfc.prod-api.greenborn.com.ar/category?' \
 *   --compressed \
 *   -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
 *   -H 'Accept: application/json, text/plain, * / *' \
 *   -H 'Accept-Language: es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3' \
 *   -H 'Accept-Encoding: gzip, deflate, br, zstd' \
 *   -H 'Authorization: Bearer d8f3650df32623b175d850c02d152068ad857a438746f82d09cc7a18229afa01' \
 *   -H 'Origin: http://localhost:4200' \
 *   -H 'Connection: keep-alive' \
 *   -H 'Referer: http://localhost:4200/' \
 *   -H 'Sec-Fetch-Dest: empty' \
 *   -H 'Sec-Fetch-Mode: cors' \
 *   -H 'Sec-Fetch-Site: cross-site' \
 *   -H 'Pragma: no-cache' \
 *   -H 'Cache-Control: no-cache' \
 *   -H 'TE: trailers'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query['per-page'] || req.query.per_page || 20, 10) || 20;
        const offset = (page - 1) * perPage;

        const [totalResult] = await global.knex('category').count('id as count');
        const totalCount = parseInt(totalResult.count, 10) || 0;
        const pageCount = Math.max(1, Math.ceil(totalCount / perPage));

        const items = await global.knex('category')
            .select('*')
            .limit(perPage)
            .offset(offset);

        const pagination = buildPaginationResponse(req, totalCount, page, perPage);
        return res.json({ items, ...pagination });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error al obtener registros' });
    }
});

router.get('/get_all', authMiddleware, async (req, res) => {
    try {
      await logAction(req, 'Consulta de Categorías - ' + req.user.username) 

      res.json({ 
        items: await global.knex('category'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (req.user.role_id != '1' && req.user.role_id != '2') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores o delegados pueden editar categorías.' });
    }

    const { id, name, mostrar_en_ranking } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Validar que el campo mostrar_en_ranking sea un booleano
    if (typeof mostrar_en_ranking !== 'boolean') {
      return res.json({ stat: false, text: 'El campo mostrar_en_ranking debe ser un booleano' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('category')
      .where('id', id)
      .update({
        name,
        mostrar_en_ranking
      })

    await logAction(req, 'Modificación de Categoría - ' + req.user.username) 

    // Verificar si se actualizó el registro correctamente
    if (result === 1) {
      return res.json({ stat: true, text: 'Registro actualizado correctamente' });
    } else {
      return res.json({ stat: false, text: 'No se encontró el registro para actualizar' });
    }
  } catch (error) {
    console.error(error);
    return res.json({ stat: false, text: 'Ocurrió un error interno, contacte con soporte.' });
  }
})

module.exports = router;