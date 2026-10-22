const fs = require('fs');
const path = require('path');

const JUDGED_SUFFIX = '_judged';

function getAssetsPath() {
    return process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
}

function getAssetsBaseUrl() {
    return process.env.IMG_BASE_PATH || 'https://assets.prod-gfc.greenborn.com.ar';
}

function isContestJudged(contest) {
    return !!contest && (contest.judged === 1 || contest.judged === true || String(contest.judged) === '1');
}

function getDateStamp(date = new Date()) {
    return `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
}

function getContestZipFileName(contest, date = new Date()) {
    const contestId = contest.id;
    if (isContestJudged(contest)) {
        return `concurso_${contestId}${JUDGED_SUFFIX}.zip`;
    }

    const endDate = new Date(contest.end_date);
    if (endDate < date) {
        return `concurso_${contestId}.zip`;
    }

    return `concurso_${contestId}_${getDateStamp(date)}.zip`;
}

function getContestZipPattern(contestId) {
    return new RegExp(`^concurso_${contestId}(_\\d{8}|${JUDGED_SUFFIX})?\\.zip$`);
}

function listContestZipFiles(contestId) {
    const assetsPath = getAssetsPath();
    if (!fs.existsSync(assetsPath)) return [];

    const pattern = getContestZipPattern(contestId);
    return fs.readdirSync(assetsPath).filter(file => pattern.test(file));
}

function removeContestZipFiles(contestId, { keep } = {}) {
    const assetsPath = getAssetsPath();
    const removed = [];

    listContestZipFiles(contestId).forEach(file => {
        if (keep && file === keep) return;
        try {
            fs.unlinkSync(path.join(assetsPath, file));
            removed.push(file);
            console.log(`ZIP de concurso eliminado: ${file}`);
        } catch (err) {
            console.error(`Error eliminando ZIP ${file}:`, err);
        }
    });

    return removed;
}

function invalidateJudgedZip(contestId) {
    const zipPath = path.join(getAssetsPath(), `concurso_${contestId}${JUDGED_SUFFIX}.zip`);
    if (!fs.existsSync(zipPath)) return false;

    try {
        fs.unlinkSync(zipPath);
        console.log(`ZIP juzgado invalidado: ${path.basename(zipPath)}`);
        return true;
    } catch (err) {
        console.error(`Error invalidando ZIP juzgado ${zipPath}:`, err);
        return false;
    }
}

function removeContestTempDir(contestId) {
    const contestDir = path.join(getAssetsPath(), `concurso_${contestId}`);
    try {
        fs.rmSync(contestDir, { recursive: true, force: true });
    } catch (err) {
        console.error(`Error eliminando directorio temporal ${contestDir}:`, err);
    }
}

function joinUrl(base, part) {
    const b = String(base).replace(/\/+$/, '');
    const p = String(part).replace(/^\/+/, '');
    return `${b}/${p}`;
}

function sanitizeDirectorySegment(value) {
    return (value ?? '')
        .toString()
        .replace(/[\/\\:*?"<>|]/g, '')
        .replace(/[\u0000-\u001f]/g, '')
        .trim();
}

module.exports = {
    JUDGED_SUFFIX,
    getAssetsPath,
    getAssetsBaseUrl,
    isContestJudged,
    getContestZipFileName,
    listContestZipFiles,
    removeContestZipFiles,
    invalidateJudgedZip,
    removeContestTempDir,
    joinUrl,
    sanitizeDirectorySegment
};
