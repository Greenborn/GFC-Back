/**
 * Helper para invalidación automática de caché
 * Se usa en endpoints POST, PUT, DELETE para limpiar caché relacionado
 */

const { cache } = require('./cacheMiddleware');

/**
 * Middleware para invalidar caché automáticamente en operaciones de escritura
 */
const cacheInvalidator = (resources = []) => {
    return (req, res, next) => {
        // Interceptar la respuesta exitosa
        const originalJson = res.json;
        res.json = function(data) {
            // Solo invalidar si la operación fue exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Invalidar recursos específicos
                resources.forEach(resource => {
                    cache.invalidateByResource(resource);
                });

                // Invalidar también basado en la ruta actual
                const routeSegments = req.path.split('/').filter(Boolean);
                if (routeSegments.length > 0) {
                    const mainResource = routeSegments[routeSegments.length - 1];
                    cache.invalidateByResource(mainResource);
                }
            }
            
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Funciones específicas para invalidar caché por tipo de recurso
 */
const invalidateCache = {
    contests: () => {
        cache.invalidateByResource('contests');
        cache.invalidateByResource('contest');
    },
    
    categories: () => {
        cache.invalidateByResource('category');
        cache.invalidateByResource('categories');
    },
    
    sections: () => {
        cache.invalidateByResource('section');
        cache.invalidateByResource('sections');
    },
    
    users: () => {
        cache.invalidateByResource('users');
        cache.invalidateByResource('user');
    },
    
    fotoclubs: () => {
        cache.invalidateByResource('fotoclub');
        cache.invalidateByResource('fotoclubs');
    },
    
    results: () => {
        cache.invalidateByResource('results');
        cache.invalidateByResource('result');
    },
    
    all: () => {
        cache.clear();
    }
};

module.exports = {
    cacheInvalidator,
    invalidateCache
};
