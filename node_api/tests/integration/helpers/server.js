// Helper de integración: levanta node_api/server.js como proceso hijo,
// apuntando a la base de datos de pruebas, y lo apaga al terminar.
//
// No reutiliza el proceso del runner porque server.js hace `process.exit`
// implícito vía listeners globales (sesiones, sockets, etc.) y usa `global.knex`:
// aislarlo en un proceso hijo evita contaminar otros tests.

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const NODE_API_DIR = path.join(__dirname, '..', '..', '..');

function loadEnvTest() {
    const envPath = path.join(NODE_API_DIR, '.env.test');
    const vars = {};
    if (fs.existsSync(envPath)) {
        for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
            const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
            if (m) vars[m[1]] = m[2];
        }
    }
    return vars;
}

async function waitForHealth(baseUrl, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await axios.get(`${baseUrl}/health`, { timeout: 1000 });
            if (res.status === 200) return;
        } catch (_) { /* server todavía no responde */ }
        await new Promise(r => setTimeout(r, 300));
    }
    throw new Error(`La API de test no respondió /health dentro de ${timeoutMs}ms`);
}

let activeProcess = null;

async function startTestServer() {
    const envTest = loadEnvTest();
    const port = envTest.TEST_API_PORT || '3099';

    const child = spawn('node', ['server.js'], {
        cwd: NODE_API_DIR,
        env: {
            ...process.env,
            DB_CLIENT: 'mysql',
            DB_HOST: envTest.TEST_DB_HOST || '127.0.0.1',
            DB_PORT: envTest.TEST_DB_PORT || '3306',
            DB_USER: envTest.TEST_DB_USER || 'gfc_test_user',
            DB_PASSWORD: envTest.TEST_DB_PASSWORD || 'gfc_test_password',
            DB_NAME: envTest.TEST_DB_NAME || 'gfc_test',
            SERVICE_PORT_ADMIN: port,
            MODO_ESCRITURA: 'READ_WRITE',
            NODE_ENV: 'test'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', d => { output += d.toString(); });
    child.stderr.on('data', d => { output += d.toString(); });

    child.on('exit', (code) => {
        if (activeProcess === child && code !== null && code !== 0) {
            console.error('--- Salida del server de test ---\n' + output);
        }
    });

    activeProcess = child;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await waitForHealth(baseUrl);
    } catch (err) {
        console.error('--- Salida del server de test ---\n' + output);
        throw err;
    }

    return {
        baseUrl,
        pid: child.pid,
        stop() {
            if (child.pid) {
                // Matamos exactamente el PID que spawneamos, nunca por patrón/puerto.
                process.kill(child.pid, 'SIGTERM');
            }
            activeProcess = null;
        }
    };
}

module.exports = { startTestServer };
