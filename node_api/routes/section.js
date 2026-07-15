const express      = require('express');
const router       = express.Router();
const LogOperacion = require('../controllers/log_operaciones.js');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * GET /section
 * Lista las secciones para todos los usuarios autenticados.
 *
 * Ejemplo curl compatible con API PHP:
 * curl 'https://gfc.prod-api.greenborn.com.ar/section?' \
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

        const [totalResult] = await global.knex('section').count('id as count');
        const totalCount = parseInt(totalResult.count, 10) || 0;
        const pageCount = Math.max(1, Math.ceil(totalCount / perPage));

        const items = await global.knex('section')
            .select('*')
            .limit(perPage)
            .offset(offset);

        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        const buildHref = (pageNumber) => `${baseUrl}?${new URLSearchParams({ ...req.query, page: pageNumber }).toString()}`;

        return res.json({
            items,
            _links: {
                self: { href: buildHref(page) },
                first: { href: buildHref(1) },
                last: { href: buildHref(pageCount) }
            },
            _meta: {
                totalCount,
                pageCount,
                currentPage: page,
                perPage
            }
        });
    } catch (error) {
        console.error('Error al obtener secciones:', error);
        res.status(500).json({ message: 'Error al obtener secciones' });
    }
});

router.get('/get_all', authMiddleware, async (req, res) => {
    try {
      await LogOperacion(req.user.id, 'Consulta de Secciones - ' + req.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('section'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

router.put('/edit', authMiddleware, async (req, res) => {
  try {
    if (req.user.role_id != '1' && req.user.role_id != '2') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores o delegados pueden editar secciones.' });
    }

    const { id, name } = req.body;

    // Validar que el campo name esté presente
    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    // Actualizar el registro en la base de datos
    const result = await global.knex('section')
      .where('id', id)
      .update({
        name
      })

    await LogOperacion(req.user.id, 'Modificación de Sección - ' + req.user.username, null, new Date()) 

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
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role_id != '1' && req.user.role_id != '2') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores o delegados pueden eliminar secciones.' });
    }

    const { id } = req.params;

    const section = await global.knex('section').where('id', id).first();
    if (!section) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }

    const contestVinculado = await global.knex('contest_section').where('section_id', id).first();
    if (contestVinculado) {
      return res.status(409).json({ message: 'No se puede eliminar la sección porque tiene concursos vinculados.' });
    }

    const resultadoVinculado = await global.knex('contest_result').where('section_id', id).first();
    if (resultadoVinculado) {
      return res.status(409).json({ message: 'No se puede eliminar la sección porque tiene resultados de concurso vinculados.' });
    }

    await global.knex('section').where('id', id).del();

    await LogOperacion(req.user.id, 'Eliminación de Sección - ' + req.user.username, null, new Date());

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ocurrió un error interno, contacte con soporte.' });
  }
});

async function createSection(req, res) {
  try {
    if (req.user.role_id != '1' && req.user.role_id != '2') {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores o delegados pueden crear secciones.' });
    }

    const { name } = req.body;

    if (!name) {
      return res.json({ stat: false, text: 'El nombre es obligatorio' });
    }

    if (name.length > 45) {
      return res.json({ stat: false, text: 'El nombre no puede superar los 45 caracteres' });
    }

    const [row] = await global.knex('section').insert({ name }).returning('id');
    const newId = row?.id ?? row;

    await LogOperacion(req.user.id, 'Creación de Sección - ' + req.user.username, null, new Date());

    return res.json({ stat: true, text: 'Sección creada correctamente', id: newId });
  } catch (error) {
    console.error(error);
    return res.json({ stat: false, text: 'Ocurrió un error interno, contacte con soporte.' });
  }
}

router.post('/', authMiddleware, createSection);
router.post('/create', authMiddleware, createSection);

module.exports = router;