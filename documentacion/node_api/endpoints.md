# Endpoints - Node.js API

## Documentación Completa de Endpoints

Esta documentación describe todos los endpoints disponibles en la API Node.js del sistema GFC-Back, incluyendo parámetros, respuestas y ejemplos de uso.

## Información General

### Base URL
```
https://api.gfc-back.com/node
```

### Autenticación
La mayoría de endpoints requieren autenticación mediante JWT Bearer Token:
```
Authorization: Bearer <your_jwt_token>
```

### Formatos de Respuesta
- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Timezone**: UTC

---

## 1. Autenticación

### 1.1 Login de Usuario
**POST** `/auth/login`

Autentica un usuario y devuelve un token JWT.

#### Parámetros
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "role": "participant"
    }
  },
  "message": "Login exitoso"
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

Ejecuta el comando PHP para recalcular el ranking de usuarios. Este endpoint ejecuta el comando `php8.1 yii actualizar-ranking/index` en el directorio del servidor PHP.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Ranking recalculado exitosamente",
  "output": "Salida del comando PHP ejecutado"
}
```

#### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores"
}
```

#### Respuesta de Error (408)
```json
{
  "success": false,
  "message": "Timeout: El comando tardó demasiado en ejecutarse"
}
```

#### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error al ejecutar el comando de actualización de ranking",
  "error": "Detalles del error"
}
```

#### Características del Endpoint
- **Autenticación**: Requerida (solo rol `admin`)
- **Timeout**: 5 minutos máximo de ejecución
- **Comando**: Ejecuta `php8.1 yii actualizar-ranking/index` en `/var/www/gfc.prod-api.greenborn.com.ar`
- **Logging**: Registra inicio y resultado de la ejecución
- **Manejo de errores**: Captura errores de Node.js y del comando PHP

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
      "email": "contacto@portal.com"
    },
    {
      "id": 2,
      "name": "Juarez Fotoclub",
      "description": "Club de Juarez",
      "facebook": "facebook.com/juarez",
      "instagram": "@juarez",
      "email": "contacto@juarez.com"
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

### 10.2 Editar un fotoclub
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
  "email": "nuevo@club.com"
}
```

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
- **Autenticación**: Requerida (usuario autenticado)
- **Permisos**: Requiere permisos de edición (writeProtection)
- **Validación**: El campo 'name' es obligatorio
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