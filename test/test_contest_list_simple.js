// test/test_contest_list_simple.js
require('dotenv').config();
const axios = require('axios');

// Configuración
const NODE_API_BASE_URL = process.env.NODE_API_BASE_URL || 'http://localhost:7779';
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

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

// Función para probar el endpoint con autenticación
async function testContestListSimple() {
    try {
        // Primero hacer login para obtener token
        const token = await loginNodeApi();
        
        const url = `${NODE_API_BASE_URL}/contest?expand=categories,sections&sort=-id&page=1&per-page=5`;
        console.log(`\n[TEST SIMPLE] ${url}`);
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Test Script)'
        };
        
        const res = await axios.get(url, { headers });
        
        if (res.status === 200 && res.data) {
            console.log('✅ Endpoint de concursos accesible');
            console.log(`📊 Status: ${res.status}`);
            
            if (res.data.items) {
                console.log(`📊 Total de concursos en página: ${res.data.items.length}`);
                
                if (res.data._meta) {
                    console.log(`📄 Total de concursos: ${res.data._meta.totalCount}`);
                    console.log(`📄 Páginas: ${res.data._meta.pageCount}`);
                    console.log(`📄 Página actual: ${res.data._meta.currentPage}`);
                    console.log(`📄 Por página: ${res.data._meta.perPage}`);
                }
                
                if (res.data._links) {
                    console.log(`🔗 Enlaces de navegación:`, Object.keys(res.data._links));
                }
                
                // Mostrar información del primer concurso
                if (res.data.items.length > 0) {
                    const firstContest = res.data.items[0];
                    console.log(`\n📝 Primer concurso:`);
                    console.log(`   ID: ${firstContest.id}`);
                    console.log(`   Nombre: "${firstContest.name}"`);
                    console.log(`   Descripción: "${firstContest.description?.substring(0, 100)}..."`);
                    console.log(`   Fecha inicio: ${firstContest.start_date}`);
                    console.log(`   Fecha fin: ${firstContest.end_date}`);
                    console.log(`   Activo: ${firstContest.active}`);
                    console.log(`   Tipo organización: ${firstContest.organization_type}`);
                    console.log(`   Juzgado: ${firstContest.judged}`);
                    
                    if (firstContest.categories) {
                        console.log(`   🗂️ Categorías (${firstContest.categories.length}):`);
                        firstContest.categories.forEach(cat => {
                            console.log(`      - ${cat.name} (ID: ${cat.id}, Ranking: ${cat.mostrar_en_ranking})`);
                        });
                    }
                    
                    if (firstContest.sections) {
                        console.log(`   📋 Secciones (${firstContest.sections.length}):`);
                        firstContest.sections.forEach(sec => {
                            console.log(`      - ${sec.name} (ID: ${sec.id})`);
                        });
                    }
                }
                
                return { success: true, data: res.data };
            } else {
                throw new Error('Respuesta no contiene array de items');
            }
        } else {
            throw new Error(`Status HTTP inesperado: ${res.status}`);
        }
    } catch (error) {
        console.error('❌ Error en test simple:', error.message);
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Headers:', error.response.headers);
            console.error('📋 Data:', error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Función para probar diferentes parámetros de consulta
async function testQueryParameters() {
    console.log('\n🧪 PROBANDO DIFERENTES PARÁMETROS...');
    
    // Obtener token para autenticación
    const token = await loginNodeApi();
    
    const tests = [
        {
            name: 'Sin parámetros',
            params: ''
        },
        {
            name: 'Solo ordenamiento',
            params: '?sort=-id'
        },
        {
            name: 'Solo expansión de categorías',
            params: '?expand=categories'
        },
        {
            name: 'Solo expansión de secciones',
            params: '?expand=sections'
        },
        {
            name: 'Expansión completa',
            params: '?expand=categories,sections'
        },
        {
            name: 'Con paginación',
            params: '?page=1&per-page=3'
        },
        {
            name: 'Completo',
            params: '?expand=categories,sections&sort=-id&page=1&per-page=2'
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n🔍 Test: ${test.name}`);
            const url = `${NODE_API_BASE_URL}/contest${test.params}`;
            const res = await axios.get(url, { 
                headers: { 
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 5000 
            });
            
            if (res.status === 200 && res.data && res.data.items) {
                console.log(`   ✅ Exitoso - ${res.data.items.length} items`);
                if (res.data._meta) {
                    console.log(`   📄 Total: ${res.data._meta.totalCount}, Página: ${res.data._meta.currentPage}/${res.data._meta.pageCount}`);
                }
            } else {
                console.log(`   ❌ Respuesta inválida`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
}

// Función para probar que la autenticación es requerida
async function testAuthenticationRequired() {
    console.log('\n🔒 PROBANDO QUE LA AUTENTICACIÓN ES REQUERIDA...');
    
    try {
        const url = `${NODE_API_BASE_URL}/contest`;
        console.log(`[TEST AUTH] ${url}`);
        
        // Intentar acceso sin token
        const res = await axios.get(url, { 
            headers: { 'Accept': 'application/json' },
            timeout: 5000,
            validateStatus: () => true // Aceptar cualquier status code
        });
        
        if (res.status === 401) {
            console.log('✅ Autenticación requerida correctamente (401 Unauthorized)');
            console.log(`📋 Mensaje: ${res.data.message || 'No message'}`);
            return { success: true, authenticated: false };
        } else {
            console.log(`❌ Se esperaba 401, pero se recibió ${res.status}`);
            return { success: false, error: `Status incorrecto: ${res.status}` };
        }
    } catch (error) {
        console.log(`❌ Error inesperado: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Función para probar acceso con token inválido
async function testInvalidToken() {
    console.log('\n🚫 PROBANDO TOKEN INVÁLIDO...');
    
    try {
        const url = `${NODE_API_BASE_URL}/contest`;
        console.log(`[TEST INVALID TOKEN] ${url}`);
        
        const res = await axios.get(url, { 
            headers: { 
                'Accept': 'application/json',
                'Authorization': 'Bearer token_invalido_123'
            },
            timeout: 5000,
            validateStatus: () => true // Aceptar cualquier status code
        });
        
        if (res.status === 401) {
            console.log('✅ Token inválido rechazado correctamente (401 Unauthorized)');
            console.log(`📋 Mensaje: ${res.data.message || 'No message'}`);
            return { success: true, tokenInvalid: true };
        } else {
            console.log(`❌ Se esperaba 401, pero se recibió ${res.status}`);
            return { success: false, error: `Status incorrecto: ${res.status}` };
        }
    } catch (error) {
        console.log(`❌ Error inesperado: ${error.message}`);
        return { success: false, error: error.message };
    }

// Función principal
async function runSimpleTests() {
    console.log('🚀 TESTS SIMPLES DE LISTADO DE CONCURSOS - NODE.JS API');
    console.log('=======================================================');
    console.log(`🔗 Node.js API: ${NODE_API_BASE_URL}`);
    
    const startTime = Date.now();
    
    try {
        // Test de autenticación requerida
        console.log('\n🧪 PROBANDO SEGURIDAD DE AUTENTICACIÓN...');
        const authTest = await testAuthenticationRequired();
        const invalidTokenTest = await testInvalidToken();
        
        // Test básico con autenticación válida
        console.log('\n🧪 PROBANDO FUNCIONALIDAD BÁSICA CON AUTENTICACIÓN...');
        const result = await testContestListSimple();
        
        if (result.success) {
            // Probar diferentes parámetros
            await testQueryParameters();
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n⏱️ Tiempo total de ejecución: ${duration}ms`);
        
        // Resumen de resultados
        const allTestsPassed = authTest.success && invalidTokenTest.success && result.success;
        
        if (allTestsPassed) {
            console.log('✅ TODOS LOS TESTS SIMPLES EXITOSOS');
            console.log('🔒 Autenticación funcionando correctamente');
            console.log('📊 Endpoint de listado funcionando correctamente');
            process.exit(0);
        } else {
            console.log('❌ ALGUNOS TESTS FALLARON');
            if (!authTest.success) console.log('   - Fallo en test de autenticación requerida');
            if (!invalidTokenTest.success) console.log('   - Fallo en test de token inválido');
            if (!result.success) console.log('   - Fallo en test de funcionalidad básica');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Error crítico en los tests:', error.message);
        process.exit(1);
    }
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
    runSimpleTests();
}

module.exports = {
    runSimpleTests,
    testContestListSimple,
    testQueryParameters,
    testAuthenticationRequired,
    testInvalidToken,
    loginNodeApi
};
