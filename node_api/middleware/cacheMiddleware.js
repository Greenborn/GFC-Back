/**
 * Middleware de caché en memoria para endpoints GET
 * Sistema simple sin dependencias externas
 */

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
        this.maxSize = 1000; // Máximo 1000 entradas en caché
        
        // Limpieza automática cada 10 minutos
        setInterval(() => {
            this.cleanExpired();
        }, 10 * 60 * 1000);
    }

    /**
     * Genera una clave única para el caché basada en la URL y query params
     */
    generateKey(req) {
        const url = req.originalUrl || req.url;
        const userId = req.user ? req.user.id : 'anonymous';
        return `${req.method}:${url}:user_${userId}`;
    }

    /**
     * Obtiene un elemento del caché
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Verificar si ha expirado
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        // Actualizar último acceso
        item.lastAccess = Date.now();
        return item.data;
    }

    /**
     * Guarda un elemento en el caché
     */
    set(key, data, ttl = null) {
        // Si el caché está lleno, eliminar el elemento menos usado recientemente
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const expirationTime = ttl || this.defaultTTL;
        this.cache.set(key, {
            data: data,
            expires: Date.now() + expirationTime,
            lastAccess: Date.now(),
            created: Date.now()
        });
    }

    /**
     * Elimina elementos específicos del caché
     */
    delete(pattern) {
        if (typeof pattern === 'string') {
            this.cache.delete(pattern);
        } else if (pattern instanceof RegExp) {
            // Eliminar por patrón regex
            for (const key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Limpia elementos expirados
     */
    cleanExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
        console.log(`Cache cleanup: ${this.cache.size} elementos activos`);
    }

    /**
     * Elimina el elemento menos usado recientemente (LRU)
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccess < oldestTime) {
                oldestTime = item.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Invalida caché por tabla/recurso
     */
    invalidateByResource(resource) {
        const pattern = new RegExp(`GET:.*/${resource}.*`);
        this.delete(pattern);
        console.log(`Cache invalidado para recurso: ${resource}`);
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            entries: Array.from(this.cache.entries()).map(([key, item]) => ({
                key,
                expires: new Date(item.expires),
                lastAccess: new Date(item.lastAccess),
                created: new Date(item.created)
            }))
        };
    }

    /**
     * Limpia todo el caché
     */
    clear() {
        this.cache.clear();
        console.log('Cache completamente limpiado');
    }
}

// Instancia global del caché
const cache = new SimpleCache();

/**
 * Middleware de caché para endpoints GET
 */
const cacheMiddleware = (options = {}) => {
    const {
        ttl = 5 * 60 * 1000, // 5 minutos por defecto
        skipCache = false,
        skipPaths = ['/health', '/auth/logout'], // Rutas que no se cachean
        skipQuery = ['nocache'] // Query params que invalidan caché
    } = options;

    return (req, res, next) => {
        // Solo cachear métodos GET
        if (req.method !== 'GET') {
            return next();
        }

        // Verificar si la ruta debe ser omitida
        if (skipPaths.some(path => req.path.includes(path))) {
            return next();
        }

        // Verificar query params que invalidan caché
        if (skipQuery.some(param => req.query[param] !== undefined)) {
            return next();
        }

        // Verificar si el caché está deshabilitado
        if (skipCache) {
            return next();
        }

        const cacheKey = cache.generateKey(req);
        
        // Intentar obtener del caché
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            console.log(`Cache HIT: ${cacheKey}`);
            return res.json(cachedData);
        }

        // Interceptar la respuesta para guardarla en caché
        const originalJson = res.json;
        res.json = function(data) {
            // Solo cachear respuestas exitosas
            if (res.statusCode === 200 && data) {
                cache.set(cacheKey, data, ttl);
                console.log(`Cache SET: ${cacheKey}`);
            }
            
            // Llamar al método original
            return originalJson.call(this, data);
        };

        console.log(`Cache MISS: ${cacheKey}`);
        next();
    };
};

// Exportar el middleware y la instancia del caché
module.exports = {
    cacheMiddleware,
    cache
};
