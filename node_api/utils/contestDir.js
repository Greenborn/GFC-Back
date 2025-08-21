const fs = require('fs');
const path = require('path');

/**
 * Crea o vacía un directorio para el concurso
 * @param {string} basePath - Ruta base del repositorio de imágenes
 * @param {number|string} contestId - ID del concurso
 * @returns {string} - Ruta final del directorio creado
 */
function prepareContestDirectory(basePath, contestId) {
    const contestDir = path.join(basePath, `concurso_${contestId}`);
    if (fs.existsSync(contestDir)) {
        // Vaciar el directorio
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
    return contestDir;
}

module.exports = { prepareContestDirectory };
