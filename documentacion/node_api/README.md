# Node.js API - Documentación

## Descripción General

La API Node.js es el componente complementario del sistema GFC-Back, desarrollada con Express.js. Esta API maneja operaciones específicas como WebSockets para comunicación en tiempo real, procesamiento de archivos, y operaciones auxiliares que complementan la API principal de PHP.

## Propósito

Esta API proporciona:
- **Comunicación en tiempo real** via WebSockets
- **Procesamiento de archivos** y generación de miniaturas
- **Operaciones de logging** y auditoría
- **Sistema de notificaciones** en tiempo real
- **Métricas y estadísticas** en tiempo real
- **Operaciones auxiliares** que complementan la API PHP

## Estructura del Subproyecto

```
node_api/
├── controllers/             # Controladores de la API
│   ├── log_operaciones.js   # Controlador de logs
│   └── mailer.js           # Controlador de emails
├── migrations/              # Migraciones de base de datos
├── routes/                  # Rutas de la API
│   ├── auth.js             # Rutas de autenticación
│   ├── category.js         # Rutas de categorías
│   ├── contest.js          # Rutas de concursos
│   ├── fotoclub.js         # Rutas de clubes fotográficos
│   ├── log.js              # Rutas de logs
│   ├── metrics.js          # Rutas de métricas
│   ├── section.js          # Rutas de secciones
│   └── user.js             # Rutas de usuarios
├── gfc_web_sockets.js       # Servidor WebSocket
├── knexfile.js             # Configuración de Knex.js
├── package.json            # Dependencias del proyecto
├── server.js               # Punto de entrada principal
└── nodemon.json            # Configuración de desarrollo
```

## Tecnologías y Dependencias

### Framework Principal
- **Express.js**: Framework web para Node.js
- **Node.js 14+**: Runtime de JavaScript

### Base de Datos
- **PostgreSQL**: Base de datos principal
- **Knex.js**: Query builder y migraciones

### Comunicación en Tiempo Real
- **Socket.io**: WebSockets para comunicación bidireccional
- **WebSocket**: Protocolo de comunicación

### Procesamiento de Archivos
- **Sharp**: Procesamiento de imágenes
- **Multer**: Middleware para subida de archivos
- **fs-extra**: Utilidades de sistema de archivos

### Utilidades
- **Joi**: Validación de esquemas
- **bcrypt**: Encriptación de contraseñas
- **jsonwebtoken**: Manejo de JWT
- **nodemailer**: Envío de emails
- **winston**: Logging

## Documentación Técnica

- **[Arquitectura](arquitectura.md)**: Diseño arquitectónico detallado
- **[Definición Técnica](definicion_tecnica.md)**: Especificación técnica exhaustiva
- **[Endpoints](endpoints.md)**: Documentación completa de todos los endpoints

## Configuración e Instalación

### Requisitos del Sistema
- Node.js 14 o superior
- PostgreSQL 12+
- npm o yarn
- Extensiones de sistema para procesamiento de imágenes

### Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con configuraciones específicas
   ```

3. **Configurar base de datos**
   ```bash
   # Configurar knexfile.js con credenciales de BD
   npm run migrate
   ```

4. **Iniciar en desarrollo**
   ```bash
   npm run dev
   ```

## Estructura de Datos

### Entidades Principales
- **User**: Usuarios del sistema (sincronizado con PHP API)
- **Contest**: Concursos fotográficos
- **Category**: Categorías de concursos
- **Section**: Secciones dentro de categorías
- **ContestResult**: Resultados de concursos
- **Fotoclub**: Clubes fotográficos
- **LogOperaciones**: Logs de operaciones del sistema
- **Image**: Imágenes/fotografías con información de autor y sección

### Relaciones Clave
- Sincronización bidireccional con la API PHP
- Logs asociados a todas las operaciones
- WebSockets para notificaciones en tiempo real

## Convenciones de Código

### Nomenclatura
- **Archivos**: camelCase (ej: `logOperaciones.js`)
- **Funciones**: camelCase (ej: `getContestResults`)
- **Variables**: camelCase (ej: `contestId`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `MAX_FILE_SIZE`)

### Estructura de Archivos
- **Controladores**: `controllers/ControllerName.js`
- **Rutas**: `routes/routeName.js`
- **Migraciones**: `migrations/YYYYMMDD_HHMMSS_description.js`
- **Utilidades**: Funciones auxiliares en archivos separados

### Documentación
- Usar JSDoc para todos los métodos públicos
- Documentar parámetros y valores de retorno
- Incluir ejemplos de uso cuando sea necesario

## Endpoints Públicos

### Endpoints Públicos

#### Consulta de Imágenes
La API incluye endpoints públicos para consultar imágenes sin necesidad de autenticación:

- **GET** `/api/images/search?q=termino` - Buscar imágenes por código o título
- **GET** `/api/images/all` - Obtener todas las imágenes disponibles

##### Características
- **Límite**: Máximo 10 resultados por consulta
- **Información completa**: Incluye autor, sección y URL completa
- **Búsqueda flexible**: Coincidencia total o parcial
- **Sin autenticación**: Acceso público para consultas

##### Ejemplo de uso
```bash
curl -X GET "https://gfc.prod-api.greenborn.com.ar/api/images/search?q=3336_2025_38_Color_10047"
```

#### Consulta de Participantes
La API incluye un endpoint público para consultar participantes de concursos:

- **GET** `/contest/participants?id=<contest_id>` - Obtener listado básico de participantes de un concurso

##### Características
- **Información esencial**: Solo nombre, apellido, DNI y categoría
- **Ordenamiento**: Por apellido y nombre
- **Sin autenticación**: Acceso público para consultas
- **Validación**: Verifica que el concurso existe

##### Ejemplo de uso
```bash
curl -X GET "https://gfc.prod-api.greenborn.com.ar/contest/participants?id=1"
```

#### Gestión de Fotoclubs
La API incluye endpoints para la gestión de clubes fotográficos:

- **GET** `/api/fotoclub/get_all` - Obtener listado de todos los fotoclubes (público)
- **POST** `/api/fotoclub/create` - Crear un nuevo fotoclub (solo admin)
- **PUT** `/api/fotoclub/edit` - Editar un fotoclub existente (solo admin)

##### Características del Listado
- **Sin autenticación**: Acceso público para consultas
- **Información completa**: Incluye todos los datos del fotoclub
- **Imágenes**: URLs de fotos de los clubes

##### Características de Creación/Edición
- **Autenticación requerida**: Solo administradores
- **Subida de imágenes**: Soporta imágenes en formato base64 (data URI)
- **Validación**: Nombre obligatorio
- **Logging**: Se registran todas las operaciones de creación/modificación

##### Ejemplo de uso
```bash
# Obtener todos los fotoclubes
curl -X GET "https://gfc.prod-api.greenborn.com.ar/api/fotoclub/get_all"

# Crear un nuevo fotoclub (requiere autenticación)
curl -X POST "https://gfc.prod-api.greenborn.com.ar/api/fotoclub/create" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Fotoclub",
    "description": "Descripción del club",
    "email": "contacto@fotoclub.com",
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
  }'
```

## WebSockets

### Eventos Principales
- **user:join**: Usuario se conecta
- **user:leave**: Usuario se desconecta
- **contest:update**: Actualización de concurso
- **result:new**: Nueva fotografía enviada
- **result:evaluated**: Fotografía evaluada
- **notification:new**: Nueva notificación

### Estructura de Mensajes
```javascript
// Mensaje de entrada
{
  event: 'contest:join',
  data: {
    contestId: 1,
    userId: 1
  }
}

// Mensaje de salida
{
  event: 'contest:update',
  data: {
    contestId: 1,
    participants: 150,
    photos: 450
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

## Testing

### Tipos de Tests
- **Unit Tests**: Testing de funciones individuales
- **Integration Tests**: Testing de integración con base de datos
- **WebSocket Tests**: Testing de comunicación en tiempo real
- **API Tests**: Testing de endpoints REST

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests de WebSockets
npm run test:websocket
```

## Deployment

### Configuración de Producción
- Configurar variables de entorno
- Optimizar configuración de Node.js
- Configurar PM2 para gestión de procesos
- Configurar SSL/TLS para WebSockets

### Monitoreo
- Logs de aplicación con Winston
- Métricas de WebSockets
- Monitoreo de memoria y CPU
- Health checks automáticos

## Mantenimiento

### Tareas Regulares
- Limpieza de logs antiguos
- Optimización de base de datos
- Actualización de dependencias
- Backup de configuraciones

### Comandos Útiles
```bash
# Verificar estado de migraciones
npm run migrate:status

# Ejecutar migraciones pendientes
npm run migrate:latest

# Revertir última migración
npm run migrate:rollback

# Generar logs de operaciones
npm run logs:generate
```

## Integración con PHP API

La API Node.js se integra con la API PHP para:
- **Sincronización de datos**: Mantener consistencia entre APIs
- **Comunicación en tiempo real**: Notificaciones y actualizaciones
- **Procesamiento de archivos**: Generación de miniaturas y optimización
- **Logging centralizado**: Registro de todas las operaciones

### Mecanismos de Integración
- **HTTP Communication**: Llamadas entre APIs
- **Database Sharing**: Base de datos compartida
- **Event-driven**: Comunicación por eventos
- **File System**: Compartir archivos procesados

## Performance y Escalabilidad

### Optimizaciones
- **Connection Pooling**: Pool de conexiones a base de datos
- **Caching**: Cache de consultas frecuentes
- **Load Balancing**: Distribución de carga
- **Horizontal Scaling**: Escalado horizontal

### Métricas de Performance
- **Response Time**: Tiempo de respuesta de endpoints
- **WebSocket Connections**: Conexiones activas
- **Memory Usage**: Uso de memoria
- **CPU Usage**: Uso de CPU

## Seguridad

### Medidas Implementadas
- **JWT Authentication**: Autenticación con tokens
- **Input Validation**: Validación de entrada con Joi
- **SQL Injection Protection**: Uso de Knex.js
- **CORS Configuration**: Configuración de CORS
- **Rate Limiting**: Limitación de requests

### WebSocket Security
- **Authentication**: Autenticación de conexiones WebSocket
- **Authorization**: Verificación de permisos
- **Input Sanitization**: Sanitización de mensajes
- **Connection Limits**: Límites de conexiones por usuario

## Soporte y Contacto

Para soporte técnico específico de la API Node.js, contactar al equipo de desarrollo backend.

---

**Navegación**: [Volver al README Principal](../../README.md) | [Arquitectura](arquitectura.md) | [Definición Técnica](definicion_tecnica.md) | [Endpoints](endpoints.md) 