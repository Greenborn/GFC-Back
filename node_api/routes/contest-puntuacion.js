const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');
const { canJudge, canViewJudging } = require('../utils/judging-access');
const { getPuntuacionStatus, getContestMetrics } = require('../utils/puntuacion-status');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest || contest.deleted_at) {
      return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
    }

    if (!await canViewJudging(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: no tienes permiso para ver el juzgamiento de este concurso' });
    }

    const status = await getPuntuacionStatus(contestId, req.user.id);

    await logAction(req, `Consulta de votos de puntuación - ${req.user.username}`, { contest_id: contestId });

    return res.json({ success: true, contest_id: Number(contestId), ...status });
  } catch (error) {
    console.error('Error en GET /contest-puntuacion:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener los votos de puntuación', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { contest_id, image_id, metric_abm_id } = req.body;

    if (!contest_id || !image_id || !metric_abm_id) {
      return res.status(400).json({ success: false, message: 'Los campos contest_id, image_id y metric_abm_id son obligatorios' });
    }

    const contestId = parseInt(contest_id, 10);
    const imageId = parseInt(image_id, 10);
    const metricAbmId = parseInt(metric_abm_id, 10);

    if (isNaN(contestId) || isNaN(imageId) || isNaN(metricAbmId)) {
      return res.status(400).json({ success: false, message: 'contest_id, image_id y metric_abm_id deben ser números' });
    }

    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest || contest.deleted_at) {
      return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
    }

    const isJudging = contest.is_judging === 1 || contest.is_judging === true || String(contest.is_judging) === '1';
    if (!isJudging || contest.judging_stage !== 'puntuacion') {
      return res.status(400).json({ success: false, message: 'El concurso debe estar en fase de puntuación para votar métricas' });
    }

    if (!await canJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores o jueces del concurso pueden votar métricas' });
    }

    const belongs = await global.knex('contest_result')
      .where({ contest_id: contestId, image_id: imageId })
      .first();
    if (!belongs) {
      return res.status(400).json({ success: false, message: 'La fotografía no pertenece a este concurso' });
    }

    const metricAbm = await global.knex('metric_abm').where({ id: metricAbmId }).first();
    if (!metricAbm) {
      return res.status(404).json({ success: false, message: 'La métrica seleccionada no existe' });
    }
    if (String(metricAbm.organization_type) !== String(contest.organization_type)) {
      return res.status(400).json({ success: false, message: `La métrica no corresponde al tipo de concurso (${contest.organization_type})` });
    }

    const existing = await global.knex('contest_puntuacion_vote')
      .where({ contest_id: contestId, image_id: imageId, user_id: req.user.id })
      .first();

    const now = new Date();
    if (existing) {
      await global.knex('contest_puntuacion_vote')
        .where({ id: existing.id })
        .update({ metric_abm_id: metricAbmId, updated_at: now });
    } else {
      await global.knex('contest_puntuacion_vote').insert({
        contest_id: contestId,
        image_id: imageId,
        user_id: req.user.id,
        metric_abm_id: metricAbmId,
        created_at: now,
        updated_at: now
      });
    }

    await logAction(req, `Voto de métrica en puntuación - ${req.user.username}`, JSON.stringify({ contest_id: contestId, image_id: imageId, metric_abm_id: metricAbmId }));

    const status = await getPuntuacionStatus(contestId, req.user.id);
    const item = status.items.find(i => i.image_id === imageId) || null;

    require('../utils/judge-socket').emitContestEvent(contestId, 'contest:puntuacion', {
      image_id: imageId,
      user_id: req.user.id,
      metric_abm_id: metricAbmId
    });

    return res.json({
      success: true,
      contest_id: contestId,
      image_id: imageId,
      my_vote: metricAbmId,
      item
    });
  } catch (error) {
    console.error('Error en POST /contest-puntuacion:', error);
    return res.status(500).json({ success: false, message: 'Error al votar la métrica', error: error.message });
  }
});

module.exports = router;
