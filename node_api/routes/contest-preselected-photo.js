const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');
const { canJudge } = require('../utils/judging-access');

// votes se guarda como mapa JSON: { [user_id]: 'aceptar' | 'rechazar' }.
// Este es el source of truth de cada voto por juez.
function parseVotes(raw) {
  let parsed;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { parsed = []; }
  } else {
    parsed = raw;
  }

  if (Array.isArray(parsed)) {
    // Legacy: array de user_id que aceptaron
    const map = {};
    parsed.forEach((id) => { map[String(id)] = 'aceptar'; });
    return map;
  }

  if (parsed && typeof parsed === 'object') return parsed;
  return {};
}

function buildItem(item, includeImage) {
  const votesMap = parseVotes(item.votes);

  let acceptCount = 0;
  let rejectCount = 0;
  const accepters = [];

  for (const [userId, vote] of Object.entries(votesMap)) {
    if (vote === 'aceptar') { acceptCount++; accepters.push(Number(userId)); }
    else if (vote === 'rechazar') { rejectCount++; }
  }

  const result = {
    id: item.id,
    contest_id: item.contest_id,
    image_id: item.image_id,
    preselected: acceptCount > 0,
    votes: accepters,
    vote_count: acceptCount + rejectCount,
    accept_count: acceptCount,
    reject_count: rejectCount,
    my_vote: votesMap[String(item.__userId)] || null
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
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    if (!await canJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores o jueces del concurso pueden ver las fotos preseleccionadas' });
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

    const resultItems = items.map(item => buildItem({ ...item, __userId: req.user.id }, includeImage));

    await logAction(req, `Consulta de fotos preseleccionadas - ${req.user.username}`, { contest_id: contestId });

    res.json({ items: resultItems });
  } catch (error) {
    console.error('Error en GET /contest-preselected-photo:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener fotos preseleccionadas', error: error.message });
  }
});

router.get('/current', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest || contest.deleted_at) {
      return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
    }

    const isJudging = contest.is_judging === 1 || contest.is_judging === true || String(contest.is_judging) === '1';
    if (!isJudging) {
      return res.status(400).json({ success: false, message: 'El concurso no está en etapa de juzgamiento' });
    }
    if (contest.judging_stage !== 'preseleccion') {
      return res.status(400).json({ success: false, message: 'El endpoint de foto actual solo está disponible en la fase de preselección' });
    }

    if (!await canJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores o jueces del concurso pueden consultar la foto actual' });
    }

    const images = await global.knex('contest_result as cr')
      .join('image as i', 'cr.image_id', 'i.id')
      .select('i.id as image_id', 'i.code', 'i.title', 'i.url', 'cr.section_id')
      .where('cr.contest_id', contestId)
      .orderBy('i.code', 'asc');

    const totalCount = images.length;

    const preselected = await global.knex('contest_preselected_photo')
      .select('image_id', 'votes')
      .where('contest_id', contestId);

    const judgedImageIds = new Set();
    for (const row of preselected) {
      const votesMap = parseVotes(row.votes);
      if (Object.prototype.hasOwnProperty.call(votesMap, String(req.user.id))) {
        judgedImageIds.add(Number(row.image_id));
      }
    }

    const current = images.find(img => !judgedImageIds.has(Number(img.image_id)));

    const judgedCount = judgedImageIds.size;

    await logAction(req, `Consulta de foto actual de juzgamiento - ${req.user.username}`, { contest_id: contestId });

    return res.json({
      success: true,
      contest_id: Number(contestId),
      current_photo: current ? {
        image_id: current.image_id,
        code: current.code,
        title: current.title,
        url: `${process.env.IMG_BASE_PATH || ''}${current.url}`,
        section_id: current.section_id
      } : null,
      judged_count: judgedCount,
      total_count: totalCount,
      remaining_count: totalCount - judgedCount,
      all_judged: totalCount > 0 && judgedCount >= totalCount
    });
  } catch (error) {
    console.error('Error en GET /contest-preselected-photo/current:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener la foto actual de juzgamiento', error: error.message });
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

    if (!await canJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores o jueces del concurso pueden definir preselección' });
    }

    const preselectedBool = preselected === true || preselected === 'true' || preselected === 1 || preselected === '1';
    const voteValue = preselectedBool ? 'aceptar' : 'rechazar';

    const existing = await global.knex('contest_preselected_photo')
      .where({ contest_id: contestId, image_id: imageId })
      .first();

    const votesMap = existing ? parseVotes(existing.votes) : {};
    votesMap[String(req.user.id)] = voteValue;

    const acceptCount = Object.values(votesMap).filter(v => v === 'aceptar').length;
    const cleanedPreselected = acceptCount > 0;

    if (existing) {
      await global.knex('contest_preselected_photo')
        .where({ id: existing.id })
        .update({
          preselected: cleanedPreselected,
          votes: JSON.stringify(votesMap)
        });

      const updated = await global.knex('contest_preselected_photo').where({ id: existing.id }).first();

      await logAction(req, `Actualización de preselección de foto - ${req.user.username}`, JSON.stringify({
        contest_id: contestId,
        image_id: imageId,
        vote: voteValue,
        votes: votesMap
      }));

      return res.json({ success: true, data: buildItem({ ...updated, __userId: req.user.id }, false) });
    } else {
      const [newId] = await global.knex('contest_preselected_photo')
        .insert({
          contest_id: contestId,
          image_id: imageId,
          preselected: cleanedPreselected,
          votes: JSON.stringify(votesMap)
        })
        .returning('id');

      const created = await global.knex('contest_preselected_photo').where({ id: newId?.id ?? newId }).first();

      await logAction(req, `Creación de preselección de foto - ${req.user.username}`, JSON.stringify({
        contest_id: contestId,
        image_id: imageId,
        vote: voteValue,
        votes: votesMap
      }));

      return res.status(201).json({ success: true, data: buildItem({ ...created, __userId: req.user.id }, false) });
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
