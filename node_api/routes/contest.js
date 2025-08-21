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

    const path = require('path');
    const fs = require('fs');
    const IMG_REPOSITORY_PATH = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
    const archiver = require('archiver');
    const zipFileName = `concurso_${contestId}.zip`;
    const zipFilePath = path.join(IMG_REPOSITORY_PATH, zipFileName);
    const IMG_BASE_PATH = process.env.IMG_BASE_PATH || 'https://assets.prod-gfc.greenborn.com.ar';

    try {
        // Verificar si el concurso está finalizado
        const contest = await global.knex('contest').where('id', contestId).first();
        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Concurso no encontrado'
            });
        }
        const now = new Date();
        const endDate = new Date(contest.end_date);
        const zipExists = fs.existsSync(zipFilePath);

        // Si el concurso está finalizado y el zip ya existe, solo enviar el zip
        if (endDate < now && zipExists) {
            return res.json({
                success: true,
                contest_id: contestId,
                download_url: `${IMG_BASE_PATH}/${zipFileName}`,
                message: 'El concurso está finalizado y el archivo comprimido ya existe. Solo se envía el .zip.'
            });
        }

        // ...existing code...
        // (Resto del procesamiento original)
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

        // Obtener las secciones asociadas al concurso
        const contestSections = await global.knex('contest_section as cs')
            .join('section as s', 'cs.section_id', '=', 's.id')
            .select('s.id', 's.name')
            .where('cs.contest_id', contestId);

        // Obtener las categorías asociadas al concurso
        const contestCategories = await global.knex('contest_category as cc')
            .join('category as c', 'cc.category_id', '=', 'c.id')
            .select('c.id', 'c.name', 'c.mostrar_en_ranking')
            .where('cc.contest_id', contestId);

        // Crear/vaciar el subdirectorio para el concurso
        const contestDir = path.join(IMG_REPOSITORY_PATH, `concurso_${contestId}`);
        if (fs.existsSync(contestDir)) {
            fs.readdirSync(contestDir).forEach(file => {
                const curPath = path.join(contestDir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    fs.rmSync(curPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(curPath);
                }
            });
        } else {
            fs.mkdirSync(contestDir, { recursive: true });
        }

        // Crear subdirectorios para cada categoría dentro del concurso
        if (Array.isArray(contestCategories)) {
            contestCategories.forEach(cat => {
                const catDir = path.join(contestDir, cat.name);
                if (!fs.existsSync(catDir)) {
                    fs.mkdirSync(catDir, { recursive: true });
                }
                if (Array.isArray(contestSections)) {
                    contestSections.forEach(sec => {
                        const secDir = path.join(catDir, sec.name);
                        if (!fs.existsSync(secDir)) {
                            fs.mkdirSync(secDir, { recursive: true });
                        }
                    });
                }
            });
        }

        // Obtener el listado de inscriptos al concurso
        const inscritos = await global.knex('profile_contest as pc')
            .join('profile as p', 'pc.profile_id', '=', 'p.id')
            .select('p.id as profile_id', 'p.name as profile_name', 'pc.category_id')
            .where('pc.contest_id', contestId);

        // Crear diccionario agrupado por profile_id con array de imágenes
        const imagesByProfile = {};
        images.forEach(img => {
            if (!imagesByProfile[img.profile_id]) {
                imagesByProfile[img.profile_id] = [];
            }
            imagesByProfile[img.profile_id].push(img);
        });

        // Crear diccionario donde la clave es profile_id y el valor es category_id
        const profileCategoryDict = {};
        inscritos.forEach(item => {
            profileCategoryDict[item.profile_id] = item.category_id;
        });

        // Copiar la imagen al directorio correspondiente
        images.forEach(img => {
            const categoryId = profileCategoryDict[img.profile_id];
            const categoryObj = contestCategories.find(cat => cat.id === categoryId);
            const sectionObj = contestSections.find(sec => sec.id === img.section_id);
            if (categoryObj && sectionObj && img.url && img.code) {
                const fileDir = path.join(contestDir, categoryObj.name, sectionObj.name);
                const srcPath = path.join(IMG_REPOSITORY_PATH, img.url);
                const ext = path.extname(img.url) || '.jpg';
                const destPath = path.join(fileDir, `${img.code}${ext}`);
                try {
                    if (fs.existsSync(srcPath)) {
                        fs.copyFileSync(srcPath, destPath);
                    }
                } catch (err) {
                    console.error(`Error copiando imagen ${srcPath} a ${destPath}:`, err);
                }
            }
        });

        // Comprimir el directorio del concurso en un archivo .zip
        const createZip = () => {
            return new Promise((resolve, reject) => {
                const output = fs.createWriteStream(zipFilePath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                output.on('close', () => resolve());
                archive.on('error', err => reject(err));
                archive.pipe(output);
                archive.directory(contestDir, false);
                archive.finalize();
            });
        };
        try {
            await createZip();
        } catch (err) {
            console.error('Error al comprimir el directorio:', err);
        }

        // Construir la URL de descarga
        const downloadUrl = `${IMG_BASE_PATH}/${zipFileName}`;

        return res.json({
            success: true,
            contest_sections: contestSections,
            contest_categories: contestCategories,
            inscritos: inscritos,
            contest_id: contestId,
            contest_dir: contestDir,
            total_images: images.length,
            images: images,
            profile_category_dict: profileCategoryDict,
            download_url: downloadUrl,
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