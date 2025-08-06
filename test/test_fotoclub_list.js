// test_fotoclub_list.js
// Script de prueba para consultar la lista de fotoclubes vía API REST

const axios = require('axios');




// Si NODE_API_BASE_URL no está definido, intenta cargar el .env localmente
let baseUrl = process.env.NODE_API_BASE_URL;
if (!baseUrl) {
    try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            for (const line of envContent.split(/\r?\n/)) {
                const match = line.match(/^NODE_API_BASE_URL=(.*)$/);
                if (match) {
                    baseUrl = match[1].trim();
                    break;
                }
            }
        }
    } catch (e) {
        // Ignorar errores de lectura
    }
}
const BASE_URL = baseUrl || 'http://localhost:3000';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/get_all`;

async function testFotoclubList() {
    try {
        console.log(`Consultando la API en: ${API_URL}`);
        const response = await axios.get(API_URL);
        console.log('Respuesta de la API de fotoclubes:');
        console.log(JSON.stringify(response.data, null, 2));
        // Permite respuesta como array directo o como objeto con propiedad 'items'
        const items = Array.isArray(response.data) ? response.data : response.data.items;
        if (Array.isArray(items)) {
            console.log(`✔️  Consulta exitosa. Se recibieron ${items.length} fotoclubes.`);
        } else {
            console.error('❌ La respuesta no es un array.');
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

testFotoclubList();
