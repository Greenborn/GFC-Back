const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O'; // Token del administrador de ejemplo

// Configurar axios con el token de administrador
const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Configurar cliente sin token válido para pruebas de error
const invalidClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': 'Bearer token_invalido',
        'Content-Type': 'application/json'
    }
});

async function testFotoDelAnio() {
    console.log('=== PRUEBAS DEL ENDPOINT FOTO DEL AÑO ===\n');

    try {
        // 1. Registrar fotos del año para temporada 2024
        console.log('1. Registrando fotos del año para temporada 2024...');
        const registro2024 = await adminClient.post('/api/foto-del-anio', {
            temporada: 2024,
            fotos: [
                {
                    id_foto: 1001,
                    puesto: '1er Lugar',
                    orden: 1,
                    nombre_obra: 'Amanecer en los Andes',
                    nombre_autor: 'Juan Pérez',
                    url_imagen: 'https://example.com/amanecer-andes.jpg'
                },
                {
                    id_foto: 1002,
                    puesto: '2do Lugar',
                    orden: 2,
                    nombre_obra: 'Reflejos del Lago',
                    nombre_autor: 'María González',
                    url_imagen: 'https://example.com/reflejos-lago.jpg'
                },
                {
                    id_foto: 1003,
                    puesto: '3er Lugar',
                    orden: 3,
                    nombre_obra: 'Ciudad en la Noche',
                    nombre_autor: 'Carlos López',
                    url_imagen: 'https://example.com/ciudad-noche.jpg'
                }
            ]
        });
        console.log('Respuesta:', JSON.stringify(registro2024.data, null, 2));
        console.log('\n');

        // 2. Obtener fotos del año de temporada 2024
        console.log('2. Obteniendo fotos del año de temporada 2024...');
        const obtener2024 = await adminClient.get('/api/foto-del-anio/2024');
        console.log('Respuesta:', JSON.stringify(obtener2024.data, null, 2));
        console.log('\n');

        // 3. Registrar fotos del año para temporada 2025
        console.log('3. Registrando fotos del año para temporada 2025...');
        const registro2025 = await adminClient.post('/api/foto-del-anio', {
            temporada: 2025,
            fotos: [
                {
                    id_foto: 2001,
                    puesto: '1er Lugar',
                    orden: 1,
                    nombre_obra: 'Bosque Encantado',
                    nombre_autor: 'Ana Martínez',
                    url_imagen: 'https://example.com/bosque-encantado.jpg'
                },
                {
                    id_foto: 2002,
                    puesto: '2do Lugar',
                    orden: 2,
                    nombre_obra: 'Mariposa Azul',
                    nombre_autor: 'Pedro Ramírez',
                    url_imagen: 'https://example.com/mariposa-azul.jpg'
                }
            ]
        });
        console.log('Respuesta:', JSON.stringify(registro2025.data, null, 2));
        console.log('\n');

        // 4. Sobreescribir fotos del año de temporada 2024
        console.log('4. Sobreescribiendo fotos del año de temporada 2024...');
        const sobreescribir2024 = await adminClient.post('/api/foto-del-anio', {
            temporada: 2024,
            fotos: [
                {
                    id_foto: 1004,
                    puesto: '1er Lugar',
                    orden: 1,
                    nombre_obra: 'Sunset Dreams',
                    nombre_autor: 'Elena Rodriguez',
                    url_imagen: 'https://example.com/sunset-dreams.jpg'
                }
            ]
        });
        console.log('Respuesta:', JSON.stringify(sobreescribir2024.data, null, 2));
        console.log('\n');

        // 5. Obtener todas las fotos del año
        console.log('5. Obteniendo todas las fotos del año...');
        const obtenerTodas = await adminClient.get('/api/foto-del-anio');
        console.log('Respuesta:', JSON.stringify(obtenerTodas.data, null, 2));
        console.log('\n');

    } catch (error) {
        console.error('Error en las pruebas exitosas:', error.response?.data || error.message);
    }

    // 6. Pruebas de error - Token inválido
    console.log('6. Probando con token inválido (debería fallar)...');
    try {
        await invalidClient.post('/api/foto-del-anio', {
            temporada: 2025,
            fotos: []
        });
    } catch (error) {
        console.log('Error esperado:', JSON.stringify(error.response?.data, null, 2));
    }
    console.log('\n');

    // 7. Pruebas de error - Datos inválidos
    console.log('7. Probando con datos inválidos (debería fallar)...');
    try {
        await adminClient.post('/api/foto-del-anio', {
            temporada: 2025
            // Falta el campo fotos
        });
    } catch (error) {
        console.log('Error esperado:', JSON.stringify(error.response?.data, null, 2));
    }
    console.log('\n');

    // 8. Prueba de foto con campos faltantes
    console.log('8. Probando con foto sin campos requeridos (debería fallar)...');
    try {
        await adminClient.post('/api/foto-del-anio', {
            temporada: 2025,
            fotos: [
                {
                    id_foto: 3001,
                    // Faltan campos requeridos
                    puesto: '1er Lugar'
                }
            ]
        });
    } catch (error) {
        console.log('Error esperado:', JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n=== FIN DE LAS PRUEBAS ===');
}

// Ejecutar las pruebas
if (require.main === module) {
    testFotoDelAnio().catch(console.error);
}

module.exports = testFotoDelAnio;