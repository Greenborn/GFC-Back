const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/log.js');
const { saveUploadedFile } = require('../utils/images.js');
const { buildPaginationResponse } = require('../utils/pagination.js');
const authMiddleware = require('../middleware/authMiddleware');
const { authMiddlewareOptional } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { isValidOrganizationType } = require('../utils/organizationType');
const { insertAndGetId } = require('../utils/db.js');

const ALLOWED_CONTEST_ORG_TYPES = ['INTERNO', 'EXTERNO_0', 'EXTERNO_UNICEN'];
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint para crear concursos (compatible con API PHP)
router.post('/', authMiddleware, upload.fields([
    { name: 'image_file', maxCount: 1 },
    { name: 'rules_file', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.user || req.user.role_id != '1') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores pueden crear concursos.' });
        }

        const {
            name,
            description,
            sub_title,
            max_img_section,
            start_date,
            end_date,
            organization_type,
            is_test
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'El nombre del concurso es obligatorio.' });
        }

        if (!organization_type) {
            return res.status(400).json({ success: false, message: 'El tipo de organización es obligatorio.' });
        }

        if (!isValidOrganizationType(organization_type) || !ALLOWED_CONTEST_ORG_TYPES.includes(organization_type)) {
            return res.status(400).json({ success: false, message: 'organization_type inválido. Valores permitidos: INTERNO, EXTERNO_0, EXTERNO_UNICEN.' });
        }

        const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
        const imagesDir = path.join(uploadsBasePath, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        let img_url = null;
        let rules_url = null;

        if (req.files && req.files.image_file && req.files.image_file.length > 0) {
            img_url = saveUploadedFile(req.files.image_file[0], 'contest_title');
        }

        if (req.files && req.files.rules_file && req.files.rules_file.length > 0) {
            rules_url = saveUploadedFile(req.files.rules_file[0], 'rules');
        }

        const contestData = {
            name,
            description: description || null,
            sub_title: sub_title || null,
            max_img_section: max_img_section ? parseInt(max_img_section, 10) : null,
            start_date: start_date || null,
            end_date: end_date || null,
            img_url,
            rules_url,
            organization_type: organization_type || null,
            is_test: is_test === true || is_test === 'true' || is_test === 1 || is_test === '1' || false,
            judged: false,
            is_judging: false
        };

        const contestId = await insertAndGetId(global.knex, 'contest', contestData);

        await logAction(req, `Creación de Concurso - ${req.user.username}`, { new: contestData });

        return res.status(201).json({
            success: true,
            id: contestId,
            ...contestData
        });
    } catch (error) {
        console.error('Error al crear concurso:', error);
        return res.status(500).json({ success: false, message: 'Error interno al crear concurso', error: error.message });
    }
});

// Endpoint para listar concursos con expansión de categorías y secciones (compatible con API PHP)
router.get('/', authMiddlewareOptional, async (req, res) => {
    try {

        // Parámetros de consulta
        const { expand, sort, page = 1, 'per-page': perPage = 20, search } = req.query;
        const currentPage = parseInt(page);
        const itemsPerPage = parseInt(perPage);
        const offset = (currentPage - 1) * itemsPerPage;

        const canSeeTest = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');

        // Construir query base para contests (excluir borrados lógicos y ocultar pruebas si corresponde)
        let contestQuery = global.knex('contest').select('*').whereNull('deleted_at');
        let countQuery = global.knex('contest').count('id as count').whereNull('deleted_at').first();

        if (!canSeeTest) {
            contestQuery = contestQuery.where(function () {
                this.where('is_test', false).orWhereNull('is_test');
            });
            countQuery = countQuery.where(function () {
                this.where('is_test', false).orWhereNull('is_test');
            });
        }

        // Filtro de búsqueda en los campos name y description
        if (search && search.trim()) {
            const searchTerm = `%${search.trim().toLowerCase()}%`;
            contestQuery = contestQuery.where(function () {
                this.whereRaw('LOWER(name) LIKE ?', [searchTerm])
                    .orWhereRaw('LOWER(description) LIKE ?', [searchTerm]);
            });
            countQuery = countQuery.where(function () {
                this.whereRaw('LOWER(name) LIKE ?', [searchTerm])
                    .orWhereRaw('LOWER(description) LIKE ?', [searchTerm]);
            });
        }

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
        const totalCountResult = await countQuery;
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

        const pagination = buildPaginationResponse(req, totalCount, currentPage, itemsPerPage);
        res.json({ items: contests, ...pagination });

    } catch (error) {
        console.error('Error al obtener concursos:', error);
        return res.status(500).json({
            message: 'Error interno del servidor al obtener concursos',
            error: error.message
        });
    }
});

router.get('/get_all', authMiddlewareOptional, async (req, res) => {
    try {
        const isTestUser = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');

        let contestQuery = global.knex('contest').whereNull('deleted_at');
        if (!isTestUser) {
            contestQuery = contestQuery.where(function () {
                this.where('is_test', false).orWhereNull('is_test');
            });
        }
        res.json({
            items: await contestQuery,
            contest_category: await global.knex('contest_category'),
            category: await global.knex('category'),
            //section: await global.knex('section'),
            contests_records: await global.knex('contests_records'),
            contest_result: await global.knex('contest_result')
        });
    } catch (error) {
        console.error('Error en GET /contest/get_all:', error);
        return res.status(500).json({ message: 'Error al obtener registros' });
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
    await logAction(req, `Consulta de participantes del concurso (id: ${req.query.id}) - ${req.user.username}`);
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
        if (!contest || contest.deleted_at) {
            return res.status(404).json({
                success: false,
                message: 'Concurso no encontrado'
            });
        }

        const isTestContest = contest.is_test === 1 || contest.is_test === true || String(contest.is_test) === '1';
        const userCanSeeTest = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');
        if (isTestContest && !userCanSeeTest) {
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
                'u.dni',
                'u.email',
                'c.name as category_name',
                'fc.name as fotoclub_name',
            )
            .join('profile as p', 'pc.profile_id', 'p.id')
            .join('fotoclub as fc', 'fc.id', 'p.fotoclub_id')
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
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener participantes'
        });
    }
});

router.get('/:id(\\d+)', authMiddleware, async (req, res) => {
    try {
        const contestId = parseInt(req.params.id, 10);
        if (!contestId || Number.isNaN(contestId)) {
            return res.status(400).json({ message: 'ID de concurso inválido' });
        }

        const contest = await global.knex('contest').where({ id: contestId }).first();
        if (!contest || contest.deleted_at) {
            return res.status(404).json({ message: 'Concurso no encontrado' });
        }

        const isTestContest = contest.is_test === 1 || contest.is_test === true || String(contest.is_test) === '1';
        const userCanSeeTest = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');
        if (isTestContest && !userCanSeeTest) {
            return res.status(404).json({ message: 'Concurso no encontrado' });
        }

        const expand = req.query.expand
            ? String(req.query.expand).split(',').map(v => v.trim()).filter(Boolean)
            : [];
        const includeCountContestResults = expand.includes('countContestResults');
        const includeCountProfileContests = expand.includes('countProfileContests');
        const includeContestRecords = expand.includes('contestRecords');

        const response = {
            id: contest.id,
            name: contest.name,
            description: contest.description,
            start_date: contest.start_date,
            end_date: contest.end_date,
            max_img_section: contest.max_img_section,
            img_url: contest.img_url,
            rules_url: contest.rules_url,
            sub_title: contest.sub_title || '',
            organization_type: contest.organization_type,
            deleted_at: contest.deleted_at || null,
            is_test: contest.is_test === 1 || contest.is_test === true || String(contest.is_test) === '1',
            judged: contest.judged === 1 || contest.judged === true || String(contest.judged) === '1',
            is_judging: contest.is_judging === 1 || contest.is_judging === true || String(contest.is_judging) === '1',
            active: (() => {
                const now = new Date();
                const endDate = new Date(contest.end_date);
                return endDate > now;
            })()
        };

        const promises = [];
        if (includeCountContestResults) {
            promises.push(
                global.knex('contest_result')
                    .where('contest_id', contestId)
                    .count('* as total')
                    .first()
            );
        }
        if (includeCountProfileContests) {
            promises.push(
                global.knex('profile_contest')
                    .where('contest_id', contestId)
                    .count('* as total')
                    .first()
            );
        }
        if (includeContestRecords) {
            promises.push(
                global.knex('contests_records')
                    .where('contest_id', contestId)
                    .select('id', 'url', 'object', 'contest_id', 'type', 'temporada')
            );
        }

        const results = await Promise.all(promises);
        let resultIndex = 0;

        if (includeCountContestResults) {
            const row = results[resultIndex++] || { total: 0 };
            response.countContestResults = parseInt(row.total, 10) || 0;
        }
        if (includeCountProfileContests) {
            const row = results[resultIndex++] || { total: 0 };
            response.countProfileContests = parseInt(row.total, 10) || 0;
        }
        if (includeContestRecords) {
            response.contestRecords = results[resultIndex++] || [];
        }

        return res.json(response);
    } catch (error) {
        console.error('Error al obtener concurso por id:', error);
        return res.status(500).json({ message: 'Error interno al obtener concurso' });
    }
});

/**
 * PUT /contest/:id
 * Actualiza un concurso existente.
 * Solo administradores pueden usar este endpoint.
 *
 * Ejemplo curl compatible con API PHP:
 * curl 'https://gfc.api2.greenborn.com.ar/api/contest/65?' \
 *   --compressed \
 *   -X PUT \
 *   -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
 *   -H 'Accept: application/json, text/plain, * / *' \
 *   -H 'Accept-Language: es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3' \
 *   -H 'Accept-Encoding: gzip, deflate, br, zstd' \
 *   -H 'Authorization: Bearer d8f3650df32623b175d850c02d152068ad857a438746f82d09cc7a18229afa01' \
 *   -H 'Content-Type: multipart/form-data; boundary=----geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98' \
 *   -H 'Origin: http://localhost:4200' \
 *   -H 'Connection: keep-alive' \
 *   -H 'Referer: http://localhost:4200/' \
 *   -H 'Sec-Fetch-Dest: empty' \
 *   -H 'Sec-Fetch-Mode: cors' \
 *   -H 'Sec-Fetch-Site: cross-site' \
 *   -H 'Priority: u=0' \
 *   -H 'Pragma: no-cache' \
 *   -H 'Cache-Control: no-cache' \
 *   -H 'TE: trailers' \
 *   --data-binary \
 *   $'------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="name"\r\n\r\ntest 2\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="sub_title"\r\n\r\ntest\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="description"\r\n\r\ntest\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="max_img_section"\r\n\r\n3\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="organization_type"\r\n\r\nEXTERNO_0\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="start_date"\r\n\r\n2026-02-01T00:00:00.000Z\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98\r\nContent-Disposition: form-data; name="end_date"\r\n\r\n2027-01-01T00:00:00.000Z\r\n------geckoformboundary9db6d7fdc099b7883b46c0db8ff68a98--\r\'
 */
router.put('/:id', adminMiddleware, upload.fields([
    { name: 'image_file', maxCount: 1 },
    { name: 'rules_file', maxCount: 1 }
]), async (req, res) => {
    try {
        const contestId = parseInt(req.params.id, 10);
        if (isNaN(contestId) || contestId <= 0) {
            return res.status(400).json({ success: false, message: 'ID de concurso inválido' });
        }

        const existingContest = await global.knex('contest').where({ id: contestId }).first();
        if (!existingContest || existingContest.deleted_at) {
            return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
        }

        const {
            name,
            description,
            sub_title,
            max_img_section,
            start_date,
            end_date,
            organization_type,
            judged,
            is_test
        } = req.body;

        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
            const value = name ? String(name).trim() : '';
            if (!value) {
                return res.status(400).json({ success: false, message: 'El nombre del concurso no puede ser vacío.' });
            }
            updateData.name = value;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
            updateData.description = description && String(description).trim() !== '' ? String(description) : null;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'sub_title')) {
            updateData.sub_title = sub_title && String(sub_title).trim() !== '' ? String(sub_title) : null;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'max_img_section')) {
            const parsedValue = String(max_img_section).trim();
            if (parsedValue === '') {
                updateData.max_img_section = null;
            } else {
                const parsedInt = parseInt(parsedValue, 10);
                if (Number.isNaN(parsedInt)) {
                    return res.status(400).json({ success: false, message: 'max_img_section debe ser un número válido.' });
                }
                updateData.max_img_section = parsedInt;
            }
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'start_date')) {
            updateData.start_date = String(start_date).trim() === '' ? null : String(start_date);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'end_date')) {
            updateData.end_date = String(end_date).trim() === '' ? null : String(end_date);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'organization_type')) {
            const orgType = String(organization_type).trim();
            if (orgType === '') {
                updateData.organization_type = null;
            } else if (!isValidOrganizationType(orgType) || !ALLOWED_CONTEST_ORG_TYPES.includes(orgType)) {
                return res.status(400).json({ success: false, message: 'organization_type inválido. Valores permitidos: INTERNO, EXTERNO_0, EXTERNO_UNICEN.' });
            } else {
                updateData.organization_type = orgType;
            }
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'judged')) {
            const judgedValue = String(judged).toLowerCase();
            updateData.judged = ['1', 'true', 'yes', 'on'].includes(judgedValue);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'is_test')) {
            const isTestValue = String(is_test).toLowerCase();
            updateData.is_test = ['1', 'true', 'yes', 'on'].includes(isTestValue);
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'is_judging')) {
            const isJudgingValue = String(is_judging).toLowerCase();
            updateData.is_judging = ['1', 'true', 'yes', 'on'].includes(isJudgingValue);
        }

        const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
        const imagesDir = path.join(uploadsBasePath, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        if (req.files && req.files.image_file && req.files.image_file.length > 0) {
            updateData.img_url = saveUploadedFile(req.files.image_file[0], 'contest_title');
        }

        if (req.files && req.files.rules_file && req.files.rules_file.length > 0) {
            updateData.rules_url = saveUploadedFile(req.files.rules_file[0], 'rules');
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No se enviaron datos para actualizar.' });
        }

        await global.knex('contest')
            .where({ id: contestId })
            .update(updateData);

        await logAction(req, `Actualización de Concurso - ${req.user.username}`, { before: existingContest, after: updateData });

        return res.json({ success: true, id: contestId, ...updateData });
    } catch (error) {
        console.error('Error al actualizar concurso:', error);
        return res.status(500).json({ success: false, message: 'Error interno al actualizar concurso', error: error.message });
    }
});

// Endpoint para poner un concurso en etapa de juzgamiento (solo admin)
router.put('/:id/set-judging', adminMiddleware, async (req, res) => {
    try {
        const contestId = parseInt(req.params.id, 10);
        if (isNaN(contestId) || contestId <= 0) {
            return res.status(400).json({ success: false, message: 'ID de concurso inválido' });
        }

        const contest = await global.knex('contest').where({ id: contestId }).first();
        if (!contest || contest.deleted_at) {
            return res.status(404).json({ success: false, message: 'Concurso no encontrado' });
        }

        await global.knex('contest')
            .where({ id: contestId })
            .update({ is_judging: true, judged: false });

        await logAction(req, `Concurso puesto en juzgamiento - ${req.user.username}`, {
            contest_id: contestId,
            contest_name: contest.name
        });

        const updated = await global.knex('contest').where({ id: contestId }).first();

        return res.json({
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                is_judging: updated.is_judging === 1 || updated.is_judging === true || String(updated.is_judging) === '1',
                judged: updated.judged === 1 || updated.judged === true || String(updated.judged) === '1'
            },
            message: `El concurso "${contest.name}" ha sido puesto en etapa de juzgamiento`
        });
    } catch (error) {
        console.error('Error al poner concurso en juzgamiento:', error);
        return res.status(500).json({ success: false, message: 'Error interno al poner concurso en juzgamiento', error: error.message });
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

    const IMG_REPOSITORY_PATH = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
    const archiver = require('archiver');
    const IMG_BASE_PATH = process.env.IMG_BASE_PATH || 'https://assets.prod-gfc.greenborn.com.ar';

    try {
        const contest = await global.knex('contest').where('id', contestId).first();
        if (!contest || contest.deleted_at) {
            return res.status(404).json({
                success: false,
                message: 'Concurso no encontrado'
            });
        }

        const isTestContest = contest.is_test === 1 || contest.is_test === true || String(contest.is_test) === '1';
        const userCanSeeTest = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');
        if (isTestContest && !userCanSeeTest) {
            return res.status(404).json({
                success: false,
                message: 'Concurso no encontrado'
            });
        }
        
        const now = new Date();
        const endDate = new Date(contest.end_date);
        const isContestClosed = endDate < now;
        
        // Determinar nombre del archivo según estado del concurso
        let zipFileName;
        let zipFilePath;
        
        if (isContestClosed) {
            // Concurso cerrado: nombre fijo sin fecha
            zipFileName = `concurso_${contestId}.zip`;
            zipFilePath = path.join(IMG_REPOSITORY_PATH, zipFileName);
            
            // Si el archivo definitivo ya existe, solo retornarlo
            if (fs.existsSync(zipFilePath)) {
                return res.json({
                    success: true,
                    contest_id: contestId,
                    download_url: `${IMG_BASE_PATH}/${zipFileName}`,
                    message: 'El concurso está finalizado y el archivo comprimido ya existe.'
                });
            }
            
            // Eliminar archivos temporales antiguos con fecha para este concurso
            const files = fs.readdirSync(IMG_REPOSITORY_PATH);
            const oldTempPattern = new RegExp(`^concurso_${contestId}_\\d{8}\\.zip$`);
            files.forEach(file => {
                if (oldTempPattern.test(file)) {
                    try {
                        fs.unlinkSync(path.join(IMG_REPOSITORY_PATH, file));
                        console.log(`Archivo temporal antiguo eliminado: ${file}`);
                    } catch (err) {
                        console.error(`Error eliminando archivo temporal ${file}:`, err);
                    }
                }
            });
        } else {
            // Concurso abierto: nombre con fecha actual
            const dateNow = new Date();
            const year = dateNow.getFullYear();
            const month = dateNow.getMonth() + 1; // getMonth() devuelve 0-11
            const day = dateNow.getDate();
            const dateStr = `${year}${month}${day}`;
            zipFileName = `concurso_${contestId}_${dateStr}.zip`;
            zipFilePath = path.join(IMG_REPOSITORY_PATH, zipFileName);
            
            // Eliminar archivos anteriores de este concurso (tanto con fecha como sin fecha)
            const files = fs.readdirSync(IMG_REPOSITORY_PATH);
            const oldPattern = new RegExp(`^concurso_${contestId}(_\\d{8})?\\.zip$`);
            files.forEach(file => {
                if (oldPattern.test(file) && file !== zipFileName) {
                    try {
                        fs.unlinkSync(path.join(IMG_REPOSITORY_PATH, file));
                        console.log(`Archivo anterior eliminado: ${file}`);
                    } catch (err) {
                        console.error(`Error eliminando archivo ${file}:`, err);
                    }
                }
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
            // Obtener los premios (prize) de metric_abm con organization_type = 'INTERNO'
            const premios = await global.knex('metric_abm')
                .select('prize')
                .where('organization_type', 'INTERNO');

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
                        // Crear subdirectorios de premios vacíos junto a las fotos
                        if (Array.isArray(premios)) {
                            premios.forEach(premio => {
                                if (premio.prize) {
                                    const premioDir = path.join(secDir, premio.prize);
                                    if (!fs.existsSync(premioDir)) {
                                        fs.mkdirSync(premioDir, { recursive: true });
                                    }
                                }
                            });
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

router.get('/compiled-winners', authMiddleware, async (req, res) => {
    if (!req.user || req.user.role_id != '1') {
        return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
    }

    const archiver = require('archiver');
    const IMG_REPOSITORY_PATH = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
    const IMG_BASE_PATH = process.env.IMG_BASE_PATH || 'https://assets.prod-gfc.greenborn.com.ar';

    function normalizeText(s) {
        return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
    function sanitizeContestTitle(s, fallback) {
        const base = (s || fallback || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    }
    function sanitizeNamePart(s) {
        const base = (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    }
    function normalizePrizeInputList(premiosCsv) {
        const defaults = ['1er PREMIO', '2do PREMIO', '3er PREMIO', 'MENCION ESPECIAL'];
        if (!premiosCsv || premiosCsv.toString().trim() === '') return defaults;
        const items = premiosCsv.split(',').map(v => normalizeText(v));
        const mapped = items.map(v => {
            if (v.includes('1er') || v.includes('primer')) return '1er PREMIO';
            if (v.includes('2do') || v.includes('segundo')) return '2do PREMIO';
            if (v.includes('3er') || v.includes('tercer')) return '3er PREMIO';
            if (v.includes('mencion')) return 'MENCION ESPECIAL';
            return v.toUpperCase();
        });
        const uniq = Array.from(new Set(mapped.filter(Boolean)));
        return uniq.length ? uniq : defaults;
    }
    function normalizeCategoryList(catCsv) {
        const defaults = ['Estímulo', 'Primera'];
        if (!catCsv || catCsv.toString().trim() === '') return defaults;
        const items = catCsv.split(',').map(v => v.trim()).filter(Boolean);
        return items.length ? items : defaults;
    }

    try {
        const currentYear = new Date().getFullYear();
        const year = parseInt(req.query.year, 10) || currentYear;
        const premiosList = normalizePrizeInputList(req.query.premios);
        const categoriasList = normalizeCategoryList(req.query.categorias).map(v => normalizeText(v));

        console.log('═══════════════════════════════════════════════════════');
        console.log('GET /contest/compiled-winners - Inicio');
        console.log('Parámetros: year=', year, ', premios=', premiosList.join(', '), ', categorias=', categoriasList.join(', '));

        const dateStart = new Date(`${year}-01-01T00:00:00`);
        const dateEnd = new Date(`${year}-12-31T23:59:59`);

        const contests = await global.knex('contest')
            .select('*')
            .where('judged', true)
            .andWhere('organization_type', 'INTERNO')
            .andWhereBetween('end_date', [dateStart, dateEnd]);

        console.log('Concursos seleccionados:', contests.length);
        contests.forEach(c => console.log(` - id=${c.id}, name=${c.title || c.name}, end_date=${c.end_date}`));

        const compiledDir = path.join(IMG_REPOSITORY_PATH, 'compilado_premiadas');
        if (fs.existsSync(compiledDir)) {
            try { fs.rmSync(compiledDir, { recursive: true, force: true }); } catch (e) { console.error('Error eliminando directorio compilado:', e); }
        }
        fs.mkdirSync(compiledDir, { recursive: true });
        console.log('Creado directorio base:', compiledDir);
        const rootJurado = path.join(compiledDir, 'eleccion_jurado');
        const rootPublico = path.join(compiledDir, 'eleccion_publico');
        if (!fs.existsSync(rootJurado)) { fs.mkdirSync(rootJurado, { recursive: true }); console.log('Creado directorio raíz:', rootJurado); }
        if (!fs.existsSync(rootPublico)) { fs.mkdirSync(rootPublico, { recursive: true }); console.log('Creado directorio raíz:', rootPublico); }

        const categoriasEncontradas = new Set();
        const seccionesEncontradas = new Set();
        const premiosEncontrados = new Set();
        let totalFotografias = 0;

        for (const contest of contests) {
            const rows = await global.knex('contest_result as cr')
                .leftJoin('metric as m', 'cr.metric_id', 'm.id')
                .leftJoin('image as i', 'cr.image_id', 'i.id')
                .leftJoin('profile as p', 'i.profile_id', 'p.id')
                .leftJoin('profile_contest as pc', function() {
                    this.on('i.profile_id', '=', 'pc.profile_id').andOn('cr.contest_id', '=', 'pc.contest_id');
                })
                .leftJoin('category as c', 'pc.category_id', 'c.id')
                .leftJoin('section as s', 'cr.section_id', 's.id')
                .select(
                    'i.url as image_url',
                    'i.code as image_code',
                    'i.title as image_title',
                    'p.name as author_name',
                    'p.last_name as author_last_name',
                    'm.prize as prize',
                    'c.name as category_name',
                    's.name as section_name'
                )
                .where('cr.contest_id', contest.id)
                .whereIn('m.prize', premiosList);
            console.log('Filas encontradas para concurso', contest.id, ':', rows.length);

            for (const row of rows) {
                const catNameNorm = normalizeText(row.category_name || '');
                if (categoriasList.length && !categoriasList.includes(catNameNorm)) continue;
                const categoriaDir = path.join(compiledDir, sanitizeNamePart(row.category_name || 'categoria'));
                if (!fs.existsSync(categoriaDir)) { fs.mkdirSync(categoriaDir, { recursive: true }); console.log('Creado directorio categoría:', categoriaDir); }
                const sectionDir = path.join(categoriaDir, sanitizeNamePart(row.section_name || 'seccion'));
                if (!fs.existsSync(sectionDir)) { fs.mkdirSync(sectionDir, { recursive: true }); console.log('Creado directorio sección:', sectionDir); }
                const sectionJuradoDir = path.join(sectionDir, 'eleccion_jurado');
                if (!fs.existsSync(sectionJuradoDir)) { fs.mkdirSync(sectionJuradoDir, { recursive: true }); console.log('Creado directorio sección (eleccion_jurado):', sectionJuradoDir); }
                const premioDir = path.join(sectionDir, sanitizeNamePart(row.prize || 'premio'));
                if (!fs.existsSync(premioDir)) { fs.mkdirSync(premioDir, { recursive: true }); console.log('Creado directorio premio:', premioDir); }
                const srcPath = path.join(IMG_REPOSITORY_PATH, row.image_url || '');
                const ext = path.extname(row.image_url || '') || '.jpg';
                const destFile = (row.image_code && String(row.image_code).trim()) ? `${row.image_code}${ext}` : path.basename(row.image_url || '');
                const destPath = path.join(premioDir, destFile);
                categoriasEncontradas.add(row.category_name || '');
                seccionesEncontradas.add(row.section_name || '');
                premiosEncontrados.add(row.prize || '');
                try {
                    if (fs.existsSync(srcPath)) {
                        fs.copyFileSync(srcPath, destPath);
                        totalFotografias++;
                        console.log('Copiada fotografía:', srcPath, '->', destPath);
                    }
                } catch (e) { console.error('Error copiando fotografía:', e); }
            }
        }

        console.log('Categorías encontradas:', Array.from(categoriasEncontradas).filter(Boolean).join(', '));
        console.log('Secciones encontradas:', Array.from(seccionesEncontradas).filter(Boolean).join(', '));
        console.log('Premios encontrados:', Array.from(premiosEncontrados).filter(Boolean).join(', '));
        console.log('Total de fotografías copiadas:', totalFotografias);

        const zipName = `compilado_premiadas_${year}.zip`;
        const zipPath = path.join(IMG_REPOSITORY_PATH, zipName);
        if (fs.existsSync(zipPath)) {
            try { fs.unlinkSync(zipPath); } catch (e) { console.error('Error eliminando ZIP anterior:', e); }
        }
        await new Promise((resolve, reject) => {
            console.log('Generando ZIP:', zipPath);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', () => { console.log('ZIP generado:', zipPath, '-', archive.pointer(), 'bytes'); resolve(); });
            archive.on('error', err => { console.error('Error generando ZIP:', err); reject(err); });
            archive.pipe(output);
            archive.directory(compiledDir, false);
            archive.finalize();
        });

        function joinUrl(base, part) {
            const b = String(base).replace(/\/+$/, '');
            const p = String(part).replace(/^\/+/, '');
            return `${b}/${p}`;
        }
        const downloadUrl = joinUrl(IMG_BASE_PATH, zipName);
        console.log('Respuesta enviada con download_url:', downloadUrl);
        return res.json({ success: true, year, download_url: downloadUrl });
    } catch (error) {
        console.error('Error al compilar premiadas del año:', error);
        return res.status(500).json({ success: false, message: 'Error interno al compilar premiadas del año', error: error.message });
    }
});

/**
 * DELETE /contest/:id
 * Borrado lógico de un concurso. Establece deleted_at con la fecha actual.
 * 
 * Restricciones:
 * - Solo accesible para usuarios administradores (role_id = 1)
 * - No se puede eliminar si ya está eliminado
 */
router.delete('/:id', adminMiddleware, async (req, res) => {
    const contestId = parseInt(req.params.id);
    
    if (isNaN(contestId) || contestId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'ID de concurso inválido'
        });
    }

    try {
        const contest = await global.knex('contest')
            .where('id', contestId)
            .first();
        
        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Concurso no encontrado'
            });
        }

        if (contest.deleted_at) {
            return res.status(409).json({
                success: false,
                message: 'El concurso ya fue eliminado'
            });
        }

        await global.knex('contest')
            .where('id', contestId)
            .update({ deleted_at: new Date() });

        await logAction(req, `Borrado lógico de concurso ID: ${contestId} - Nombre: ${contest.name} - Usuario: ${req.user.username}`, JSON.stringify({
            contest_id: contestId,
            contest_name: contest.name,
            deleted_at: new Date()
        }));

        res.status(200).json({
            success: true,
            message: `Concurso "${contest.name}" eliminado correctamente`
        });

    } catch (error) {
        console.error('Error al eliminar concurso:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar el concurso',
            error: error.message
        });
    }
});

module.exports = router;
