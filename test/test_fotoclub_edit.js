// test_fotoclub_edit.js
// Script de prueba para editar un fotoclub vía API REST, con login de admin

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
const API_EDIT = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/edit`;
const API_LOGIN = `${BASE_URL.replace(/\/$/, '')}/api/auth/login`;



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

async function getFotoclubs(token) {
    console.log(`\n[GET] ${API_LIST}`);
    try {
        const res = await axios.get(API_LIST, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Respuesta:', JSON.stringify(res.data));
        return res.data.items || res.data;
    } catch (error) {
        if (error.response) {
            console.log('Respuesta (error):', JSON.stringify(error.response.data));
            return error.response.data;
        } else {
            throw error;
        }
    }
}

async function editFotoclub(token, fotoclub) {
    console.log(`\n[PUT] ${API_EDIT}`);
    console.log('Enviando:', JSON.stringify(fotoclub));
    try {
        const res = await axios.put(API_EDIT, fotoclub, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        console.log('Respuesta:', JSON.stringify(res.data));
        return res.data;
    } catch (error) {
        if (error.response) {
            console.log('Respuesta (error):', JSON.stringify(error.response.data));
            return error.response.data;
        } else {
            throw error;
        }
    }
}



(async () => {
    try {
        console.log('Iniciando sesión de admin...');
        const token = await login();
        console.log('Token obtenido:', token);

        // 1. Consultar listado original
        let lista = await getFotoclubs(token);
        if (!Array.isArray(lista) || lista.length === 0) throw new Error('No hay fotoclubes para editar');
        const original = lista[0];
        console.log('Fotoclub original:', original);

        // 2. Editar el primer registro
        const editado = { ...original, name: original.name + ' [EDITADO]', description: 'Descripción de prueba', facebook: 'https://fb.com/test', instagram: 'https://ig.com/test', email: 'test@edit.com' };
        await editFotoclub(token, editado);
        console.log('Fotoclub editado. Verificando...');

        // 3. Consultar y verificar edición
        let lista2 = await getFotoclubs(token);
        const modificado = lista2.find(f => f.id === original.id);
        if (modificado && modificado.name === editado.name && modificado.description === editado.description) {
            console.log('✔️ Edición verificada:', modificado);
        } else {
            throw new Error('No se reflejó la edición');
        }

        // 4. Restaurar valores originales
        await editFotoclub(token, original);
        console.log('Fotoclub restaurado. Verificando...');

        // 5. Consultar y verificar restauración
        let lista3 = await getFotoclubs(token);
        const restaurado = lista3.find(f => f.id === original.id);
        if (restaurado && restaurado.name === original.name && restaurado.description === original.description) {
            console.log('✔️ Restauración verificada:', restaurado);
        } else {
            throw new Error('No se restauró el registro');
        }
        console.log('Prueba de edición de fotoclub completada con éxito.');
    } catch (err) {
        console.error('❌ Error en la prueba:', err.message);
        process.exit(1);
    }
})();
