# Endpoints - Node.js API

## Documentación Completa de Endpoints

Esta documentación describe todos los endpoints disponibles en la API Node.js del sistema GFC-Back, incluyendo parámetros, respuestas y ejemplos de uso.

## Información General

### Base URL
```
https://gfc.prod-api.greenborn.com.ar/api
```

### Autenticación
La mayoría de endpoints requieren autenticación mediante Bearer Token persistente:
```
Authorization: Bearer <access_token>
```

### Formatos de Respuesta
- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Timezone**: UTC

---

## 1. Autenticación

### 1.1 Login de Usuario
**POST** `/auth/login`

Autentica un usuario y devuelve un token de acceso persistente.

#### Parámetros
```json
{
  "username": "usuario_admin",
  "password": "contraseña_segura"
}
```

#### Respuesta Exitosa (200)
```json
{
  "status": true,
  "token": "yeCk1wTui-819R7E1LkWVamHsohSns_a",
  "username": "testlucho",
  "roleType": "Administrador",
  "roleId": 1,
  "id": 68
}
```

### 1.2 Registro de Usuario
**POST** `/auth/register`

Registra un nuevo usuario en el sistema.

#### Parámetros
```json
{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "status": "pending"
    },
    "message": "Usuario registrado. Verifica tu email para activar la cuenta."
  }
}
```

### 1.3 Logout
**POST** `/auth/logout`

Cierra la sesión del usuario actual.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### 1.4 Refresh Token
**POST** `/auth/refresh`

Renueva el token JWT usando el refresh token.

#### Parámetros
```json
{
  "refresh_token": "refresh_token_here"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expires_in": 86400
  }
}
```

---

## 2. Usuarios

### 2.1 Obtener Lista de Usuarios
**GET** `/users`

Obtiene una lista paginada de usuarios.

#### Query Parameters
- `page` (int): Número de página (default: 1)
- `limit` (int): Elementos por página (default: 20, max: 100)
- `search` (string): Búsqueda por nombre o email
- `role` (string): Filtrar por rol
- `status` (string): Filtrar por estado

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "user@example.com",
        "role": "participant",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  }
}
```

### 2.2 Obtener Usuario por ID
**GET** `/users/{id}`

Obtiene los detalles de un usuario específico.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "role": "participant",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 3. Concursos

### 3.1 Obtener Lista de Concursos
**GET** `/contests`

Obtiene una lista paginada de concursos.

#### Query Parameters
- `page` (int): Número de página (default: 1)
- `limit` (int): Elementos por página (default: 20, max: 100)
- `status` (string): Filtrar por estado
- `search` (string): Búsqueda por título

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "contests": [
      {
        "id": 1,
        "title": "Concurso de Fotografía 2024",
        "subtitle": "Capturando la belleza natural",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 60,
      "items_per_page": 20
    }
  }
}
```

### 3.2 Obtener Concurso por ID
**GET** `/contests/{id}`

Obtiene los detalles completos de un concurso.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Concurso de Fotografía 2024",
    "subtitle": "Capturando la belleza natural",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3.3 Obtener Participantes de un Concurso
**GET** `/contest/participants`

Obtiene el listado básico de participantes de un concurso específico. Solo pueden acceder usuarios autenticados con rol **admin** (`rol == "1"`) o **delegado** (`rol == "2"`). Se registra un log de operación cada vez que se consulta este endpoint.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Query Parameters
- `id` (int, requerido): ID del concurso

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "contest": {
    "id": 1,
    "name": "Concurso de Fotografía 2024",
    "description": "Capturando la belleza natural",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "sub_title": "Edición 2024"
  },
  "participants": [
    {
      "name": "Juan",
      "last_name": "Pérez",
      "dni": "12345678",
      "email": "juan.perez@email.com",
      "category_name": "Aficionado"
    }
  ],
  "total_participants": 150,
  "message": "Se encontraron 150 participantes en el concurso \"Concurso de Fotografía 2024\""
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "ID de concurso inválido"
}
```

#### Respuesta de Error (401)
```json
{
  "success": false,
  "message": "No autenticado"
}
```

#### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "No tiene permisos para acceder a este recurso"
}
```

#### Respuesta de Error (404)
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error interno del servidor al obtener participantes"
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Solo admin (`rol == "1"`) o delegado (`rol == "2"`)
- **Validación**: ID de concurso válido
- **Logging**: Se registra la consulta en la tabla de logs de operaciones
- **Rate Limiting**: Según configuración global

---

### 3.4 Obtener Fotos Comprimidas de un Concurso
**GET** `/contest/compressed-photos`

Genera y obtiene un archivo ZIP con todas las fotografías de un concurso, organizadas por categoría, sección y premio. El endpoint crea una estructura de carpetas completa con las fotos y subdirectorios vacíos para cada premio disponible. Si el concurso ya está finalizado y el ZIP existe, solo devuelve la URL de descarga sin regenerar el archivo.

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
- `id` (int, requerido): ID del concurso

#### Respuesta Exitosa (200) - Concurso Finalizado con ZIP Existente
```json
{
  "success": true,
  "contest_id": 1,
  "download_url": "https://assets.prod-gfc.greenborn.com.ar/concurso_1.zip",
  "message": "El concurso está finalizado y el archivo comprimido ya existe. Solo se envía el .zip."
}
```

#### Respuesta Exitosa (200) - Procesamiento Completo
```json
{
  "success": true,
  "contest_sections": [
    {
      "id": 1,
      "name": "Color"
    },
    {
      "id": 2,
      "name": "Blanco y Negro"
    }
  ],
  "contest_categories": [
    {
      "id": 1,
      "name": "Primera",
      "mostrar_en_ranking": 1
    },
    {
      "id": 2,
      "name": "Estimulo",
      "mostrar_en_ranking": 1
    }
  ],
  "inscritos": [
    {
      "profile_id": 88,
      "profile_name": "Juan Pérez",
      "category_id": 1
    }
  ],
  "contest_id": 1,
  "contest_dir": "/var/www/GFC-PUBLIC-ASSETS/concurso_1",
  "total_images": 450,
  "images": [
    {
      "id": 10047,
      "code": "3336_2025_38_Color_10047",
      "title": "A LA DERECHA",
      "profile_id": 88,
      "url": "/images/2025/Primera/Color/3336_2025_38_Color_10047.jpg",
      "section_id": 1,
      "metric_id": 123,
      "contest_result_id": 456
    }
  ],
  "profile_category_dict": {
    "88": 1
  },
  "download_url": "https://assets.prod-gfc.greenborn.com.ar/concurso_1.zip"
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "ID de concurso inválido o faltante. Use ?id=<contest_id>"
}
```

#### Respuesta de Error (404)
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error interno del servidor al obtener fotos asociadas al concurso",
  "error": "Detalles del error"
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Usuarios autenticados
- **Estructura de Carpetas**: 
  - `concurso_{id}/`
    - `{Categoría}/`
      - `{Sección}/`
        - `{Premio}/` (subdirectorios vacíos para cada premio)
        - `{codigo_imagen}.jpg` (fotos)
- **Optimización**: Si el concurso está finalizado y el ZIP ya existe, solo devuelve la URL
- **Procesamiento de Imágenes**: Copia las imágenes desde el repositorio principal
- **Formato de Nombres**: Los archivos se nombran según su código único
- **Compresión**: Genera un archivo ZIP con nivel 9 de compresión
- **Premios**: Obtiene los premios desde `metric_abm` con `organization_type = 'INTERNO'`
- **Rate Limiting**: Según configuración global

#### Estructura Generada del Directorio
```
concurso_1/
├── Primera/
│   ├── Color/
│   │   ├── Primer Premio/
│   │   ├── Segundo Premio/
│   │   ├── Tercer Premio/
│   │   ├── Mención de Honor/
│   │   ├── 3336_2025_38_Color_10047.jpg
│   │   └── 3337_2025_38_Color_10048.jpg
│   └── Blanco y Negro/
│       ├── Primer Premio/
│       ├── Segundo Premio/
│       └── ...
└── Estimulo/
    ├── Color/
    └── Blanco y Negro/
```


### 3.5 Descarga de Fotos Premiadas del Año
**GET** `/contest/compiled-winners`

Genera y descarga un archivo ZIP con las fotografías premiadas del año especificado. Recorre todos los concursos del año, tomando únicamente aquellos con `judged == true` y `organization_type == "INTERNO"`, y copia las imágenes ganadoras según filtros de premios y categorías.

#### Headers
```
Authorization: Bearer <token>
```

#### Query Parameters
- `year` (int, opcional): Año objetivo. Si no se especifica, se toma el año en curso.
- `premios` (string, opcional): Lista separada por comas. Por defecto: `"1er PREMIO","2do PREMIO","3er PREMIO","MENCION ESPECIAL"`.
- `categorias` (string, opcional): Lista separada por comas. Por defecto: `"Estímulo","Primera"`.

#### Comportamiento
- Selecciona concursos cuyo `end_date` esté entre `1 de enero (00:00)` y `31 de diciembre (23:59)` del año indicado.
- Filtra `contest` por `judged = true` y `organization_type = 'INTERNO'`.
- Crea un directorio temporal bajo `IMG_REPOSITORY_PATH` llamado `compilado_premiadas`.
  - Si existe, se elimina y se vuelve a crear.
- Estructura de carpetas dentro de `compilado_premiadas`:
  - `{titulo_concurso_sanitizado}/` (minúsculas, espacios→"_", solo alfanumérico)
    - `{categoria}/` (minúsculas)
    - `{premio}/` (minúsculas)
        - archivos con su nombre original
- Las rutas de origen se construyen con `IMG_BASE_PATH + image.url` y se copian al repositorio local.
- Se genera el ZIP `compilado_premiadas_<year>.zip` en `IMG_REPOSITORY_PATH` y se expone por `IMG_BASE_PATH`.

#### Origen de Datos
- `contest` (title, end_date, judged, organization_type)
- `contest_result` (contest_id, image_id, section_id, metric_id)
- `metric` (prize, score) para identificar premios
- `image` (title, url, profile_id)
- `profile` (name, last_name)
- `profile_contest` → `category` (name) para ubicar por categoría

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "year": 2025,
  "download_url": "https://assets.prod-gfc.greenborn.com.ar/compilado_premiadas_2025.zip"
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "Parámetros inválidos"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error interno al compilar premiadas del año",
  "error": "Detalles del error"
}
```

#### Notas Técnicas
- `IMG_REPOSITORY_PATH` se define en `.env` (por ejemplo: `/var/www/GFC-PUBLIC-ASSETS`).
- `IMG_BASE_PATH` se usa para construir el `download_url` público.
- Normalización:
  - Premios y categorías se comparan por su texto; se recomienda admitir equivalencias y normalizar a valores de `metric.prize`.
  - Títulos de concursos sanitizados: reemplazo de espacios por `_`, filtrado no alfanumérico, minúsculas.

#### Seguridad
- Permisos: Solo administrador (`role_id == '1'`).

## 4. Logs de Operaciones

### 4.1 Obtener Logs
**GET** `/logs`

Obtiene una lista paginada de logs de operaciones.

#### Query Parameters
- `user_id` (int): Filtrar por usuario
- `operation_type` (string): Filtrar por tipo de operación
- `status` (string): Filtrar por estado
- `page` (int): Número de página
- `limit` (int): Elementos por página

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "user_id": 1,
        "operation_type": "login",
        "status": "success",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_items": 40,
      "items_per_page": 20
    }
  }
}
```

### 4.2 Crear Log
**POST** `/logs`

Registra una nueva operación en el sistema.

#### Parámetros
```json
{
  "user_id": 1,
  "operation_type": "login",
  "operation_description": "Usuario inició sesión",
  "status": "success"
}
```

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "user_id": 1,
    "operation_type": "login",
    "status": "success",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Log registrado exitosamente"
}
```

---

## 5. WebSockets

### 5.1 Conexión WebSocket
**URL**: `wss://api.gfc-back.com/node/ws`

#### Autenticación
Enviar el token JWT en el handshake:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5.2 Eventos Principales
- `user:join` - Usuario se conecta
- `user:leave` - Usuario se desconecta
- `contest:update` - Actualización de concurso
- `result:new` - Nueva fotografía enviada
- `result:evaluated` - Fotografía evaluada
- `notification:new` - Nueva notificación

#### Ejemplo de Mensaje de Entrada
```json
{
  "event": "contest:join",
  "data": {
    "contestId": 1,
    "userId": 1
  }
}
```

#### Ejemplo de Mensaje de Salida
```json
{
  "event": "contest:update",
  "data": {
    "contestId": 1,
    "participants": 150,
    "photos": 450
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 6. Métricas y Estadísticas

### 6.1 Obtener Métricas Generales
**GET** `/metrics/overview`

Obtiene métricas generales del sistema.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "total_users": 200,
    "total_contests": 10,
    "active_websocket_connections": 50,
    "average_response_time_ms": 120
  }
}
```

---

## 7. Imágenes

### 7.1 Buscar Imágenes
**GET** `/images/search`

Busca imágenes por código o título. Endpoint público que no requiere autenticación.

#### Query Parameters
- `q` (string, requerido): Término de búsqueda para código o título

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Búsqueda realizada correctamente",
  "data": [
    {
      "id": 10047,
      "code": "3336_2025_38_Color_10047",
      "title": "A LA DERECHA",
      "profile_id": 88,
      "url": "https://gfc.prod-api.greenborn.com.ar/images/2025/Primera/Color/3336_2025_38_Color_10047.jpg",
      "author_name": "Juan",
      "author_last_name": "Pérez",
      "author": "Juan Pérez",
      "section_name": "Color",
      "section": "Color",
      "contest": {
        "id": 5,
        "name": "Concurso Nacional 2025",
        "subtitle": "Primera Edición"
      }
    }
  ],
  "total": 1,
  "searchTerm": "3336_2025_38_Color_10047"
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "El parámetro de búsqueda \"q\" es requerido",
  "data": []
}
```

### 7.2 Obtener Todas las Imágenes
**GET** `/images/all`

Obtiene todas las imágenes disponibles. Endpoint público que no requiere autenticación.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Imágenes obtenidas correctamente",
  "data": [
    {
      "id": 10047,
      "code": "3336_2025_38_Color_10047",
      "title": "A LA DERECHA",
      "profile_id": 88,
      "url": "https://gfc.prod-api.greenborn.com.ar/images/2025/Primera/Color/3336_2025_38_Color_10047.jpg",
      "author_name": "Juan",
      "author_last_name": "Pérez",
      "author": "Juan Pérez",
      "section_name": "Color",
      "section": "Color",
      "contest": {
        "id": 5,
        "name": "Concurso Nacional 2025",
        "subtitle": "Primera Edición"
      }
    }
  ],
  "total": 1
}
```

#### Características de los Endpoints de Imágenes
- **Límite**: Máximo 10 resultados por consulta
- **Ordenamiento**: Alfabético por título (ascendente)
- **Búsqueda**: Coincidencia total o parcial en campos `code` y `title`
- **URLs**: URLs completas con base configurable en `IMG_BASE_PATH`
- **Autor**: Nombre completo del autor (JOIN con tabla `profile`)
- **Sección**: Nombre de la sección (JOIN con tablas `contest_result` y `section`)
- **Concurso**: Información del concurso (JOIN con tabla `contest`)
  - `contest`: Objeto con la información del concurso al que pertenece la imagen. Puede ser `null` si la imagen no está asociada a ningún concurso.
    - `id`: ID del concurso
    - `name`: Nombre del concurso
    - `subtitle`: Subtítulo del concurso

---

## 8. Resultados de Concursos

### 8.1 Cargar Resultados de Jurado
**POST** `/results/judging`

Carga los resultados de jurado de un concurso fotográfico. Este endpoint procesa una estructura JSON compleja con los resultados de evaluación y actualiza las métricas correspondientes en la base de datos.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Parámetros
```json
{
  "estructura": {
    "exportacion": {
      "Concurso1": {
        "Seccion1": {
          "Premio1": {
            "__files": ["archivo1.jpg", "archivo2.jpg"]
          },
          "Premio2": {
            "__files": ["archivo3.jpg"]
          }
        }
      }
    }
  }
}
```

#### Estructura de Archivos
Los nombres de archivo deben seguir el formato: `{id_usuario}_{anio}_{id_concurso}_{seccion}_{id_imagen}.jpg`

Ejemplo: `3336_2025_38_Color_10047.jpg`

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "actualizaciones": [
    {
      "code": "3336_2025_38_Color_10047",
      "metric_id": 123,
      "nuevo_prize": "Primer Premio",
      "nuevo_score": 95
    }
  ]
}
```

#### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "Estructura inválida o faltante"
}
```

#### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error al procesar resultados",
  "error": "Detalles del error"
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (solo rol `admin`)
- **Transaccional**: Todas las actualizaciones se realizan en una transacción
- **Validación**: Verifica que todos los premios tengan correspondencia en `metric_abm`
- **Unicidad**: Solo permite cargar resultados de un concurso por vez
- **Actualización automática**: Marca el concurso como `judged: true` al finalizar

### 8.2 Recalcular Ranking
**POST** `/results/recalcular-ranking`

Recalcula el ranking anual directamente con lógica Node.js (sin comando PHP). El controlador Node lee resultados juzgados del año en curso y actualiza las tablas `profiles_ranking_category_section` y `fotoclub_ranking` en una transacción.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Ranking recalculado exitosamente",
  "output": {
    "stat": true,
    "message": "Ranking recalculado exitosamente",
    "perfiles_insertados": 123,
    "fotoclubs_insertados": 12
  }
}
```

#### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error interno al recalcular ranking",
  "error": "Detalles del error"
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (solo rol `admin`)
- **Transaccional**: Limpia e inserta rankings en una transacción
- **Selección de concursos**: `judged = true`, `organization_type = 'INTERNO'`, `end_date >= inicio de año`
- **Perfil/Categoría/Sección**: Suma `metric.score`, cuenta presentadas/premiadas, compone `prizes` como JSON con sumatoria de puntajes por premio
- **Fotoclub**: Suma agregados de sus miembros, calcula `porc_efectividad_anual`
- **Manejo de errores**: Captura errores de Node.js y devuelve detalles en `error`

### 8.3 Detalle de Ranking por Concursante
**GET** `/ranking/detalle`

Obtiene el detalle de participación y ranking de un concursante dentro de un concurso específico. Incluye datos del concurso y del perfil, categorías asignadas por inscripción, secciones en las que tiene resultados, listado de imágenes con sus métricas y el ranking total con posición calculada contra el resto de participantes del concurso.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Query Parameters
- `profile_id` (int, requerido): ID del concursante (perfil)
- `contest_id` (int, opcional): ID del concurso
- `year` (int, opcional): Año a consultar si no se especifica `contest_id` (default: año actual)

#### Respuesta Exitosa (200)
```json
{
  "contest": {
    "id": 51,
    "name": "Tres elementos y Paisaje",
    "description": "...",
    "start_date": "2025-07-27 22:53:00",
    "end_date": "2025-08-17 23:58:00",
    "organization_type": "INTERNO",
    "judged": true
  },
  "profile": {
    "id": 123,
    "name": "Juan",
    "last_name": "Pérez",
    "fotoclub": { "id": 7, "name": "GFC", "photo_url": "..." },
    "img_url": "images/perfil/123.jpg"
  },
  "categories": [
    { "id": 2, "name": "Primera" }
  ],
  "sections": [
    { "id": 1, "name": "Color" },
    { "id": 2, "name": "Monocromo" }
  ],
  "results": [
    {
      "section": "Color",
      "category": "Primera",
      "images": [
        { "image_id": 10047, "metric": { "prize": "1er PREMIO", "score": 95 } },
        { "image_id": 10048, "metric": { "prize": "ACEPTADA", "score": 1 } }
      ]
    },
    {
      "section": "Monocromo",
      "category": "Primera",
      "images": [
        { "image_id": 10090, "metric": { "prize": "MENCION", "score": 5 } }
      ]
    }
  ],
  "ranking": {
    "total_score": 101,
    "position": 2
  }
}
```

#### Respuesta de Error (401)
```json
{ "success": false, "message": "No autenticado" }
```

#### Respuesta de Error (403)
```json
{ "success": false, "message": "El concursante no está inscripto en el concurso" }
```

#### Respuesta de Error (404)
```json
{ "success": false, "message": "Concurso no encontrado" }
```
```json
{ "success": false, "message": "Concursante no encontrado" }
```

#### Respuesta de Error (500)
```json
{ "success": false, "message": "Error interno", "error": "Detalles" }
```

#### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Usuarios autenticados
- **Validación**: Verifica inscripción del perfil en el concurso (`profile_contest`)
- **Datos incluidos**: `contest`, `profile` (con `fotoclub`), `categories`, `sections`, `results` y `ranking`
- **Cálculo de ranking**: Suma `metric.score` del concursante y calcula `position` comparando contra total de participantes del concurso

#### Ejemplos de Uso
- cURL
```
curl -H "Authorization: Bearer <token>" \
  "http://localhost:7779/api/ranking/detalle?contest_id=51&profile_id=123"
```

- Node.js (axios)
```js
const axios = require('axios');
const token = '<token>';
const url = 'http://localhost:7779/api/ranking/detalle?contest_id=51&profile_id=123';
axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
  .then(res => console.log(res.data))
  .catch(err => console.error(err.response?.status, err.response?.data));
```

#### Pruebas Automatizadas
- Script de prueba disponible en `test/test_ranking_detalle.js` que:
  - Autentica y obtiene `token`
  - Descubre `contest_id` y `profile_id` válidos
  - Verifica acceso sin token (401) y con token (200)
  - Valida la estructura de respuesta (`contest`, `profile`, `categories`, `sections`, `results`, `ranking`)

#### Variante sin `contest_id` (opcional)

**GET** `/ranking/detalle?profile_id={id}&year=YYYY`

Cuando no se especifica `contest_id`, el endpoint devuelve los datos de todos los concursos del año indicado (por defecto, año actual) en los que el perfil participó o está inscripto. El filtrado se realiza por `end_date >= 1 de enero` y año de la fecha de cierre igual al `year` indicado.

#### Query Parameters
- `year` (int, opcional): Año a consultar. Default: año actual.

#### Respuesta Exitosa (200)
```json
{
  "profile": { "id": 123, "name": "Juan", "last_name": "Pérez", "fotoclub": { "id": 7, "name": "GFC" }, "img_url": "..." },
  "year": 2025,
  "items": [
    {
      "contest": { "id": 51, "name": "Concurso A", "end_date": "2025-03-20 23:59:00" },
      "categories": [ { "id": 2, "name": "Primera" } ],
      "sections": [ { "id": 1, "name": "Color" } ],
      "results": [ { "section": "Color", "category": "Primera", "images": [ { "image_id": 10047, "metric": { "prize": "1er PREMIO", "score": 95 } } ] } ],
      "ranking": { "total_score": 95, "position": 1 }
    },
    {
      "contest": { "id": 52, "name": "Concurso B", "end_date": "2025-06-15 23:59:00" },
      "categories": [],
      "sections": [],
      "results": [],
      "ranking": { "total_score": 0, "position": null }
    }
  ],
  "count": 2
}
```

#### Ejemplos de Uso
- cURL
```
curl -H "Authorization: Bearer <token>" \
  "http://localhost:7779/api/ranking/detalle?profile_id=123&year=2025"
```

- Node.js (axios)
```js
const axios = require('axios');
const token = '<token>';
axios.get('http://localhost:7779/api/ranking/detalle?profile_id=123&year=2025', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => console.log(res.data.items.length))
  .catch(err => console.error(err.response?.status, err.response?.data));
```

---

## 9. Códigos de Error

### 9.1 Códigos de Estado HTTP
- `200` - OK: Operación exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: No autenticado
- `403` - Forbidden: No autorizado
- `404` - Not Found: Recurso no encontrado
- `422` - Unprocessable Entity: Validación fallida
- `500` - Internal Server Error: Error del servidor

### 9.2 Códigos de Error Específicos
```json
{
  "VALIDATION_ERROR": "Datos de entrada inválidos",
  "INVALID_CREDENTIALS": "Credenciales incorrectas",
  "TOKEN_EXPIRED": "Token expirado",
  "INVALID_TOKEN": "Token inválido",
  "USER_NOT_FOUND": "Usuario no encontrado",
  "CONTEST_NOT_FOUND": "Concurso no encontrado",
  "PERMISSION_DENIED": "Permisos insuficientes"
}
```

---

## 10. Fotoclub

### 10.1 Obtener todos los fotoclubes
**GET** `/fotoclub/get_all`

Obtiene la lista completa de clubes fotográficos registrados en el sistema.

#### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 1,
      "name": "El Portal De Tandil",
      "description": "Club de Tandil",
      "facebook": "facebook.com/portal",
      "instagram": "@portal",
      "email": "contacto@portal.com",
      "photo_url": "2025/foto_club_1234567890.jpg",
      "mostrar_en_ranking": 1,
      "organization_type": "INTERNO"
    },
    {
      "id": 2,
      "name": "Juarez Fotoclub",
      "description": "Club de Juarez",
      "facebook": "facebook.com/juarez",
      "instagram": "@juarez",
      "email": "contacto@juarez.com",
      "photo_url": "2025/foto_club_1234567891.jpg",
      "mostrar_en_ranking": 1,
      "organization_type": "INTERNO"
    }
  ]
}
```

#### Respuesta de Error (500)
```json
{
  "message": "Error al obtener registros"
}
```

#### Características del Endpoint
- **Autenticación**: No requerida (público)
- **Permisos**: No requiere permisos especiales
- **Validación**: Ninguna
- **Rate Limiting**: Según configuración global

---

### 10.2 Crear un fotoclub
**POST** `/fotoclub/create`

Crea un nuevo club fotográfico en el sistema.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body de Request (ejemplo)
```json
{
  "name": "Nuevo Fotoclub",
  "description": "Descripción del nuevo club",
  "facebook": "facebook.com/nuevofotoclub",
  "instagram": "@nuevofotoclub",
  "email": "contacto@nuevofotoclub.com",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mostrar_en_ranking": 1,
  "organization_type": "INTERNO"
}
```

#### Parámetros
- `name` (string, requerido): Nombre del fotoclub
- `description` (string, opcional): Descripción del fotoclub
- `facebook` (string, opcional): URL de Facebook
- `instagram` (string, opcional): Usuario de Instagram
- `email` (string, opcional): Email de contacto
- `image` (string, opcional): Imagen en formato base64 (data URI)
- `mostrar_en_ranking` (int, opcional): Si debe mostrarse en ranking (0/1)
- `organization_type` (string, opcional): Tipo de organización ("INTERNO"/"EXTERNO")

#### Respuesta Exitosa (201)
```json
{
  "stat": true,
  "text": "Fotoclub creado exitosamente",
  "item": {
    "id": 3,
    "name": "Nuevo Fotoclub",
    "description": "Descripción del nuevo club",
    "facebook": "facebook.com/nuevofotoclub",
    "instagram": "@nuevofotoclub",
    "email": "contacto@nuevofotoclub.com",
    "photo_url": "2025/foto_club_1234567892.jpg",
    "mostrar_en_ranking": 1,
    "organization_type": "INTERNO"
  }
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "text": "El nombre es obligatorio"
}
```

#### Respuesta de Error (403)
```json
{
  "stat": false,
  "text": "Acceso denegado: solo administradores pueden crear fotoclubs"
}
```

#### Respuesta de Error (500)
```json
{
  "stat": false,
  "text": "Ocurrió un error al crear el fotoclub."
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Solo admin (`role_id == "1"`)
- **Validación**: El campo 'name' es obligatorio
- **Procesamiento de Imagen**: Si se envía una imagen en base64, se guarda en el sistema de archivos
- **Directorio de Imágenes**: `UPLOADS_BASE_PATH/{year}/foto_club_{timestamp}.{ext}`
- **Rate Limiting**: Según configuración global

---

### 10.3 Editar un fotoclub
**PUT** `/fotoclub/edit`

Edita los datos de un club fotográfico existente.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body de Request (ejemplo)
```json
{
  "id": 1,
  "name": "Nuevo Nombre",
  "description": "Descripción actualizada",
  "facebook": "facebook.com/nuevo",
  "instagram": "@nuevo",
  "email": "nuevo@club.com",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Parámetros
- `id` (int, requerido): ID del fotoclub a editar
- `name` (string, requerido): Nombre del fotoclub
- `description` (string, opcional): Descripción del fotoclub
- `facebook` (string, opcional): URL de Facebook
- `instagram` (string, opcional): Usuario de Instagram
- `email` (string, opcional): Email de contacto
- `image` (string, opcional): Nueva imagen en formato base64 (data URI)

#### Respuesta Exitosa (200)
```json
{
  "stat": true,
  "text": "Registro actualizado correctamente"
}
```

#### Respuesta de Error (400)
```json
{
  "stat": false,
  "text": "El nombre es obligatorio"
}
```

#### Respuesta de Error (403)
```json
{
  "stat": false,
  "text": "Acceso denegado: solo administradores pueden editar fotoclubs"
}
```

#### Respuesta de Error (404)
```json
{
  "stat": false,
  "text": "No se encontró el registro para actualizar"
}
```

#### Respuesta de Error (500)
```json
{
  "stat": false,
  "text": "Ocurrió un error interno, contacte con soporte."
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Solo admin (`role_id == "1"`) + writeProtection
- **Validación**: El campo 'name' es obligatorio
- **Procesamiento de Imagen**: Si se envía una nueva imagen, reemplaza la anterior
- **Logging**: Se registra el cambio con valores anteriores y nuevos
- **Rate Limiting**: Según configuración global

---

**Navegación**: [README](README.md) | [Arquitectura](arquitectura.md) | [Definición Técnica](definicion_tecnica.md) | [Volver al README Principal](../../README.md) 

---

## 11. Recuperación de Contraseña

### 11.1 Solicitar recuperación de contraseña
**POST** `/auth/recupera_pass`

Solicita el envío de un código de verificación al correo electrónico del usuario para recuperar la contraseña.

#### Headers
```
Content-Type: application/json
```

#### Body de Request (ejemplo)
```json
{
  "email": "usuario@dominio.com"
}
```

#### Respuesta Exitosa (200)
```json
{
  "r": true
}
```

#### Respuesta de Error (400)
```json
{
  "r": false,
  "error": "Falta email"
}
```

#### Respuesta de Error (500)
```json
{
  "r": false,
  "error": "Error interno del servidor"
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Email válido y registrado
- **Transaccional**: Sí (actualiza token y fecha en BD)
- **Rate Limiting**: Según configuración global

---

### 11.2 Confirmar código de recuperación
**POST** `/auth/recupera_pass_confirm_code`

Verifica que el código de recuperación enviado al correo sea válido y no haya expirado.

#### Headers
```
Content-Type: application/json
```

#### Body de Request (ejemplo)
```json
{
  "email": "usuario@dominio.com",
  "code": "ABC123"
}
```

#### Respuesta Exitosa (200)
```json
{
  "r": true
}
```

#### Respuesta de Error (400)
```json
{
  "r": false,
  "error": "Falta de credenciales"
}
```

#### Respuesta de Error (200) - Código inválido o expirado
```json
{
  "r": false
}
```

#### Respuesta de Error (500)
```json
{
  "r": false,
  "error": "Error interno del servidor"
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Email y código válidos, código no expirado
- **Transaccional**: No
- **Rate Limiting**: Según configuración global

---

### 11.3 Establecer nueva contraseña
**POST** `/auth/recupera_pass_new_pass`

Permite establecer una nueva contraseña usando el código de recuperación recibido por email.

#### Headers
```
Content-Type: application/json
```

#### Body de Request (ejemplo)
```json
{
  "email": "usuario@dominio.com",
  "code": "ABC123",
  "pass_0": "nuevaPassword",
  "pass_1": "nuevaPassword"
}
```

#### Respuesta Exitosa (200)
```json
{
  "r": true
}
```

#### Respuesta de Error (400)
```json
{
  "r": false,
  "error": "Falta de credenciales"
}
```

#### Respuesta de Error (200) - Contraseñas no coinciden, código inválido o expirado
```json
{
  "r": false
}
```

#### Respuesta de Error (500)
```json
{
  "r": false,
  "error": "Error interno del servidor"
}
```

#### Características del Endpoint
- **Autenticación**: No requerida
- **Permisos**: Público
- **Validación**: Email, código y contraseñas válidas, código no expirado
- **Transaccional**: Sí (actualiza contraseña y limpia token)
- **Rate Limiting**: Según configuración global

---

[Navegación: Volver al inicio](#endpoints---nodejs-api)
