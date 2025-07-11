const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')

router.get('/get_all', async (req, res) => {
    try {
      await LogOperacion(req.session.user.id, 'Consulta de Concursos - ' + req.session.user.username, null, new Date()) 

      res.json({ 
        items: await global.knex('contest'),
        contest_category: await global.knex('contest_category'),
        category: await global.knex('category'),
        //section: await global.knex('section'),
        contests_records: await global.knex('contests_records'),
        contest_result: await global.knex('contest_result')
});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener registros' });
    }
})

// Endpoint público para obtener participantes de un concurso
router.get('/participants', async (req, res) => {
    try {
        const contestId = parseInt(req.query.id);
        
        if (!contestId || isNaN(contestId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de concurso inválido o faltante. Use ?id=<contest_id>' 
            });
        }

        // Verificar que el concurso existe
        const contest = await global.knex('contest').where('id', contestId).first();
        if (!contest) {
            return res.status(404).json({ 
                success: false, 
                message: 'Concurso no encontrado' 
            });
        }

        // Obtener participantes con información completa
        const participants = await global.knex('profile_contest as pc')
            .select(
                'pc.id as participation_id',
                'pc.profile_id',
                'pc.category_id',
                'p.name',
                'p.last_name',
                'p.img_url as profile_image',
                'p.executive',
                'p.executive_rol',
                'f.id as fotoclub_id',
                'f.name as fotoclub_name',
                'f.facebook as fotoclub_facebook',
                'f.instagram as fotoclub_instagram',
                'f.email as fotoclub_email',
                'f.photo_url as fotoclub_photo',
                'f.description as fotoclub_description',
                'c.id as category_id',
                'c.name as category_name'
            )
            .join('profile as p', 'pc.profile_id', 'p.id')
            .leftJoin('fotoclub as f', 'p.fotoclub_id', 'f.id')
            .leftJoin('category as c', 'pc.category_id', 'c.id')
            .where('pc.contest_id', contestId)
            .orderBy('p.last_name', 'asc')
            .orderBy('p.name', 'asc');

        // Contar total de participantes
        const totalParticipants = await global.knex('profile_contest')
            .where('contest_id', contestId)
            .count('* as total')
            .first();

        res.json({
            success: true,
            contest: {
                id: contest.id,
                name: contest.name,
                description: contest.description,
                start_date: contest.start_date,
                end_date: contest.end_date,
                sub_title: contest.sub_title
            },
            participants: participants,
            total_participants: parseInt(totalParticipants.total),
            message: `Se encontraron ${participants.length} participantes en el concurso "${contest.name}"`
        });

    } catch (error) {
        console.error('Error al obtener participantes del concurso:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al obtener participantes' 
        });
    }
});

module.exports = router;