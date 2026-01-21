// test_fotoclub_list_enabled.js
// Script de prueba para verificar el filtro de fotoclubes habilitados/deshabilitados

const axios = require('axios');

// Configuración
const BASE_URL = process.env.NODE_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/get_all`;

async function testFotoclubListEnabled() {
    try {
        console.log('=== PRUEBA: Fotoclubes habilitados (por defecto) ===');
        console.log(`Consultando: ${API_URL}`);
        const responseDefault = await axios.get(API_URL);
        const itemsDefault = responseDefault.data.items || responseDefault.data;
        console.log(`Fotoclubes retornados (por defecto): ${itemsDefault.length}`);

        // Verificar que todos los retornados tengan enabled = true
        const allEnabled = itemsDefault.every(item => item.enabled === true);
        console.log(`Todos los fotoclubes están habilitados: ${allEnabled ? '✅' : '❌'}`);

        console.log('\n=== PRUEBA: Fotoclubes incluyendo deshabilitados ===');
        console.log(`Consultando: ${API_URL}?inc_disabled=true`);
        const responseAll = await axios.get(`${API_URL}?inc_disabled=true`);
        const itemsAll = responseAll.data.items || responseAll.data;
        console.log(`Fotoclubes retornados (con inc_disabled=true): ${itemsAll.length}`);

        // Verificar que se retornen más o igual cantidad
        const hasMoreOrEqual = itemsAll.length >= itemsDefault.length;
        console.log(`Se retornan más o igual fotoclubes: ${hasMoreOrEqual ? '✅' : '❌'}`);

        if (itemsAll.length > itemsDefault.length) {
            console.log('✅ Correcto: Se incluyen fotoclubes deshabilitados');
        } else {
            console.log('ℹ️  Nota: No hay fotoclubes deshabilitados en la base de datos');
        }

        console.log('\n=== RESULTADO ===');
        if (allEnabled && hasMoreOrEqual) {
            console.log('✅ Todas las pruebas pasaron correctamente');
        } else {
            console.log('❌ Algunas pruebas fallaron');
            process.exit(1);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Error en la respuesta de la API:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error de conexión:', error.message);
        }
        process.exit(1);
    }
}

testFotoclubListEnabled();