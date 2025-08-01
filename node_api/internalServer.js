/**
 * Servidor interno para gestión de caché y operaciones internas
 * Corre en un puerto separado del API principal
 */

const express = require('express');
const { cache } = require('./middleware/cacheMiddleware');

const app_internal = express();

// Middleware básico
app_internal.use(express.json());

// Middleware de seguridad - solo localhost
app_internal.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const isLocalhost = clientIP === '127.0.0.1' || 
                       clientIP === '::1' || 
                       clientIP === '::ffff:127.0.0.1' ||
                       clientIP.includes('127.0.0.1');
    
    if (!isLocalhost && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
            error: 'Acceso denegado',
            message: 'Este endpoint solo es accesible desde localhost'
        });
    }
    
    next();
});

// Health check del servidor interno
app_internal.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'internal-management',
        timestamp: new Date().toISOString(),
        cache: {
            size: cache.cache.size,
            maxSize: cache.maxSize
        }
    });
});

// Endpoints de gestión de caché
app_internal.get('/cache/stats', (req, res) => {
    try {
        const stats = cache.getStats();
        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de caché:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al obtener estadísticas'
        });
    }
});

app_internal.delete('/cache/clear', (req, res) => {
    try {
        const sizeBefore = cache.cache.size;
        cache.clear();
        
        console.log(`Cache limpiado manualmente. Elementos eliminados: ${sizeBefore}`);
        
        res.json({
            success: true,
            message: 'Cache limpiado exitosamente',
            elementsCleared: sizeBefore,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error limpiando caché:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al limpiar caché'
        });
    }
});

app_internal.delete('/cache/resource/:resource', (req, res) => {
    try {
        const resource = req.params.resource;
        const sizeBefore = cache.cache.size;
        
        cache.invalidateByResource(resource);
        
        const sizeAfter = cache.cache.size;
        const elementsRemoved = sizeBefore - sizeAfter;
        
        console.log(`Cache invalidado para recurso: ${resource}. Elementos eliminados: ${elementsRemoved}`);
        
        res.json({
            success: true,
            message: `Cache invalidado para recurso: ${resource}`,
            resource: resource,
            elementsRemoved: elementsRemoved,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error invalidando caché por recurso:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al invalidar caché'
        });
    }
});

// Endpoint para limpiar caché expirado manualmente
app_internal.post('/cache/cleanup', (req, res) => {
    try {
        const sizeBefore = cache.cache.size;
        cache.cleanExpired();
        const sizeAfter = cache.cache.size;
        const elementsRemoved = sizeBefore - sizeAfter;
        
        console.log(`Limpieza manual de caché. Elementos expirados eliminados: ${elementsRemoved}`);
        
        res.json({
            success: true,
            message: 'Limpieza de elementos expirados completada',
            elementsRemoved: elementsRemoved,
            currentSize: sizeAfter,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en limpieza manual de caché:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno en limpieza de caché'
        });
    }
});

// Endpoint para obtener entrada específica del caché
app_internal.get('/cache/key/:key', (req, res) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const entry = cache.cache.get(key);
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entrada no encontrada en caché',
                key: key
            });
        }
        
        const isExpired = Date.now() > entry.expires;
        
        res.json({
            success: true,
            key: key,
            entry: {
                expires: new Date(entry.expires),
                lastAccess: new Date(entry.lastAccess),
                created: new Date(entry.created),
                isExpired: isExpired,
                data: entry.data
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error obteniendo entrada de caché:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno al obtener entrada'
        });
    }
});

// Manejo de errores para el servidor interno
app_internal.use((err, req, res, next) => {
    console.error('Error en servidor interno:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor de gestión',
        timestamp: new Date().toISOString()
    });
});

// Exportar la aplicación para ser usada en server.js
module.exports = app_internal;
