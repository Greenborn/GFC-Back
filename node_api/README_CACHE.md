# Sistema de Caché en Memoria - GFC Node API

## Descripción
Sistema simple de caché en memoria para mejorar el rendimiento de los endpoints GET sin dependencias externas.

## Características

### ✅ **Funcionalidades Implementadas**
- **Caché automático**: Todos los endpoints GET se cachean automáticamente
- **TTL configurable**: Tiempo de vida de 5 minutos por defecto
- **Invalidación automática**: Limpieza automática cada 10 minutos
- **LRU (Least Recently Used)**: Elimina elementos menos usados cuando se alcanza el límite
- **Diferenciación por usuario**: El caché considera el ID del usuario autenticado
- **Exclusión de rutas**: Ciertas rutas como `/health` y `/logout` no se cachean

### 🔧 **Configuración**
El middleware se configura en `server.js`:
```javascript
app_admin.use(cacheMiddleware({
    ttl: 5 * 60 * 1000, // 5 minutos
    skipPaths: ['/health', '/auth/logout', '/api/auth/logout'],
    skipQuery: ['nocache', 'refresh']
}));
```

### 📝 **Cómo Funciona**

#### Para Endpoints GET:
- **Cache HIT**: Si existe en caché y no ha expirado, devuelve directamente
- **Cache MISS**: Si no existe, ejecuta la consulta y guarda el resultado
- **Cache SET**: Almacena la respuesta exitosa (status 200) en memoria

#### Para Endpoints POST/PUT/DELETE:
Se debe invalidar manualmente el caché relacionado:

```javascript
const { invalidateCache } = require('../middleware/cacheInvalidator.js');

// Después de una operación exitosa
if (result === 1) {
    invalidateCache.categories(); // Invalida caché de categorías
    return res.json({ stat: true, text: 'Actualizado correctamente' });
}
```

### 🚀 **Uso en Rutas**

#### Invalidación por recurso:
```javascript
invalidateCache.contests();    // Invalida caché de concursos
invalidateCache.categories();  // Invalida caché de categorías
invalidateCache.sections();    // Invalida caché de secciones
invalidateCache.users();       // Invalida caché de usuarios
invalidateCache.fotoclubs();   // Invalida caché de fotoclubs
invalidateCache.results();     // Invalida caché de resultados
invalidateCache.all();         // Limpia todo el caché
```

### 🔍 **Claves de Caché**
Las claves se generan con el formato:
```
GET:/api/contests:user_123
GET:/api/category/get_all:user_456
```

### ⚡ **Bypass del Caché**
Para obtener datos frescos sin caché:
```
GET /api/contests?nocache=1
GET /api/contests?refresh=1
```

### 📊 **Configuración del Cache**
- **Tamaño máximo**: 1000 entradas
- **TTL por defecto**: 5 minutos
- **Limpieza automática**: Cada 10 minutos
- **Algoritmo**: LRU (Least Recently Used)

### � **Servidor Interno de Gestión**

Se incluye un servidor interno separado para gestión de caché que corre en un puerto diferente:

#### Configuración:
```env
SERVICE_PORT_ADMIN=3000      # Puerto del API principal
SERVICE_PORT_INTERNAL=3001   # Puerto del servidor interno
```

#### Endpoints disponibles (solo localhost):

**Health Check:**
```bash
GET http://localhost:3001/health
```

**Estadísticas del caché:**
```bash
GET http://localhost:3001/cache/stats
```

**Limpiar todo el caché:**
```bash
DELETE http://localhost:3001/cache/clear
```

**Invalidar caché por recurso:**
```bash
DELETE http://localhost:3001/cache/resource/contests
DELETE http://localhost:3001/cache/resource/categories
```

**Limpieza manual de elementos expirados:**
```bash
POST http://localhost:3001/cache/cleanup
```

**Obtener entrada específica:**
```bash
GET http://localhost:3001/cache/key/GET%3A%2Fapi%2Fcontests%3Auser_123
```

#### Seguridad:
- Solo accesible desde `localhost` (127.0.0.1)
- En producción bloquea accesos externos automáticamente
- Logs de todas las operaciones de gestión

### �🛠 **Monitoreo Interno**
El sistema genera logs automáticamente:
```
Cache HIT: GET:/api/contests:user_123
Cache MISS: GET:/api/contests:user_123
Cache SET: GET:/api/contests:user_123
Cache cleanup: 45 elementos activos
Cache invalidado para recurso: categories
```

### 📋 **Ejemplo Completo**

```javascript
// En routes/example.js
const { invalidateCache } = require('../middleware/cacheInvalidator.js');

// GET (se cachea automáticamente)
router.get('/list', authMiddleware, async (req, res) => {
    const data = await global.knex('table').select('*');
    res.json({ items: data }); // Se guarda automáticamente en caché
});

// PUT (invalida caché relacionado)
router.put('/edit', authMiddleware, async (req, res) => {
    const result = await global.knex('table').where('id', id).update(data);
    
    if (result === 1) {
        invalidateCache.categories(); // Invalida caché relacionado
        res.json({ stat: true, text: 'Actualizado' });
    }
});
```

### 🔨 **Uso desde Scripts Externos**

```javascript
// Usando el cliente de caché
const { cacheClient } = require('./utils/cacheClient');

// Limpiar caché programáticamente
await cacheClient.clearAll();

// Invalidar recurso específico
await cacheClient.invalidateContests();

// Obtener estadísticas
const stats = await cacheClient.getStats();
```

### 🏃 **Ejecutar Ejemplos**

```bash
# Ejemplo de uso del cliente
node examples/cacheExample.js

# Script de gestión desde terminal
./scripts/cache_management.sh stats
./scripts/cache_management.sh clear
```

### ⚠️ **Consideraciones**
- El caché es **por instancia** del servidor (no compartido entre procesos)
- Se pierde al reiniciar el servidor
- Ideal para datos que no cambian frecuentemente
- Para datos que cambian mucho, considerar reducir el TTL
