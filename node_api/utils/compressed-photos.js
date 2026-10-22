const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { normalizeDni } = require('./contest-authorized-participant-parser');
const {
    getAssetsPath,
    getAssetsBaseUrl,
    getContestZipFileName,
    removeContestTempDir,
    joinUrl,
    sanitizeDirectorySegment
} = require('./contest-zip');

const JOB_TTL_MS = 10 * 60 * 1000;
const COPY_PERCENT = 70;
const jobs = new Map();
const jobsByContest = new Map();

function sanitizeFilenameSegment(str) {
    return (str || '')
        .toString()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[\/\\:*?"<>|]/g, '')
        .trim()
        .replace(/\s+/g, '_');
}

function pruneJobs() {
    const now = Date.now();
    for (const [jobId, job] of jobs) {
        if (job.finished_at && now - job.finished_at > JOB_TTL_MS) {
            jobs.delete(jobId);
            if (jobsByContest.get(job.contest_id) === jobId) {
                jobsByContest.delete(job.contest_id);
            }
        }
    }
}

function getJobSnapshot(job) {
    return {
        success: true,
        job_id: job.id,
        contest_id: job.contest_id,
        status: job.status,
        phase: job.phase,
        percent: Math.max(0, Math.min(100, Math.round(job.percent || 0))),
        processed: job.processed,
        total: job.total,
        message: job.message,
        download_url: job.download_url || null,
        error: job.error || null
    };
}

function getJob(jobId) {
    pruneJobs();
    return jobs.get(jobId) || null;
}

function startCompressedPhotosJob(contest, isJudged) {
    pruneJobs();

    const runningJobId = jobsByContest.get(contest.id);
    if (runningJobId) {
        const runningJob = jobs.get(runningJobId);
        if (runningJob && runningJob.status === 'running') {
            return runningJob;
        }
    }

    const job = {
        id: crypto.randomUUID(),
        contest_id: contest.id,
        file_name: getContestZipFileName(contest),
        status: 'running',
        phase: 'preparing',
        percent: 0,
        processed: 0,
        total: 0,
        message: 'Preparando archivo...',
        download_url: null,
        error: null,
        created_at: Date.now(),
        finished_at: null
    };

    jobs.set(job.id, job);
    jobsByContest.set(contest.id, job.id);

    runJob(contest, isJudged, job);

    return job;
}

async function runJob(contest, isJudged, job) {
    const contestId = contest.id;
    const assetsPath = getAssetsPath();
    const zipFilePath = path.join(assetsPath, job.file_name);
    const contestDir = path.join(assetsPath, `concurso_${contestId}`);

    try {
        const images = await global.knex('contest_result as cr')
            .join('image as i', 'cr.image_id', 'i.id')
            .leftJoin('metric as m', 'cr.metric_id', 'm.id')
            .leftJoin('profile as p', 'i.profile_id', 'p.id')
            .leftJoin('fotoclub as fc', 'p.fotoclub_id', 'fc.id')
            .select(
                'i.id',
                'i.code',
                'i.title',
                'i.profile_id',
                'i.url',
                'cr.section_id',
                'cr.metric_id',
                'cr.id as contest_result_id',
                'cr.position',
                'm.prize',
                'p.name as profile_name',
                'p.last_name as profile_last_name',
                'p.dni as profile_dni',
                'fc.name as fotoclub_name'
            )
            .where('cr.contest_id', contestId);

        const contestSections = await global.knex('contest_section as cs')
            .join('section as s', 'cs.section_id', '=', 's.id')
            .select('s.id', 's.name')
            .where('cs.contest_id', contestId);

        const contestCategories = await global.knex('contest_category as cc')
            .join('category as c', 'cc.category_id', '=', 'c.id')
            .select('c.id', 'c.name', 'c.mostrar_en_ranking')
            .where('cc.contest_id', contestId);

        const authorizedRows = isJudged
            ? await global.knex('contest_authorized_participant')
                .where('contest_id', contestId)
                .select('dni_normalized', 'faculty')
            : [];
        const facultyByDni = {};
        authorizedRows.forEach(row => { facultyByDni[row.dni_normalized] = row.faculty; });

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

        const isOrdenMerito = String(contest.scoring_mode || 'TRADICIONAL') === 'ORDEN_MERITO';
        const categoryDirName = (category) => sanitizeDirectorySegment(category.name) || `categoria_${category.id}`;
        const sectionDirName = (section) => sanitizeDirectorySegment(section.name) || `seccion_${section.id}`;

        if (Array.isArray(contestCategories)) {
            const premios = (isJudged || isOrdenMerito) ? [] : await global.knex('metric_abm')
                .select('prize')
                .where('organization_type', 'INTERNO');

            contestCategories.forEach(cat => {
                const catDir = path.join(contestDir, categoryDirName(cat));
                if (!fs.existsSync(catDir)) {
                    fs.mkdirSync(catDir, { recursive: true });
                }
                if (Array.isArray(contestSections)) {
                    contestSections.forEach(sec => {
                        const secDir = path.join(catDir, sectionDirName(sec));
                        if (!fs.existsSync(secDir)) {
                            fs.mkdirSync(secDir, { recursive: true });
                        }
                        if (!isJudged && Array.isArray(premios)) {
                            premios.forEach(premio => {
                                const premioName = sanitizeDirectorySegment(premio.prize);
                                if (premioName) {
                                    const premioDir = path.join(secDir, premioName);
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

        const inscritos = await global.knex('profile_contest as pc')
            .join('profile as p', 'pc.profile_id', '=', 'p.id')
            .select('p.id as profile_id', 'p.name as profile_name', 'pc.category_id')
            .where('pc.contest_id', contestId);

        const profileCategoryDict = {};
        inscritos.forEach(item => {
            profileCategoryDict[item.profile_id] = item.category_id;
        });

        job.phase = 'copying';
        job.percent = 0;
        job.processed = 0;
        job.total = images.length;
        job.message = `Copiando imágenes (0/${images.length})`;

        for (let index = 0; index < images.length; index++) {
            const img = images[index];
            const categoryId = profileCategoryDict[img.profile_id];
            const categoryObj = contestCategories.find(cat => cat.id === categoryId);
            const sectionObj = contestSections.find(sec => sec.id === img.section_id);

            if (categoryObj && sectionObj && img.url && img.code) {
                const baseDir = path.join(contestDir, categoryDirName(categoryObj), sectionDirName(sectionObj));
                const srcPath = path.join(assetsPath, img.url);
                const ext = path.extname(img.url) || '.jpg';

                let fileDir = baseDir;
                if (isJudged) {
                    const folderSegment = sanitizeDirectorySegment(
                        isOrdenMerito
                            ? (img.position === null || img.position === undefined ? '' : img.position)
                            : (img.prize || '')
                    );
                    if (folderSegment) {
                        fileDir = path.join(baseDir, String(folderSegment));
                        if (!fs.existsSync(fileDir)) {
                            fs.mkdirSync(fileDir, { recursive: true });
                        }
                    }
                }

                let fileName;
                if (isJudged) {
                    const positionSegment = sanitizeFilenameSegment(
                        isOrdenMerito ? (img.position ?? 'SP') : (img.prize || 'SP')
                    );
                    const faculty = facultyByDni[normalizeDni(img.profile_dni)] || img.fotoclub_name || '';
                    const facultySegment = sanitizeFilenameSegment(faculty);
                    const autorSegment = sanitizeFilenameSegment(`${img.profile_name || ''} ${img.profile_last_name || ''}`);
                    const obraSegment = sanitizeFilenameSegment(img.title);
                    fileName = `${positionSegment}_${facultySegment}_${autorSegment}_${obraSegment}${ext}`;
                    if (fs.existsSync(path.join(fileDir, fileName))) {
                        fileName = `${positionSegment}_${facultySegment}_${autorSegment}_${obraSegment}_${img.code}${ext}`;
                    }
                } else {
                    fileName = `${img.code}${ext}`;
                }

                try {
                    if (fs.existsSync(srcPath)) {
                        await fs.promises.copyFile(srcPath, path.join(fileDir, fileName));
                    }
                } catch (err) {
                    console.error(`Error copiando imagen ${srcPath} a ${path.join(fileDir, fileName)}:`, err);
                }
            }

            job.processed = index + 1;
            job.percent = images.length ? Math.floor((job.processed / images.length) * COPY_PERCENT) : COPY_PERCENT;
            job.message = `Copiando imágenes (${job.processed}/${images.length})`;
        }

        if (!isJudged && isOrdenMerito && Array.isArray(contestCategories) && Array.isArray(contestSections)) {
            contestCategories.forEach(cat => {
                const catDir = path.join(contestDir, categoryDirName(cat));
                contestSections.forEach(sec => {
                    const imagesCount = images.filter(img => {
                        const categoryId = profileCategoryDict[img.profile_id];
                        return categoryId === cat.id && img.section_id === sec.id;
                    }).length;
                    if (imagesCount <= 0) {
                        return;
                    }
                    const secDir = path.join(catDir, sectionDirName(sec));
                    if (!fs.existsSync(secDir)) {
                        fs.mkdirSync(secDir, { recursive: true });
                    }
                    for (let order = 1; order <= imagesCount; order++) {
                        const orderDir = path.join(secDir, String(order));
                        if (!fs.existsSync(orderDir)) {
                            fs.mkdirSync(orderDir, { recursive: true });
                        }
                    }
                });
            });
        }

        job.phase = 'compressing';
        job.percent = COPY_PERCENT;
        job.message = 'Comprimiendo archivo (0%)';

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            let settled = false;

            const fail = (err) => {
                if (settled) return;
                settled = true;
                reject(err);
            };

            output.on('close', () => {
                if (settled) return;
                settled = true;
                resolve();
            });
            output.on('error', fail);
            archive.on('error', fail);
            archive.on('progress', data => {
                const totalBytes = data && data.fs ? data.fs.totalBytes : 0;
                const processedBytes = data && data.fs ? data.fs.processedBytes : 0;
                let ratio = 0;

                if (totalBytes > 0) {
                    ratio = processedBytes / totalBytes;
                } else if (data && data.entries && data.entries.total > 0) {
                    ratio = data.entries.processed / data.entries.total;
                } else {
                    return;
                }

                job.percent = Math.min(99, COPY_PERCENT + Math.floor(ratio * (100 - COPY_PERCENT)));
                job.message = `Comprimiendo archivo (${job.percent}%)`;
            });

            archive.pipe(output);
            archive.directory(contestDir, false);
            archive.finalize();
        });

        job.status = 'done';
        job.phase = 'done';
        job.percent = 100;
        job.message = 'Archivo listo para descargar';
        job.download_url = joinUrl(getAssetsBaseUrl(), job.file_name);
        job.finished_at = Date.now();
    } catch (error) {
        console.error('Error al generar el ZIP del concurso:', error);
        job.status = 'error';
        job.phase = 'error';
        job.message = 'Error al generar el archivo';
        job.error = error.message || 'Error interno al generar el archivo';
        job.finished_at = Date.now();

        try {
            if (fs.existsSync(zipFilePath)) {
                fs.unlinkSync(zipFilePath);
            }
        } catch (err) {
            console.error(`Error eliminando ZIP parcial ${zipFilePath}:`, err);
        }
    } finally {
        removeContestTempDir(contestId);
        if (jobsByContest.get(contestId) === job.id) {
            jobsByContest.delete(contestId);
        }
    }
}

module.exports = {
    startCompressedPhotosJob,
    getJob,
    getJobSnapshot
};
