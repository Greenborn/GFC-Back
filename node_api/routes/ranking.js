const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const LogOperacion = require('../controllers/log_operaciones.js');

router.get('/detalle/:contest_id/:profile_id', authMiddleware, async (req, res) => {
  try {
    const contestId = parseInt(req.params.contest_id);
    const profileId = parseInt(req.params.profile_id);
    if (!Number.isFinite(contestId) || !Number.isFinite(profileId)) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }

    await LogOperacion(
      req.user?.id || 0,
      `Consulta detalle ranking contest_id=${contestId} profile_id=${profileId}`,
      null,
      new Date()
    );

    const contest = await global.knex('contest').where({ id: contestId }).first();
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
    }

    const profile = await global.knex('profile').where({ id: profileId }).first();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Concursante no encontrado' });
    }

    const inscription = await global.knex('profile_contest')
      .where({ contest_id: contestId, profile_id: profileId })
      .first();
    if (!inscription) {
      return res.status(403).json({ success: false, message: 'El concursante no está inscripto en el concurso' });
    }

    const fotoclub = profile.fotoclub_id
      ? await global.knex('fotoclub').select('id', 'name', 'photo_url').where({ id: profile.fotoclub_id }).first()
      : null;

    const categoryAssigned = inscription.category_id
      ? await global.knex('category').select('id', 'name').where({ id: inscription.category_id }).first()
      : null;

    const categories = categoryAssigned ? [categoryAssigned] : [];

    const rawResults = await global.knex('contest_result as cr')
      .join('image as i', 'cr.image_id', 'i.id')
      .join('metric as m', 'cr.metric_id', 'm.id')
      .join('section as s', 'cr.section_id', 's.id')
      .select(
        'cr.id as contest_result_id',
        'cr.section_id',
        's.name as section_name',
        'i.id as image_id',
        'i.code as image_code',
        'm.prize as metric_prize',
        'm.score as metric_score'
      )
      .where('cr.contest_id', contestId)
      .andWhere('i.profile_id', profileId);

    const sectionsSet = new Map();
    for (const r of rawResults) {
      if (!sectionsSet.has(r.section_id)) {
        sectionsSet.set(r.section_id, { id: r.section_id, name: r.section_name });
      }
    }
    const sections = Array.from(sectionsSet.values());

    const groupedBySection = new Map();
    for (const r of rawResults) {
      const key = r.section_id;
      if (!groupedBySection.has(key)) {
        groupedBySection.set(key, {
          section: r.section_name,
          category: categoryAssigned ? categoryAssigned.name : null,
          images: []
        });
      }
      const scoreNum = Number(r.metric_score) || 0;
      groupedBySection.get(key).images.push({
        image_id: r.image_id,
        metric: { prize: r.metric_prize, score: scoreNum }
      });
    }

    const results = Array.from(groupedBySection.values());

    let totalScore = 0;
    for (const r of rawResults) {
      totalScore += Number(r.metric_score) || 0;
    }

    const totalsByProfileRows = await global.knex('contest_result as cr')
      .join('image as i', 'cr.image_id', 'i.id')
      .join('metric as m', 'cr.metric_id', 'm.id')
      .where('cr.contest_id', contestId)
      .select('i.profile_id')
      .sum({ total_score: 'm.score' })
      .groupBy('i.profile_id');

    const rankingSorted = totalsByProfileRows
      .map(row => ({ profile_id: row.profile_id, total_score: Number(row.total_score) || 0 }))
      .sort((a, b) => b.total_score - a.total_score);

    let position = null;
    for (let i = 0; i < rankingSorted.length; i++) {
      const row = rankingSorted[i];
      if (Number(row.profile_id) === profileId) {
        position = i + 1;
        break;
      }
    }

    return res.json({
      contest,
      profile: {
        id: profile.id,
        name: profile.name,
        last_name: profile.last_name,
        fotoclub: fotoclub || null,
        img_url: profile.img_url || null
      },
      categories,
      sections,
      results,
      ranking: {
        total_score: totalScore,
        position
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
});

module.exports = router;