/**
 * Test para el nuevo endpoint de registro de fotos del año
 * Prueba la estructura jerárquica de directorios
 */

const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3002';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Token de administrador

// Cliente HTTP con autenticación
const adminClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Estructura de datos de ejemplo para el nuevo formato
 * Basada en la especificación del usuario
 */
const ejemploEstructuraFotos2025 = {
    raiz: "Fotos del año 2025",
    directorios: {
        eleccion_jurado: {
            archivos: ["2416_2025_52_Color_12030.jpg"],
            subdirectorios: {}
        },
        eleccion_publico: {
            archivos: ["2338_2025_51_Monocromo_11188.jpg"],
            subdirectorios: {}
        },
        estimulo: {
            archivos: [],
            subdirectorios: {
                sub_seccion: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["8680_2025_51_Sub Sección_11111.jpg"],
                            subdirectorios: {}
                        }
                    }
                },
                color: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["8020_2025_51_Color_11525.jpg"],
                            subdirectorios: {}
                        }
                    }
                },
                monocromo: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["2338_2025_51_Monocromo_11188.jpg"],
                            subdirectorios: {}
                        }
                    }
                }
            }
        },
        primera: {
            archivos: [],
            subdirectorios: {
                sub_seccion: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["2647_2025_54_Sub Sección_12353.jpg"],
                            subdirectorios: {}
                        }
                    }
                },
                color: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["2416_2025_52_Color_12030.jpg"],
                            subdirectorios: {}
                        }
                    }
                },
                monocromo: {
                    archivos: [],
                    subdirectorios: {
                        eleccion_jurado: {
                            archivos: ["3216_2025_52_Monocromo_12051.jpg"],
                            subdirectorios: {}
                        }
                    }
                }
            }
        }
    },
    archivos: []
};

async function testRegistroFotosDelAnio() {
    console.log('\n=== TEST: Registro de Fotos del Año (Nueva Estructura) ===\n');

    try {
        console.log('1. Enviando estructura jerárquica con fotografías del año 2025...');
        const response = await adminClient.post('/api/foto-del-anio', ejemploEstructuraFotos2025);
        
        console.log('✓ Respuesta:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`✓ Se registraron ${response.data.data.cantidad_fotos} fotos para la temporada ${response.data.data.temporada}`);
        }

        // Obtener las fotos registradas
        console.log('\n2. Obteniendo fotos del año registradas...');
        const obtenerResponse = await adminClient.get(`/api/foto-del-anio/${response.data.data.temporada}`);
        console.log('✓ Fotos obtenidas:', obtenerResponse.data.total);
        console.log('Detalles:', JSON.stringify(obtenerResponse.data.data, null, 2));

        console.log('\n✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE\n');
        
    } catch (error) {
        console.error('\n✗ ERROR EN LA PRUEBA:', error.response?.data || error.message);
        console.error('\nDetalles del error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

async function testValidaciones() {
    console.log('\n=== TEST: Validaciones del Endpoint ===\n');

    try {
        // Test 1: Estructura incompleta (falta una fotografía)
        console.log('1. Probando con estructura incompleta (sin elección público)...');
        const estructuraIncompleta = {
            raiz: "Fotos del año 2025",
            directorios: {
                eleccion_jurado: {
                    archivos: ["2416_2025_52_Color_12030.jpg"],
                    subdirectorios: {}
                },
                // Falta eleccion_publico
                estimulo: {
                    archivos: [],
                    subdirectorios: {
                        sub_seccion: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["8680_2025_51_Sub Sección_11111.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        },
                        color: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["8020_2025_51_Color_11525.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        },
                        monocromo: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["2338_2025_51_Monocromo_11188.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        }
                    }
                },
                primera: {
                    archivos: [],
                    subdirectorios: {
                        sub_seccion: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["2647_2025_54_Sub Sección_12353.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        },
                        color: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["2416_2025_52_Color_12030.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        },
                        monocromo: {
                            archivos: [],
                            subdirectorios: {
                                eleccion_jurado: {
                                    archivos: ["3216_2025_52_Monocromo_12051.jpg"],
                                    subdirectorios: {}
                                }
                            }
                        }
                    }
                }
            }
        };

        try {
            await adminClient.post('/api/foto-del-anio', estructuraIncompleta);
            console.log('✗ Error: Debería haber rechazado la estructura incompleta');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✓ Correctamente rechazada estructura incompleta');
                console.log('  Mensaje:', error.response.data.message);
            } else {
                throw error;
            }
        }

        // Test 2: Sin datos requeridos
        console.log('\n2. Probando sin campos requeridos...');
        try {
            await adminClient.post('/api/foto-del-anio', {});
            console.log('✗ Error: Debería haber rechazado la petición sin datos');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✓ Correctamente rechazada petición sin datos');
                console.log('  Mensaje:', error.response.data.message);
            } else {
                throw error;
            }
        }

        console.log('\n✓ VALIDACIONES FUNCIONANDO CORRECTAMENTE\n');

    } catch (error) {
        console.error('\n✗ ERROR EN VALIDACIONES:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Ejecutar tests
async function ejecutarTests() {
    if (!ADMIN_TOKEN) {
        console.error('ERROR: Se requiere un token de administrador');
        console.error('Uso: ADMIN_TOKEN=tu_token_aqui node test_foto_del_anio_nuevo.js');
        process.exit(1);
    }

    console.log('Configuración:');
    console.log('- API URL:', API_URL);
    console.log('- Token configurado: ✓');

    await testValidaciones();
    await testRegistroFotosDelAnio();
}

ejecutarTests();
