/**
 * Cliente para gestión de caché desde otros procesos internos
 * Permite comunicación con el servidor interno de gestión
 */

const axios = require('axios');

class CacheClient {
    constructor(port = null) {
        this.port = port || process.env.SERVICE_PORT_INTERNAL || 3001;
        this.baseURL = `http://127.0.0.1:${this.port}`;
        
        // Configurar cliente axios
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Obtener estadísticas del caché
     */
    async getStats() {
        try {
            const response = await this.client.get('/cache/stats');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas de caché:', error.message);
            throw error;
        }
    }

    /**
     * Limpiar todo el caché
     */
    async clearAll() {
        try {
            const response = await this.client.delete('/cache/clear');
            return response.data;
        } catch (error) {
            console.error('Error limpiando caché:', error.message);
            throw error;
        }
    }

    /**
     * Invalidar caché por recurso
     */
    async invalidateResource(resource) {
        try {
            const response = await this.client.delete(`/cache/resource/${resource}`);
            return response.data;
        } catch (error) {
            console.error(`Error invalidando caché para ${resource}:`, error.message);
            throw error;
        }
    }

    /**
     * Limpieza de elementos expirados
     */
    async cleanup() {
        try {
            const response = await this.client.post('/cache/cleanup');
            return response.data;
        } catch (error) {
            console.error('Error en limpieza de caché:', error.message);
            throw error;
        }
    }

    /**
     * Verificar estado del servidor interno
     */
    async health() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            console.error('Error verificando estado:', error.message);
            throw error;
        }
    }

    /**
     * Obtener entrada específica del caché
     */
    async getEntry(key) {
        try {
            const encodedKey = encodeURIComponent(key);
            const response = await this.client.get(`/cache/key/${encodedKey}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // Entrada no encontrada
            }
            console.error('Error obteniendo entrada de caché:', error.message);
            throw error;
        }
    }

    /**
     * Métodos de conveniencia para recursos específicos
     */
    async invalidateContests() {
        return await this.invalidateResource('contests');
    }

    async invalidateCategories() {
        return await this.invalidateResource('categories');
    }

    async invalidateSections() {
        return await this.invalidateResource('sections');
    }

    async invalidateUsers() {
        return await this.invalidateResource('users');
    }

    async invalidateFotoclubs() {
        return await this.invalidateResource('fotoclubs');
    }

    async invalidateResults() {
        return await this.invalidateResource('results');
    }
}

// Instancia singleton para uso global
const cacheClient = new CacheClient();

module.exports = {
    CacheClient,
    cacheClient
};
