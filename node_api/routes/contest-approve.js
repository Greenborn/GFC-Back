const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');
const { canJudge, canViewJudging } = require('../utils/judging-access');
const { getApprovalStatus, preseleccionCompleta } = require('../utils/preseleccion-status');

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

    const status = await getApprovalStatus(contestId);

    let items = status.items;
    if (items.length > 0) {
      const userIds = items.map(item => item.user_id);
      const users = await global.knex('user')
        .whereIn('id', userIds)
        .select('id', 'username', 'email', 'profile_id');
      const usersById = new Map(users.map(u => [u.id, u]));
      items = items.map(item => ({ ...item, user: usersById.get(item.user_id) || null }));
    }

    await logAction(req, `Consulta de visto bueno de preselección - ${req.user.username}`, { contest_id: contestId });

    return res.json({
      success: true,
      contest_id: Number(contestId),
      items,
      judges_count: status.judges_count,
      approved_count: status.approved_count,
      all_approved: status.all_approved,
      preseleccion_completa: status.preseleccion_completa,
      my_approved: items.some(item => item.user_id === req.user.id)
    });
  } catch (error) {
    console.error('Error en GET /contest-approve:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el estado del visto bueno', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { contest_id } = req.body;

    if (!contest_id) {
      return res.status(400).json({ success: false, message: 'El campo contest_id es obligatorio' });
    }

    const contestId = parseInt(contest_id, 10);
    if (isNaN(contestId)) {
      return res.status(400).json({ success: false, message: 'contest_id debe ser un número' });
    }

    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest || contest.deleted_at) {
      return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
    }

    const isJudging = contest.is_judging === 1 || contest.is_judging === true || String(contest.is_judging) === '1';
    if (!isJudging || contest.judging_stage !== 'preseleccion') {
      return res.status(400).json({ success: false, message: 'El concurso debe estar en fase de preselección para dar el visto bueno' });
    }

    if (!await canJudge(req, contestId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores o jueces del concurso pueden dar el visto bueno' });
    }

    if (!await preseleccionCompleta(contestId)) {
      return res.status(400).json({ success: false, message: 'La preselección aún no está completa: falta votar sobre todas las fotografías' });
    }

    const existing = await global.knex('contest_preselection_approval')
      .where({ contest_id: contestId, user_id: req.user.id })
      .first();

    if (!existing) {
      await global.knex('contest_preselection_approval').insert({
        contest_id: contestId,
        user_id: req.user.id,
        approved_at: new Date()
      });
    }

    await logAction(req, `Visto bueno de preselección - ${req.user.username}`, { contest_id: contestId });

    const status = await getApprovalStatus(contestId);

    return res.json({
      success: true,
      contest_id: contestId,
      my_approved: true,
      judges_count: status.judges_count,
      approved_count: status.approved_count,
      all_approved: status.all_approved,
      preseleccion_completa: status.preseleccion_completa
    });
  } catch (error) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      const status = await getApprovalStatus(parseInt(req.body.contest_id, 10));
      return res.json({
        success: true,
        contest_id: parseInt(req.body.contest_id, 10),
        my_approved: true,
        judges_count: status.judges_count,
        approved_count: status.approved_count,
        all_approved: status.all_approved,
        preseleccion_completa: status.preseleccion_completa
      });
    }
    console.error('Error en POST /contest-approve:', error);
    return res.status(500).json({ success: false, message: 'Error al dar el visto bueno', error: error.message });
  }
});

module.exports = router;
