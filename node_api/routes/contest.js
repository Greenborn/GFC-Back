const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js')
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint para listar concursos con expansión de categorías y secciones (compatible con API PHP)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Log de operación para usuarios autenticados
        await LogOperacion(
            req.user.id,
            `Consulta de listado de concursos - ${req.user.username}`,
            null,
            new Date()
        );

        // Parámetros de consulta
        const { expand, sort, page = 1, 'per-page': perPage = 20 } = req.query;
        const currentPage = parseInt(page);
        const itemsPerPage = parseInt(perPage);
        const offset = (currentPage - 1) * itemsPerPage;
        
        // Construir query base para contests
        let contestQuery = global.knex('contest').select('*');
        
        // Aplicar ordenamiento
        if (sort) {
            if (sort === '-id') {
                contestQuery = contestQuery.orderBy('id', 'desc');
            } else if (sort === 'id') {
                contestQuery = contestQuery.orderBy('id', 'asc');
            } else {
                // Manejar otros tipos de ordenamiento si es necesario
                const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
                const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
                contestQuery = contestQuery.orderBy(sortField, sortDirection);
            }
        }
        
        // Obtener total de registros para paginación
        const totalCountResult = await global.knex('contest').count('id as count').first();
        const totalCount = parseInt(totalCountResult.count);
        const pageCount = Math.ceil(totalCount / itemsPerPage);
        
        // Aplicar paginación
        contestQuery = contestQuery.limit(itemsPerPage).offset(offset);
        
        // Ejecutar query de contests
        const contests = await contestQuery;
        
        // Procesar expansiones si se solicitan
        if (expand) {
            const expansions = expand.split(',');
            
            for (let contest of contests) {
                // Agregar campo active (determinar lógica según reglas de negocio)
                // Por ahora, consideramos activo si la fecha de fin es posterior a hoy
                const now = new Date();
                const endDate = new Date(contest.end_date);
                contest.active = endDate > now;
                
                // Expandir categorías
                if (expansions.includes('categories')) {
                    const categories = await global.knex('category as c')
                        .select('c.id', 'c.name', 'c.mostrar_en_ranking')
                        .join('contest_category as cc', 'c.id', 'cc.category_id')
                        .where('cc.contest_id', contest.id);
                    contest.categories = categories;
                }
                
                // Expandir secciones  
                if (expansions.includes('sections')) {
                    const sections = await global.knex('section as s')
                        .select('s.id', 's.name')
                        .join('contest_section as cs', 's.id', 'cs.section_id')
                        .where('cs.contest_id', contest.id);
                    contest.sections = sections;
                }
            }
        }
        
        // Construir respuesta con formato compatible con API PHP
        const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;
        const response = {
            items: contests,
            _links: {
                self: {
                    href: `${baseUrl}?${new URLSearchParams({ ...req.query, page: currentPage }).toString()}`
                },
                first: {
                    href: `${baseUrl}?${new URLSearchParams({ ...req.query, page: 1 }).toString()}`
                },
                last: {
                    href: `${baseUrl}?${new URLSearchParams({ ...req.query, page: pageCount }).toString()}`
                }
            },
            _meta: {
                totalCount: totalCount,
                pageCount: pageCount,
                currentPage: currentPage,
                perPage: itemsPerPage
            }
        };
        
        // Agregar enlaces next/prev si corresponde
        if (currentPage < pageCount) {
            response._links.next = {
                href: `${baseUrl}?${new URLSearchParams({ ...req.query, page: currentPage + 1 }).toString()}`
            };
        }
        
        if (currentPage > 1) {
            response._links.prev = {
                href: `${baseUrl}?${new URLSearchParams({ ...req.query, page: currentPage - 1 }).toString()}`
            };
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Error al obtener concursos:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor al obtener concursos',
            error: error.message 
        });
    }
});

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
router.get('/participants', authMiddleware, async (req, res) => {
    // Solo admin (rol == '1') o delegado (rol == '2') pueden acceder
    if (!(req?.user?.role_id == '1' || req?.user?.role_id == '2')) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para acceder a este recurso'
        });
    }
    // Registrar log de operación
    await LogOperacion(
        req.user.id,
        `Consulta de participantes del concurso (id: ${req.query.id}) - ${req.user.username}`,
        null,
        new Date()
    );
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

        // Obtener participantes con información específica
        const participants = await global.knex('profile_contest as pc')
            .select(
                'p.name',
                'p.last_name',
                'p.dni',
                'u.email',
                'c.name as category_name'
            )
            .join('profile as p', 'pc.profile_id', 'p.id')
            .join('user as u', 'u.profile_id', 'p.id')
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

router.get('/compressed-photos', authMiddleware, async (req, res) => {
    // Recibe el id del concurso por req.query.id
    const contestId = parseInt(req.query.id);
    if (!contestId || isNaN(contestId)) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de concurso inválido o faltante. Use ?id=<contest_id>' 
        });
    }

    try {
        // Consulta las imágenes asociadas al concurso
        const images = await global.knex('contest_result as cr')
            .join('image as i', 'cr.image_id', 'i.id')
            .select(
                'i.id',
                'i.code',
                'i.title',
                'i.profile_id',
                'i.url',
                'cr.section_id',
                'cr.metric_id',
                'cr.id as contest_result_id'
            )
            .where('cr.contest_id', contestId);

        return res.json({
            success: true,
            contest_id: contestId,
            total_images: images.length,
            images: images
        });
    } catch (error) {
        console.error('Error al obtener fotos asociadas al concurso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener fotos asociadas al concurso',
            error: error.message
        });
    }
});

module.exports = router;