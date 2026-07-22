const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const { logAction } = require('../utils/log.js');
const { insertAndGet } = require('../utils/db.js');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = req.query.contest_id;

    if (!contestId) {
      return res.status(400).json({ success: false, message: 'El parámetro contest_id es obligatorio' });
    }

    const items = await global.knex('contest_judge as cj')
      .select('cj.id', 'cj.contest_id', 'cj.user_id', 'cj.created_at')
      .where('cj.contest_id', contestId)
      .orderBy('cj.id', 'asc');

    const userIds = items.map(item => item.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const users = await global.knex('user')
        .whereIn('id', userIds)
        .select('id', 'username', 'email', 'profile_id');
      const usersById = new Map(users.map(u => [u.id, u]));
      for (const item of items) {
        item.user = usersById.get(item.user_id) || null;
      }
    }

    await logAction(req, `Consulta de jueces de concurso - ${req.user.username}`, { contest_id: contestId });

    res.json({ items });
  } catch (error) {
    console.error('Error en GET /contest-judge:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener jueces del concurso', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores pueden agregar jueces' });
    }

    const { contest_id, user_id } = req.body;

    if (!contest_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Los campos contest_id y user_id son obligatorios' });
    }

    const contestId = parseInt(contest_id, 10);
    const userId = parseInt(user_id, 10);

    if (isNaN(contestId) || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'contest_id y user_id deben ser números' });
    }

    const contestExists = await global.knex('contest').where('id', contestId).first();
    if (!contestExists) {
      return res.status(404).json({ success: false, message: 'El concurso especificado no existe' });
    }

    const userExists = await global.knex('user').where('id', userId).first();
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'El usuario especificado no existe' });
    }

    const existing = await global.knex('contest_judge')
      .where({ contest_id: contestId, user_id: userId })
      .first();

    if (existing) {
      return res.status(409).json({ success: false, message: 'El usuario ya es juez de este concurso' });
    }

    const item = await insertAndGet(global.knex, 'contest_judge', {
      contest_id: contestId,
      user_id: userId,
      created_at: new Date()
    });

    await logAction(req, `Asignación de juez a concurso - ${req.user.username}`, JSON.stringify({ contest_id: contestId, user_id: userId }));

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'El usuario ya es juez de este concurso' });
    }
    console.error('Error en POST /contest-judge:', error);
    return res.status(500).json({ success: false, message: 'Error al agregar juez al concurso', error: error.message });
  }
});

router.delete('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores pueden quitar jueces' });
    }

    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const record = await global.knex('contest_judge').where({ id }).first();
    if (!record) {
      return res.status(404).json({ success: false, message: 'Registro de juez no encontrado' });
    }

    await global.knex('contest_judge').where({ id }).del();

    await logAction(req, `Remoción de juez de concurso - ${req.user.username}`, JSON.stringify(record));

    res.json({ success: true, message: 'Juez removido correctamente del concurso' });
  } catch (error) {
    console.error('Error en DELETE /contest-judge:', error);
    return res.status(500).json({ success: false, message: 'Error al quitar juez del concurso', error: error.message });
  }
});

module.exports = router;
