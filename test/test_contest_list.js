// test/test_contest_list.js
require('dotenv').config();
const axios = require('axios');

// Configuración
const PHP_API_BASE_URL = process.env.API_BASE_URL || 'https://gfc.prod-api.greenborn.com.ar';
const NODE_API_BASE_URL = process.env.NODE_API_BASE_URL || 'http://localhost:7779';
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

// Función para obtener token de autorización de la API PHP
async function loginPhpApi() {
    try {
        const url = `${PHP_API_BASE_URL}/login`;
        console.log(`[LOGIN PHP] ${url}`);
        const res = await axios.post(url, {
            username: USERNAME,
            password: PASSWORD
        });
        
        if (res.data && res.data.status === true && res.data.token) {
            console.log('✅ Login exitoso en API PHP');
            return res.data.token;
        } else {
            throw new Error('Login fallido: ' + (res.data.message || JSON.stringify(res.data)));
        }
    } catch (error) {
        console.error('❌ Error en login PHP API:', error.message);
        throw error;
    }
}

// Función para obtener token de autorización de la API Node.js
async function loginNodeApi() {
    try {
        const url = `${NODE_API_BASE_URL}/api/auth/login`;
        console.log(`[LOGIN NODE] ${url}`);
        const res = await axios.post(url, {
            username: USERNAME,
            password: PASSWORD
        });
        
        if (res.data && res.data.success === true && res.data.token) {
            console.log('✅ Login exitoso en API Node.js');
            return res.data.token;
        } else {
            throw new Error('Login fallido: ' + (res.data.message || JSON.stringify(res.data)));
        }
    } catch (error) {
        console.error('❌ Error en login Node.js API:', error.message);
        throw error;
    }
}

// Función para probar listado de concursos en API PHP
async function testPhpContestList(token) {
    try {
        const url = `${PHP_API_BASE_URL}/contest?expand=categories,sections&sort=-id`;
        console.log(`\n[TEST PHP] ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        const res = await axios.get(url, { headers });
        
        if (res.status === 200 && res.data && res.data.items) {
            console.log('✅ API PHP - Listado de concursos exitoso');
            console.log(`📊 Total de concursos: ${res.data.items.length}`);
            console.log(`📄 Metadatos de paginación:`, res.data._meta);
            
            // Verificar estructura del primer concurso
            if (res.data.items.length > 0) {
                const firstContest = res.data.items[0];
                console.log(`📝 Primer concurso: "${firstContest.name}"`);
                console.log(`🗂️ Categorías: ${firstContest.categories ? firstContest.categories.length : 'No expandidas'}`);
                console.log(`📋 Secciones: ${firstContest.sections ? firstContest.sections.length : 'No expandidas'}`);
                console.log(`🟢 Activo: ${firstContest.active}`);
            }
            
            return {
                success: true,
                totalItems: res.data.items.length,
                data: res.data
            };
        } else {
            throw new Error('Respuesta inválida de la API PHP');
        }
    } catch (error) {
        console.error('❌ Error en test PHP API:', error.message);
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Función para probar listado de concursos en API Node.js
async function testNodeContestList(token) {
    try {
        const url = `${NODE_API_BASE_URL}/contest?expand=categories,sections&sort=-id`;
        console.log(`\n[TEST NODE] ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        
        const res = await axios.get(url, { headers });
        
        if (res.status === 200 && res.data && res.data.items) {
            console.log('✅ API Node.js - Listado de concursos exitoso');
            console.log(`📊 Total de concursos: ${res.data.items.length}`);
            console.log(`📄 Metadatos de paginación:`, res.data._meta);
            
            // Verificar estructura del primer concurso
            if (res.data.items.length > 0) {
                const firstContest = res.data.items[0];
                console.log(`📝 Primer concurso: "${firstContest.name}"`);
                console.log(`🗂️ Categorías: ${firstContest.categories ? firstContest.categories.length : 'No expandidas'}`);
                console.log(`📋 Secciones: ${firstContest.sections ? firstContest.sections.length : 'No expandidas'}`);
                console.log(`🟢 Activo: ${firstContest.active}`);
            }
            
            return {
                success: true,
                totalItems: res.data.items.length,
                data: res.data
            };
        } else {
            throw new Error('Respuesta inválida de la API Node.js');
        }
    } catch (error) {
        console.error('❌ Error en test Node.js API:', error.message);
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Función para comparar respuestas entre APIs
function compareResponses(phpResult, nodeResult) {
    console.log('\n🔍 COMPARACIÓN DE RESULTADOS:');
    console.log('=====================================');
    
    if (phpResult.success && nodeResult.success) {
        console.log(`📊 Concursos PHP API: ${phpResult.totalItems}`);
        console.log(`📊 Concursos Node.js API: ${nodeResult.totalItems}`);
        
        if (phpResult.totalItems === nodeResult.totalItems) {
            console.log('✅ Mismo número de concursos en ambas APIs');
        } else {
            console.log('⚠️ Diferente número de concursos entre APIs');
        }
        
        // Comparar estructura de metadatos
        const phpMeta = phpResult.data._meta;
        const nodeMeta = nodeResult.data._meta;
        
        if (phpMeta && nodeMeta) {
            console.log('\n📄 Comparación de metadatos de paginación:');
            console.log(`Total Count - PHP: ${phpMeta.totalCount}, Node: ${nodeMeta.totalCount}`);
            console.log(`Page Count - PHP: ${phpMeta.pageCount}, Node: ${nodeMeta.pageCount}`);
            console.log(`Current Page - PHP: ${phpMeta.currentPage}, Node: ${nodeMeta.currentPage}`);
            console.log(`Per Page - PHP: ${phpMeta.perPage}, Node: ${nodeMeta.perPage}`);
        }
        
        // Comparar primer concurso si existe
        if (phpResult.data.items.length > 0 && nodeResult.data.items.length > 0) {
            const phpFirst = phpResult.data.items[0];
            const nodeFirst = nodeResult.data.items[0];
            
            console.log('\n📝 Comparación del primer concurso:');
            console.log(`ID - PHP: ${phpFirst.id}, Node: ${nodeFirst.id}`);
            console.log(`Nombre - PHP: "${phpFirst.name}", Node: "${nodeFirst.name}"`);
            console.log(`Activo - PHP: ${phpFirst.active}, Node: ${nodeFirst.active}`);
        }
    } else {
        if (!phpResult.success) {
            console.log('❌ Falló la prueba con PHP API');
        }
        if (!nodeResult.success) {
            console.log('❌ Falló la prueba con Node.js API');
        }
    }
}

// Función principal
async function runTests() {
    console.log('🚀 INICIANDO TESTS DE LISTADO DE CONCURSOS');
    console.log('===========================================');
    console.log(`🔗 PHP API: ${PHP_API_BASE_URL}`);
    console.log(`🔗 Node.js API: ${NODE_API_BASE_URL}`);
    
    const startTime = Date.now();
    
    try {
        // Test PHP API
        console.log('\n🧪 PROBANDO PHP API...');
        const phpToken = await loginPhpApi();
        const phpResult = await testPhpContestList(phpToken);
        
        // Test Node.js API
        console.log('\n🧪 PROBANDO NODE.JS API...');
        const nodeToken = await loginNodeApi();
        const nodeResult = await testNodeContestList(nodeToken);
        
        // Comparar resultados
        compareResponses(phpResult, nodeResult);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n⏱️ Tiempo total de ejecución: ${duration}ms`);
        console.log('✅ TESTS COMPLETADOS');
        
        // Resumen final
        const phpSuccess = phpResult.success;
        const nodeSuccess = nodeResult.success;
        
        if (phpSuccess && nodeSuccess) {
            console.log('🎉 TODAS LAS PRUEBAS EXITOSAS');
            process.exit(0);
        } else {
            console.log('❌ ALGUNAS PRUEBAS FALLARON');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Error crítico en los tests:', error.message);
        process.exit(1);
    }
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
    runTests();
}

module.exports = {
    runTests,
    testPhpContestList,
    testNodeContestList
};
