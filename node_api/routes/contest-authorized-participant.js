const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');
const { parseAuthorizedParticipantsFile, normalizeDni } = require('../utils/contest-authorized-participant-parser.js');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/contest-authorized-participants?contest_id=123
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;
    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    const items = await global.knex('contest_authorized_participant')
      .where('contest_id', contestId)
      .orderBy('last_name', 'asc');

    res.json({ items });
  } catch (error) {
    console.error('Error en GET /contest-authorized-participants:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el listado de participantes autorizados', error: error.message });
  }
});

// GET /api/contest-authorized-participants/status?contest_id=123
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;
    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    const row = await global.knex('contest_authorized_participant')
      .where('contest_id', contestId)
      .count('id as count')
      .max('created_at as uploaded_at')
      .first();

    const count = Number(row?.count || 0);
    res.json({ has_list: count > 0, count, uploaded_at: row?.uploaded_at ?? null });
  } catch (error) {
    console.error('Error en GET /contest-authorized-participants/status:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el estado del listado', error: error.message });
  }
});

// POST /api/contest-authorized-participants/parse  (multipart: contest_id, file)
router.post('/parse', adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    const contestId = parseInt(req.body.contest_id, 10);
    if (!contestId) {
      return res.status(400).json({ success: false, message: 'contest_id es obligatorio' });
    }

    const contestExists = await global.knex('contest').where('id', contestId).first();
    if (!contestExists) {
      return res.status(404).json({ success: false, message: 'El concurso especificado no existe' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Debe adjuntar un archivo CSV, XLSX o PDF' });
    }

    const { rows, stats } = await parseAuthorizedParticipantsFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    await logAction(req, `Parseo de listado de participantes autorizados - ${req.user.username}`, { contest_id: contestId, ...stats });

    res.json({ success: true, rows, stats });
  } catch (error) {
    console.error('Error en POST /contest-authorized-participants/parse:', error);
    return res.status(400).json({ success: false, message: error.message || 'No se pudo procesar el archivo' });
  }
});

// POST /api/contest-authorized-participants/confirm  (json: { contest_id, rows })
router.post('/confirm', adminMiddleware, writeProtection, async (req, res) => {
  try {
    const contestId = parseInt(req.body.contest_id, 10);
    const inputRows = Array.isArray(req.body.rows) ? req.body.rows : [];

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'contest_id es obligatorio' });
    }

    const contestExists = await global.knex('contest').where('id', contestId).first();
    if (!contestExists) {
      return res.status(404).json({ success: false, message: 'El concurso especificado no existe' });
    }

    const seen = new Set();
    const now = new Date();
    const rowsToInsert = [];
    for (const r of inputRows) {
      const dniNormalized = normalizeDni(r.dni);
      if (!dniNormalized || seen.has(dniNormalized)) continue;
      seen.add(dniNormalized);
      rowsToInsert.push({
        contest_id: contestId,
        last_name: r.last_name || null,
        first_name: r.first_name || null,
        dni: (r.dni ?? '').toString().trim(),
        dni_normalized: dniNormalized,
        birth_date: r.birth_date || null,
        faculty: r.faculty || null,
        discipline: r.discipline || null,
        created_at: now
      });
    }

    if (rowsToInsert.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay filas válidas para importar (todas carecen de DNI)' });
    }

    await global.knex.transaction(async trx => {
      await trx('contest_authorized_participant').where({ contest_id: contestId }).del();
      await trx('contest_authorized_participant').insert(rowsToInsert);
    });

    await logAction(req, `Importación de listado de participantes autorizados - ${req.user.username}`,
      JSON.stringify({ contest_id: contestId, imported_count: rowsToInsert.length }));

    return res.status(201).json({ success: true, data: { contest_id: contestId, imported_count: rowsToInsert.length } });
  } catch (error) {
    console.error('Error en POST /contest-authorized-participants/confirm:', error);
    return res.status(500).json({ success: false, message: 'Error al importar el listado', error: error.message });
  }
});

module.exports = router;
