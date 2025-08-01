/**
 * Ejemplo de uso del cliente de caché
 * Muestra cómo usar el cliente desde otros procesos o scripts
 */

const { cacheClient } = require('./utils/cacheClient');

async function ejemploDeUso() {
    try {
        console.log('🔧 Ejemplo de gestión de caché');
        console.log('================================');

        // Verificar estado del servidor
        console.log('\n1. Verificando estado del servidor interno...');
        const health = await cacheClient.health();
        console.log('Estado:', health.status);
        console.log('Tamaño actual del caché:', health.cache.size);

        // Obtener estadísticas
        console.log('\n2. Obteniendo estadísticas...');
        const stats = await cacheClient.getStats();
        console.log('Estadísticas completas:', JSON.stringify(stats, null, 2));

        // Invalidar un recurso específico
        console.log('\n3. Invalidando caché de concursos...');
        const invalidateResult = await cacheClient.invalidateContests();
        console.log('Resultado:', invalidateResult.message);
        console.log('Elementos eliminados:', invalidateResult.elementsRemoved);

        // Limpiar elementos expirados
        console.log('\n4. Limpiando elementos expirados...');
        const cleanupResult = await cacheClient.cleanup();
        console.log('Resultado:', cleanupResult.message);
        console.log('Elementos expirados eliminados:', cleanupResult.elementsRemoved);

        // Obtener estadísticas actualizadas
        console.log('\n5. Estadísticas después de limpieza...');
        const statsAfter = await cacheClient.getStats();
        console.log('Tamaño actual:', statsAfter.stats.size);

        console.log('\n✅ Ejemplo completado exitosamente');

    } catch (error) {
        console.error('❌ Error en el ejemplo:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Asegúrate de que el servidor Node.js esté ejecutándose');
            console.log('   El servidor interno debe estar corriendo en el puerto configurado');
        }
    }
}

// Ejecutar ejemplo si el archivo se ejecuta directamente
if (require.main === module) {
    ejemploDeUso();
}

module.exports = { ejemploDeUso };
