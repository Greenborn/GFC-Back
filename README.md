# GFC-Back - Sistema de Gestión de Concursos Fotográficos

**Última actualización:** 10 de agosto de 2026

## Descripción General

GFC-Back es un sistema backend completo para la gestión de concursos fotográficos, desarrollado con **Node.js (Express.js)**. Proporciona la API REST para la administración de concursos, usuarios, jurados, ranking, subida y procesamiento de imágenes, además de health checks y soporte multi-database.

**Versión actual:** 1.42.45

## Estructura del Proyecto

```
GFC-Back/
├── node_api/                # API principal en Node.js/Express
│   ├── commands/            # Scripts de línea de comandos
│   ├── controllers/         # Lógica de negocio (mailer, ranking, logs, foto del año)
│   ├── middleware/          # Middlewares (autenticación, manejo de errores)
│   ├── migrations/          # Migraciones de base de datos (Knex)
│   ├── routes/              # Definición de rutas de la API
│   ├── utils/               # Utilidades y helpers
│   ├── knexfile.js          # Configuración de Knex / base de datos
│   ├── server.js            # Punto de entrada del servidor
│   └── env.example          # Plantilla de variables de entorno
├── documentacion/           # Documentación completa del proyecto
│   ├── node_api/            # Documentación de la API Node.js
│   └── php_api/             # Documentación histórica de la API PHP
├── scripts/                 # Scripts de operación
│   ├── backup.sh            # Backup de base de datos
│   └── deploy-update.sh     # Actualización de despliegues
├── test/                    # Tests
├── .agents/                 # Agentes/skills de desarrollo
├── .opencode/               # Configuración y skills de opencode
└── README.md                # Este archivo
```

## Características Principales

- **Gestión de Concursos**: Creación, administración, fases (inscripción, juzgamiento) y evaluación de concursos fotográficos
- **Jurado y Juzgamiento**: Jueces de concurso, preselección de fotos con mapa de votos por juez (`aceptar`/`rechazar`) y fases de juzgamiento
- **Categorías y Secciones**: Organización flexible de concursos por categorías y secciones
- **Ranking y Resultados**: Cálculo y recálculo de ranking, carga de resultados de jurado y ganadores compilados
- **Foto del Año**: Gestión de la foto del año con estructura dedicada
- **Sistema de Usuarios**: Registro, autenticación (SSO/JWT), perfiles de fotógrafos, roles y búsqueda avanzada
- **Preferencias de Usuario**: Almacenamiento de preferencias en `user_preferences` y metadatos
- **Gestión de Fotoclubes**: CRUD completo de clubes fotográficos con imágenes (base64)
- **Subida y Procesamiento de Imágenes**: Upload con Multer, generación de thumbnails con Sharp y búsqueda de imágenes
- **Compresión de Concursos**: Generación automática de archivos ZIP con estructura organizada
- **Métricas**: Gestión y ABM de métricas
- **Health Checks**: Endpoint de verificación de estado del sistema y base de datos
- **Multi-Database**: Soporte para PostgreSQL y MySQL mediante `DB_CLIENT`
- **Modo Solo Lectura**: Control de operaciones de escritura mediante `MODO_ESCRITURA`
- **Logs de Operaciones**: Registro de operaciones del servidor

## Tecnologías Utilizadas

### Node.js API (Express)

- **Framework**: Express.js 4
- **Base de Datos**: PostgreSQL / MySQL (Knex.js 3)
- **Sesiones**: express-session + session-file-store
- **Autenticación**: SSO / JWT / Sessions
- **Subida de Archivos**: Multer
- **Procesamiento de Imágenes**: Sharp
- **Compresión**: Archiver (ZIP)
- **HTTP Client**: Axios
- **Hashing**: bcryptjs
- **Variables de Entorno**: dotenv

## Instalación y Configuración

### Requisitos Previos

- Node.js 14+
- PostgreSQL 12+ o MySQL 8+
- npm

### Configuración Rápida

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd GFC-Back
   ```

2. **Configurar la API Node.js**
   ```bash
   cd node_api
   npm install
   cp env.example .env
   # Configurar variables de entorno en .env
   npm run migrate
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_CLIENT` | Tipo de base de datos | `postgresql` / `mysql` |
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_PORT` | Puerto de la base de datos | `5432` (PG) / `3306` (MySQL) |
| `DB_USER` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | `tu_password` |
| `DB_NAME` | Nombre de la base de datos | `gfc_database` |
| `SERVICE_PORT_ADMIN` | Puerto del servidor | `3000` |
| `CORS_ORIGIN` | Orígenes permitidos (separados por espacios) | `http://localhost:3000` |
| `MODO_ESCRITURA` | Modo de escritura | `READ_ONLY` / `READ_WRITE` |
| `IMG_BASE_PATH` | URL base para las imágenes | `https://gfc.api2.greenborn.com.ar/` |
| `UPLOADS_BASE_PATH` | Directorio base para subir imágenes | `/ruta/a/uploads` |

## Endpoints Principales

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| Auth | `/api/auth` | Autenticación y SSO |
| Usuarios | `/api/user` | CRUD, búsqueda y listado de usuarios |
| Preferencias | `/api/user` | Preferencias de usuario y metadatos |
| Perfiles | `/api/profile`, `/api/profile-registrable`, `/api/profile-contest` | Perfiles de fotógrafos y concursos |
| Roles | `/api/role` | Gestión de roles |
| Concursos | `/api/contest`, `/api/contests` | Gestión de concursos |
| Categorías | `/api/category`, `/api/contest-category` | Categorías de concursos |
| Secciones | `/api/section`, `/api/contest-section` | Secciones de concursos |
| Registros | `/api/contest-record` | Registros de concursos |
| Jueces | `/api/contest-judge` | Jueces de concurso |
| Preselección | `/api/contest-preselected-photo` | Preselección de fotos por jurado |
| Resultados | `/api/results`, `/api/contestresult` | Resultados, carga de jurado y subida de fotos |
| Métricas | `/api/metric`, `/api/metric-abm` | Métricas y su ABM |
| Fotoclubes | `/api/fotoclub` | CRUD de fotoclubes |
| Imágenes | `/api/images` | Subida, thumbnails y búsqueda de imágenes |
| Ranking | `/api/ranking` | Cálculo y consulta de ranking |
| Foto del Año | `/api/foto-del-anio` | Foto del año |
| Logs | `/api/log` | Logs de operaciones |
| Footer | `/api/footer` | Contenido del footer |
| Health | `/health` | Estado del sistema y base de datos |

## Actualizaciones Recientes (2026)

- ✅ **Fase de Juzgamiento**: Endpoint `POST /contest-set-judging` y permisos de admin para gestionar la fase de juzgamiento de concursos
- ✅ **Votos de Preselección Refactorizados**: Mapa de votos por juez (`{user_id: 'aceptar'|'rechazar'}`) con helpers `parseVotes`/`buildItem`, recálculo de `preselected` y expuestos `accept_count`, `reject_count`, `my_vote` y `votes`. Migración `050826_preselected_votes_map`
- ✅ **Búsqueda de Usuarios**: Búsqueda parcial (LIKE) en filtros de email, username y DNI en `GET /user/get_all`
- ✅ **Paginación en Usuarios**: Paginación, ordenamiento y filtros avanzados en `GET /user/get_all` con metadatos `_meta`/`_links`
- ✅ **Subida de Fotos a Concursos**: Endpoint `POST /contest-upload` con validaciones (admin/juez, concurso activo, inscripción, límite por sección, título duplicado), transacción, thumbnails y log
- ✅ **Búsqueda en Imágenes**: Ampliación de `GET /images/search` para permitir consultas sin filtros y obtener todos los registros
- ✅ **Normalización de SSO**: Normalización y validación de `unique_id` en authMiddleware, con logs mejorados
- ✅ **Caché de Resultados**: Invalidación de caché al modificar concursos o resultados
- ✅ **Migración de Perfiles Ranking**: Ajuste del tipo `unsigned` en `id_profile` para alinear con la clave foránea

## Desarrollo

### Estructura de Desarrollo

- La API se organiza en `controllers/`, `routes/`, `middleware/`, `utils/` y `migrations/`
- Las migraciones se ejecutan automáticamente al iniciar el servidor (`global.knex.migrate.latest()`)
- Las rutas compatibles con la antigua API PHP se mantienen bajo `/api/contest`

### Comandos Útiles

```bash
npm run migrate          # Ejecutar migraciones
npm run migrate:rollback # Revertir migraciones
npm run migrate:status   # Ver estado de migraciones
npm run update-deploy    # Actualizar despliegue en producción
```

## Documentación

La documentación completa del proyecto se encuentra organizada en el directorio `documentacion/`:

- **[Documentación Node.js API](documentacion/node_api/README.md)** - Especificaciones de la API, endpoints y arquitectura
- **[Documentación PHP API](documentacion/php_api/README.md)** - Documentación histórica de la API PHP
- **[Estructura de Base de Datos](documentacion/estructura_base_de_datos.md)** - Esquema y relaciones de la base de datos
- **[Endpoint de Ranking](documentacion/node_api/endpoint_ranking.md)** - Detalle del endpoint de ranking
- **[Inconsistencias API Node.js](documentacion/inconsistencias_api_nodejs.md)** - Registro de inconsistencias y soluciones

## Contribución

1. Crear una rama para tu feature
2. Seguir las convenciones de código establecidas
3. Documentar cambios en la documentación correspondiente
4. Ejecutar tests antes de hacer commit
5. Crear un Pull Request con descripción detallada

## Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.md

## Contacto

Para consultas técnicas o soporte, contactar al equipo de desarrollo.

---

**Nota**: Para información técnica detallada, consultar la documentación específica del subproyecto en el directorio `documentacion/`.
