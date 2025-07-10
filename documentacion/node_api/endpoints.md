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

## 7. Códigos de Error

### 7.1 Códigos de Estado HTTP
- `200` - OK: Operación exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Datos inválidos
- `401` - Unauthorized: No autenticado
- `403` - Forbidden: No autorizado
- `404` - Not Found: Recurso no encontrado
- `422` - Unprocessable Entity: Validación fallida
- `500` - Internal Server Error: Error del servidor

### 7.2 Códigos de Error Específicos
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

**Navegación**: [README](README.md) | [Arquitectura](arquitectura.md) | [Definición Técnica](definicion_tecnica.md) | [Volver al README Principal](../../README.md) 