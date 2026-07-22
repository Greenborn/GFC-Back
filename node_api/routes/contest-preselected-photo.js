const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');

async function isJudge(req, contestId) {
  const record = await global.knex('contest_judge')
    .where({ contest_id: contestId, user_id: req.user.id })
    .first();
  return !!record;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    if (!await isJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo jueces del concurso pueden ver las fotos preseleccionadas' });
    }

    const expand = String(req.query.expand || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const includeImage = expand.includes('image');

    let query = global.knex('contest_preselected_photo as cpp')
      .select('cpp.id', 'cpp.contest_id', 'cpp.image_id', 'cpp.preselected', 'cpp.votes')
      .where('cpp.contest_id', contestId)
      .orderBy('cpp.id', 'asc');

    if (includeImage) {
      query = query
        .leftJoin('image as i', 'cpp.image_id', 'i.id')
        .select('i.id as image_id', 'i.code as image_code', 'i.title as image_title', 'i.url as image_url');
    }

    const items = await query;

    const resultItems = items.map(item => {
      let votes = item.votes;
      if (typeof votes === 'string') {
        try { votes = JSON.parse(votes); } catch { votes = []; }
      }
      const result = {
        id: item.id,
        contest_id: item.contest_id,
        image_id: item.image_id,
        preselected: item.preselected === 1 || item.preselected === true || String(item.preselected) === '1',
        votes: Array.isArray(votes) ? votes : [],
        vote_count: Array.isArray(votes) ? votes.length : 0
      };
      if (includeImage) {
        result.image = item.image_id != null ? {
          id: item.image_id,
          code: item.image_code,
          title: item.image_title,
          url: item.image_url
        } : null;
      }
      return result;
    });

    await logAction(req, `Consulta de fotos preseleccionadas - ${req.user.username}`, { contest_id: contestId });

    res.json({ items: resultItems });
  } catch (error) {
    console.error('Error en GET /contest-preselected-photo:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener fotos preseleccionadas', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { contest_id, image_id, preselected } = req.body;

    if (!contest_id || !image_id || preselected === undefined || preselected === null) {
      return res.status(400).json({ success: false, message: 'Los campos contest_id, image_id y preselected son obligatorios' });
    }

    const contestId = parseInt(contest_id, 10);
    const imageId = parseInt(image_id, 10);

    if (isNaN(contestId) || isNaN(imageId)) {
      return res.status(400).json({ success: false, message: 'contest_id y image_id deben ser números' });
    }

    if (!await isJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo jueces del concurso pueden definir preselección' });
    }

    const preselectedBool = preselected === true || preselected === 'true' || preselected === 1 || preselected === '1';

    const existing = await global.knex('contest_preselected_photo')
      .where({ contest_id: contestId, image_id: imageId })
      .first();

    let votes = [];
    if (existing && existing.votes) {
      if (typeof existing.votes === 'string') {
        try { votes = JSON.parse(existing.votes); } catch { votes = []; }
      } else {
        votes = existing.votes;
      }
    }

    const userId = req.user.id;

    if (preselectedBool) {
      if (!votes.includes(userId)) {
        votes.push(userId);
      }
    } else {
      votes = votes.filter(id => Number(id) !== Number(userId));
    }

    const cleanedPreselected = votes.length > 0;

    if (existing) {
      await global.knex('contest_preselected_photo')
        .where({ id: existing.id })
        .update({
          preselected: cleanedPreselected,
          votes: JSON.stringify(votes)
        });

      const updated = await global.knex('contest_preselected_photo').where({ id: existing.id }).first();

      await logAction(req, `Actualización de preselección de foto - ${req.user.username}`, JSON.stringify({
        contest_id: contestId,
        image_id: imageId,
        preselected: cleanedPreselected,
        votes
      }));

      return res.json({ success: true, data: updated });
    } else {
      const [newId] = await global.knex('contest_preselected_photo')
        .insert({
          contest_id: contestId,
          image_id: imageId,
          preselected: cleanedPreselected,
          votes: JSON.stringify(votes)
        })
        .returning('id');

      const created = await global.knex('contest_preselected_photo').where({ id: newId?.id ?? newId }).first();

      await logAction(req, `Creación de preselección de foto - ${req.user.username}`, JSON.stringify({
        contest_id: contestId,
        image_id: imageId,
        preselected: cleanedPreselected,
        votes
      }));

      return res.status(201).json({ success: true, data: created });
    }
  } catch (error) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Ya existe un registro de preselección para esta foto en el concurso' });
    }
    console.error('Error en POST /contest-preselected-photo:', error);
    return res.status(500).json({ success: false, message: 'Error al definir preselección de foto', error: error.message });
  }
});

module.exports = router;
