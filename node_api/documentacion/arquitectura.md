# Arquitectura de la API - Grupo Fotográfico Centro

## Descripción General

La API del Grupo Fotográfico Centro es una aplicación Node.js que gestiona concursos fotográficos, usuarios, categorías y métricas. Proporciona endpoints RESTful para la administración de concursos fotográficos con sistema de autenticación y autorización.

## Tecnologías Utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web para Node.js
- **Knex.js**: Query builder para MySQL
- **MySQL**: Base de datos relacional
- **bcryptjs**: Encriptación de contraseñas
- **express-session**: Gestión de sesiones
- **session-file-store**: Almacenamiento de sesiones en archivos
- **cors**: Middleware para Cross-Origin Resource Sharing
- **dotenv**: Gestión de variables de entorno
- **axios**: Cliente HTTP
- **uuid**: Generación de identificadores únicos

### Estructura del Proyecto

```
node_api/
├── controllers/          # Lógica de negocio
├── migrations/           # Migraciones de base de datos
├── routes/              # Definición de endpoints
├── sessions/            # Almacenamiento de sesiones
├── documentacion/       # Documentación del proyecto
├── server.js           # Punto de entrada de la aplicación
├── knexfile.js         # Configuración de base de datos
├── package.json        # Dependencias y scripts
└── nodemon.json        # Configuración de desarrollo
```

## Arquitectura de la Aplicación

### 1. Configuración y Middleware

La aplicación utiliza Express.js con los siguientes middlewares:

- **CORS**: Configurado para permitir credenciales y orígenes específicos
- **Body Parser**: Para procesar JSON con límite de 5MB
- **Session Management**: Sesiones almacenadas en archivos con duración de 24 horas
- **Logging**: Registro de operaciones automático

### 2. Estructura de Rutas

La API está organizada en módulos funcionales:

#### Autenticación (`/api/auth`)
- `POST /login`: Inicio de sesión
- `POST /cerrar_sesion`: Cierre de sesión
- `GET /session`: Verificación de sesión activa
- `POST /recupera_pass`: Solicitud de recuperación de contraseña
- `POST /recupera_pass_confirm_code`: Confirmación de código de recuperación
- `POST /recupera_pass_new_pass`: Establecimiento de nueva contraseña

#### Concursos (`/api/contests`)
- `GET /get_all`: Obtener todos los concursos y datos relacionados
- `GET /get_compressed_images`: Obtener imágenes comprimidas (en desarrollo)
- `DELETE /delete`: Eliminar concurso

#### Categorías (`/api/category`)
- Gestión de categorías de concursos

#### Secciones (`/api/section`)
- Gestión de secciones de concursos

#### Fotoclubes (`/api/fotoclub`)
- Gestión de fotoclubes

#### Métricas (`/api/metric`)
- Gestión de métricas y estadísticas

#### Usuarios (`/api/users`)
- Gestión de usuarios

#### Logs (`/api/log`)
- Registro de operaciones del sistema

### 3. Base de Datos

#### Configuración
- **Cliente**: MySQL
- **Migraciones**: Knex.js
- **Conexión**: Configurada mediante variables de entorno

#### Tablas Principales

##### Usuarios (`user`)
- `id`: Identificador único
- `username`: Nombre de usuario
- `password_hash`: Contraseña encriptada
- `email`: Correo electrónico
- `role_id`: Rol del usuario
- `profile_id`: Perfil asociado
- `status`: Estado del usuario
- `password_reset_token`: Token para recuperación de contraseña
- `dni`: Documento de identidad

##### Concursos (`contest`)
- `id`: Identificador único
- `name`: Nombre del concurso
- `description`: Descripción
- `start_date`: Fecha de inicio
- `end_date`: Fecha de finalización
- `max_img_section`: Máximo de imágenes por sección
- `img_url`: URL de imagen del concurso
- `rules_url`: URL de reglas
- `sub_title`: Subtítulo
- `organization_type`: Tipo de organización
- `judged`: Estado de juzgamiento

##### Categorías (`category`)
- Gestión de categorías de concursos

##### Secciones (`section`)
- Gestión de secciones de concursos

##### Resultados (`contest_result`)
- Resultados de concursos

##### Registros (`contests_records`)
- Registros de participación

### 4. Autenticación y Autorización

#### Sistema de Sesiones
- **Almacenamiento**: Archivos locales (`./sessions`)
- **Duración**: 24 horas con renovación automática
- **Seguridad**: Token único por sesión

#### Recuperación de Contraseñas
1. Usuario solicita recuperación
2. Sistema genera token de 6 caracteres
3. Token se envía por email
4. Usuario confirma token
5. Usuario establece nueva contraseña

#### Encriptación
- **Algoritmo**: bcryptjs
- **Salt Rounds**: 10
- **Tokens**: Generados con crypto.randomBytes()

### 5. Logging y Auditoría

#### Log de Operaciones
- **Tabla**: `log_operaciones`
- **Campos**: Usuario, operación, datos, fecha
- **Automatización**: Registro automático de operaciones críticas

#### Operaciones Registradas
- Inicios de sesión
- Intentos fallidos de autenticación
- Operaciones CRUD en concursos
- Recuperaciones de contraseña
- Consultas de datos

### 6. Seguridad

#### Medidas Implementadas
- **CORS**: Configuración específica de orígenes
- **Rate Limiting**: Límite de tamaño de requests (5MB)
- **Session Security**: Tokens únicos y renovación automática
- **Password Hashing**: Encriptación con bcrypt
- **Input Validation**: Validación de datos de entrada
- **SQL Injection Protection**: Uso de Knex.js para queries parametrizadas

#### Variables de Entorno Requeridas
```env
db_host=localhost
db_port=3306
db_user=usuario
db_pass=contraseña
db_name=nombre_base_datos
service_port_admin=3000
cors_origin=http://localhost:3000 http://localhost:8080
verify_code_time=3600000
```

### 7. Despliegue y Desarrollo

#### Scripts Disponibles
- `npm start`: Inicia el servidor con nodemon
- `npm run migrate`: Ejecuta migraciones de base de datos
- `npm test`: Ejecuta tests (pendiente de implementar)

#### Configuración de Desarrollo
- **Nodemon**: Reinicio automático en cambios
- **Sessions**: Ignoradas por nodemon para evitar reinicios innecesarios
- **Logs**: Salida a consola para debugging

### 8. Escalabilidad y Mantenimiento

#### Consideraciones de Escalabilidad
- **Sesiones**: Migración a Redis recomendada para producción
- **Base de Datos**: Índices optimizados en consultas frecuentes
- **Caching**: Implementación de cache para datos estáticos
- **Load Balancing**: Preparado para múltiples instancias

#### Mantenimiento
- **Migraciones**: Sistema de versionado de base de datos
- **Logs**: Rotación automática de archivos de log
- **Backups**: Estrategia de respaldo de base de datos
- **Monitoreo**: Logs estructurados para análisis

## Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Node.js   │    │   MySQL DB      │
│   (Vue.js)      │◄──►│   (Express)     │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   File System   │
                       │   (Sessions)    │
                       └─────────────────┘
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/cerrar_sesion` - Cierre de sesión
- `GET /api/auth/session` - Verificar sesión

### Concursos
- `GET /api/contests/get_all` - Obtener todos los concursos
- `DELETE /api/contests/delete` - Eliminar concurso

### Gestión de Usuarios
- `POST /api/auth/recupera_pass` - Recuperar contraseña
- `POST /api/auth/recupera_pass_confirm_code` - Confirmar código
- `POST /api/auth/recupera_pass_new_pass` - Nueva contraseña

## Consideraciones Futuras

1. **Implementación de WebSockets** para notificaciones en tiempo real
2. **Sistema de roles y permisos** más granular
3. **API de subida de imágenes** con compresión automática
4. **Sistema de notificaciones** por email y push
5. **Dashboard de métricas** en tiempo real
6. **Tests automatizados** con Jest
7. **Documentación API** con Swagger/OpenAPI
8. **Containerización** con Docker
9. **CI/CD Pipeline** para despliegue automático
10. **Monitoreo y alertas** con herramientas como PM2

## Informe de Tablas de Base de Datos

### Tabla: category
- `id` - integer NOT NULL
- `name` - character varying(45) NOT NULL

### Tabla: contest
- `id` - integer NOT NULL
- `name` - character varying(45) NOT NULL
- `description` - text
- `start_date` - date
- `end_date` - date
- `max_img_section` - integer DEFAULT 3
- `img_url` - character varying(45)
- `rules_url` - character varying(45)

### Tabla: contest_category
- `id` - integer NOT NULL
- `contest_id` - integer NOT NULL
- `category_id` - integer NOT NULL

### Tabla: contest_result
- `id` - integer NOT NULL
- `metric_id` - integer NOT NULL
- `image_id` - integer NOT NULL
- `contest_id` - integer NOT NULL
- `section_id` - integer NOT NULL

### Tabla: contest_section
- `id` - integer NOT NULL
- `contest_id` - integer NOT NULL
- `section_id` - integer NOT NULL

### Tabla: footer
- `id` - integer NOT NULL
- `email` - character varying(45)
- `address` - character varying(45)
- `phone` - character varying(45)

### Tabla: fotoclub
- `id` - integer NOT NULL
- `name` - character varying(45) DEFAULT NULL

### Tabla: image
- `id` - integer NOT NULL
- `code` - character varying(20) NOT NULL
- `title` - character varying(45) NOT NULL
- `profile_id` - integer NOT NULL
- `url` - character varying(45)

### Tabla: info_centro
- `id` - integer NOT NULL
- `title` - character varying(200)
- `content` - text
- `img_url` - character varying(45)

### Tabla: log_operaciones
- `id` - integer NOT NULL (AUTO_INCREMENT)
- `id_usuario` - integer NOT NULL
- `evento` - varchar(255) NOT NULL
- `meta_data` - json
- `date_time` - datetime NOT NULL

### Tabla: metric
- `id` - integer NOT NULL
- `prize` - character varying(10) NOT NULL
- `score` - integer

### Tabla: metric_abm
- `id` - integer NOT NULL (AUTO_INCREMENT)
- `prize` - varchar NOT NULL
- `score` - decimal
- `organization_type` - varchar(36)

### Tabla: profile
- `id` - integer NOT NULL
- `name` - character varying(59) DEFAULT NULL
- `last_name` - character varying(50) DEFAULT NULL
- `fotoclub_id` - integer NOT NULL
- `img_url` - character varying(45)

### Tabla: profile_contest
- `id` - integer NOT NULL
- `profile_id` - integer NOT NULL
- `contest_id` - integer NOT NULL
- `category_id` - integer NOT NULL

### Tabla: role
- `id` - integer NOT NULL
- `type` - character varying(45) NOT NULL

### Tabla: section
- `id` - integer NOT NULL
- `name` - character varying(45) NOT NULL

### Tabla: thumbnail
- `id` - integer NOT NULL (AUTO_INCREMENT)
- `image_id` - integer NOT NULL
- `thumbnail_type` - integer NOT NULL
- `url` - character varying(250) NOT NULL

### Tabla: thumbnail_type
- `id` - integer NOT NULL (AUTO_INCREMENT)
- `width` - integer NOT NULL
- `height` - integer NOT NULL

### Tabla: user
- `id` - integer NOT NULL
- `username` - character varying(45) DEFAULT NULL
- `password_hash` - character varying(255) DEFAULT NULL
- `password_reset_token` - character varying(255) DEFAULT NULL
- `access_token` - character varying(128) DEFAULT NULL
- `created_at` - character varying(45) DEFAULT NULL
- `updated_at` - character varying(45) DEFAULT NULL
- `status` - smallint NOT NULL
- `role_id` - integer NOT NULL
- `profile_id` - integer NOT NULL 