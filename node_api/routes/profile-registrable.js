const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { logAction } = require('../utils/log.js');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const contestId = parseInt(req.query.contest_id, 10);
    let roleGet = req.query.role;

    if (!contestId || isNaN(contestId)) {
      return res.status(400).json({
        success: false,
        message: 'Especificar el id concurso del que se quiere saber los concursantes inscribibles'
      });
    }

    if (roleGet === undefined || roleGet === null || roleGet === '') {
      roleGet = '3';
    }

    const currentUser = req.user;
    const isDelegate = String(currentUser.role_id) === '2';

    let query = global.knex('profile').select('*');

    query.whereIn('id', function () {
      this.select('profile_id').from('user');
    });

    query.whereNotIn('id', function () {
      this.select('profile_id').from('profile_contest').where('contest_id', contestId);
    });

    if (isDelegate && String(roleGet) !== '4') {
      const currentProfile = await global.knex('profile').where({ id: currentUser.profile_id }).first();
      const fotoclubId = currentProfile ? currentProfile.fotoclub_id : null;
      if (fotoclubId) {
        query.andWhere('fotoclub_id', fotoclubId);
      } else {
        query.andWhere('fotoclub_id', -1);
      }
    }

    query.orderBy('id', 'asc');
    const profiles = await query;

    await logAction(req, `Consulta profile-registrable contest_id=${contestId} role=${roleGet} - ${req.user.username}`);

    res.json({ items: profiles });
  } catch (error) {
    console.error('Error en GET /profile-registrable:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener perfiles registrables', error: error.message });
  }
});

module.exports = router;
