// test_fotoclub_create.js
// Script de prueba para crear un fotoclub vía API REST y verificar los nuevos campos

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
const BASE_URL = baseUrl || 'http://localhost:3000';
const API_LIST = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/get_all`;
const API_CREATE = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/create`;
const API_LOGIN = `${BASE_URL.replace(/\/$/, '')}/api/auth/login`;

async function login() {
    const data = { username: adminUser, password: adminPass };
    const res = await axios.post(API_LOGIN, data, { headers: { 'Content-Type': 'application/json' } });
    const token = res.data.token || res.data.accessToken || res.data.jwt || res.data.data?.token || res.data.profile?.access_token || res.data.user?.access_token;
    if (token) return token;
    throw new Error('Login fallido: No se obtuvo token.');
}

async function getFotoclubs(token) {
    const res = await axios.get(API_LIST, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.items || res.data;
}

async function createFotoclub(token, fotoclub) {
    const res = await axios.post(API_CREATE, fotoclub, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return res.data;
}

(async () => {
    try {
        const token = await login();
        const before = await getFotoclubs(token);
        const baseName = `Prueba ${Date.now()}`;
        const nuevo = {
            name: baseName,
            description: 'Fotoclub de prueba',
            facebook: 'https://fb.example',
            instagram: 'https://ig.example',
            email: 'test@example.com',
            mostrar_en_ranking: 1,
            organization_type: 'INTERNO'
        };
        console.log('Creando fotoclub:', nuevo);
        const result = await createFotoclub(token, nuevo);
        if (!result.stat) throw new Error('Error al crear fotoclub: ' + JSON.stringify(result));
        console.log('Respuesta creación:', result);
        const after = await getFotoclubs(token);
        const created = after.find(f => f.name === baseName);
        if (!created) throw new Error('No se encontró el fotoclub creado');
        if (created.mostrar_en_ranking !== 1 || created.organization_type !== 'INTERNO') {
            throw new Error('Los campos no fueron guardados correctamente: ' + JSON.stringify(created));
        }
        console.log('✔️ Fotoclub creado y verificado:', created);
        // opcional: borrar el fotoclub si la API dispone de delete; no lo hacemos aquí para no depender de side effects.
    } catch (err) {
        console.error('❌ Error en la prueba:', err.message);
        process.exit(1);
    }
})();
