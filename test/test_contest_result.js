// test_contest_result.js
// Script de prueba para consultar contest-result vía API REST, con login de admin

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cargar configuración de entorno
let baseUrl = process.env.NODE_API_BASE_URL;
let adminUser = process.env.ADMIN_USERNAME;
let adminPass = process.env.ADMIN_PASSWORD;
if (!baseUrl || !adminUser || !adminPass) {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            for (const line of envContent.split(/\r?\n/)) {
                if (!baseUrl) {
                    const m = line.match(/^NODE_API_BASE_URL=(.*)$/);
                    if (m) baseUrl = m[1].trim();
                }
                if (!adminUser) {
                    const m = line.match(/^ADMIN_USERNAME=(.*)$/);
                    if (m) adminUser = m[1].trim();
                }
                if (!adminPass) {
                    const m = line.match(/^ADMIN_PASSWORD=(.*)$/);
                    if (m) adminPass = m[1].trim();
                }
            }
        }
    } catch (e) {}
}

// Las siguientes constantes se definen después de procesar los argumentos

async function login() {
    const data = { username: adminUser, password: adminPass };
    console.log(`\n[LOGIN] POST ${API_LOGIN}`);
    console.log('Enviando:', JSON.stringify(data));
    const res = await axios.post(API_LOGIN, data, { headers: { 'Content-Type': 'application/json' } });
    console.log('Respuesta:', JSON.stringify(res.data));
    // Buscar token en posibles ubicaciones
    const token = res.data.token || res.data.accessToken || res.data.jwt || res.data.data?.token || res.data.profile?.access_token || res.data.user?.access_token;
    if (token) return token;
    throw new Error('Login fallido: No se obtuvo token. Respuesta: ' + JSON.stringify(res.data));
}

async function testContestResult(token, contestId, page, perPage) {
    if (!contestId) {
        console.error('❌ Debes especificar el contest_id como argumento. Ejemplo: node test_contest_result.js 51');
        process.exit(1);
    }
    const expand = 'profile,profile.user,profile.fotoclub,image.profile,image.thumbnail';
    let url = `${API_CONTEST_RESULT}?expand=${encodeURIComponent(expand)}&filter[contest_id]=${contestId}`;
    if (page) url += `&page=${page}`;
    if (perPage) url += `&per-page=${perPage}`;
    console.log(`\n[GET] ${url}`);
    try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Respuesta:', JSON.stringify(res.data, null, 2));
        if (res.data && Array.isArray(res.data.items)) {
            console.log(`✔️  Consulta exitosa. Se recibieron ${res.data.items.length} resultados.`);
            // Verificar que los elementos sean diferentes entre sí por contest_result_id
            const ids = res.data.items.map(e => e.contest_result_id);
            const uniqueIds = new Set(ids);
            if (uniqueIds.size !== ids.length) {
                console.error('❌ Hay elementos repetidos en contest_result_id:', ids);
                process.exit(1);
            } else {
                console.log('✔️ Todos los elementos son diferentes entre sí por contest_result_id.');
            }
        } else {
            console.error('❌ La respuesta no contiene un array items.');
            process.exit(1);
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ Error en la respuesta de la API:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error al conectar con la API:', error.message);
        }
        process.exit(1);
    }
}


// Leer argumentos de línea de comandos

const args = process.argv.slice(2);
let contestIdArg = null;
let pageArg = null;
let perPageArg = null;
let baseUrlArg = null;

for (let i = 0; i < args.length; i++) {
    if (!contestIdArg && args[i] && !args[i].startsWith('--')) {
        contestIdArg = args[i];
        continue;
    }
    if (args[i] === '--page' && args[i + 1]) {
        pageArg = args[i + 1];
        i++;
    } else if (args[i] === '--per-page' && args[i + 1]) {
        perPageArg = args[i + 1];
        i++;
    } else if (args[i] === '--base-url' && args[i + 1]) {
        baseUrlArg = args[i + 1];
        i++;
    }
}

// Si se especifica --base-url, usarlo
if (baseUrlArg) {
    baseUrl = baseUrlArg;
}

const BASE_URL = baseUrl || 'http://localhost:3000';
const API_LOGIN = `${BASE_URL.replace(/\/$/, '')}/api/auth/login`;
const API_CONTEST_RESULT = `${BASE_URL.replace(/\/$/, '')}/api/contest-result`;

(async () => {
    try {
        const token = await login();
        await testContestResult(token, contestIdArg, pageArg, perPageArg);
    } catch (e) {
        console.error('❌ Error en el test:', e.message);
        process.exit(1);
    }
})();
