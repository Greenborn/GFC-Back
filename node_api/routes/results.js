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
    const user = await req.app.locals.knex('user').where({ access_token: token }).first();
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
  const { contest_id, image_id, score, comments, section_id } = req.body;
  if (!contest_id || !image_id || typeof score !== 'number') {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }
  try {
    const [id] = await req.app.locals.knex('contest_result').insert({
      contest_id,
      image_id,
      score,
      comments,
      section_id,
      evaluated_by: req.user.id,
      evaluated_at: new Date()
    }).returning('id');
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al registrar resultado', error: err.message });
  }
});

module.exports = router; 