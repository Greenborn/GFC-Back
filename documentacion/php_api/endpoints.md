# Endpoints - PHP API

## Documentación Completa de Endpoints

Esta documentación describe todos los endpoints disponibles en la API PHP del sistema GFC-Back, incluyendo parámetros, respuestas y ejemplos de uso.

## Información General

### Base URL
```
https://api.gfc-back.com/v1
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
      "role": "participant",
      "profile": {
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  },
  "message": "Login exitoso"
}
```

#### Respuesta de Error (401)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credenciales inválidas"
  }
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
  "password": "secure_password",
  "password_confirmation": "secure_password",
  "first_name": "John",
  "last_name": "Doe"
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

### 1.5 Recuperar Contraseña
**POST** `/auth/forgot-password`

Envía un email para recuperar la contraseña.

#### Parámetros
```json
{
  "email": "user@example.com"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Email de recuperación enviado"
}
```

### 1.6 Resetear Contraseña
**POST** `/auth/reset-password`

Resetea la contraseña usando el token de recuperación.

#### Parámetros
```json
{
  "token": "reset_token_here",
  "password": "new_password",
  "password_confirmation": "new_password"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### 1.7 Verificar Email
**POST** `/auth/verify-email`

Verifica el email del usuario usando el token de verificación.

#### Parámetros
```json
{
  "token": "verification_token_here"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Email verificado exitosamente"
}
```

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
        "created_at": "2024-01-01T00:00:00Z",
        "profile": {
          "first_name": "John",
          "last_name": "Doe"
        }
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
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z",
    "profile": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "bio": "Fotógrafo aficionado",
      "website": "https://johndoe.com",
      "phone": "+1234567890",
      "city": "New York",
      "country": "USA",
      "profile_image": "uploads/profiles/john_doe.jpg"
    }
  }
}
```

### 2.3 Crear Usuario
**POST** `/users`

Crea un nuevo usuario (solo administradores).

#### Parámetros
```json
{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "secure_password",
  "role": "participant",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "new_user",
    "email": "newuser@example.com",
    "role": "participant",
    "status": "active"
  },
  "message": "Usuario creado exitosamente"
}
```

### 2.4 Actualizar Usuario
**PUT** `/users/{id}`

Actualiza los datos de un usuario.

#### Parámetros
```json
{
  "username": "updated_username",
  "email": "updated@example.com",
  "role": "judge"
}
```

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
    "username": "updated_username",
    "email": "updated@example.com",
    "role": "judge"
  },
  "message": "Usuario actualizado exitosamente"
}
```

### 2.5 Eliminar Usuario
**DELETE** `/users/{id}`

Elimina un usuario del sistema.

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

### 2.6 Obtener Perfil de Usuario
**GET** `/users/{id}/profile`

Obtiene el perfil completo de un usuario.

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
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Fotógrafo aficionado con 5 años de experiencia",
    "website": "https://johndoe.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "profile_image": "uploads/profiles/john_doe.jpg",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2.7 Actualizar Perfil de Usuario
**PUT** `/users/{id}/profile`

Actualiza el perfil de un usuario.

#### Parámetros
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Fotógrafo profesional",
  "website": "https://johndoe.com",
  "phone": "+1234567890",
  "city": "New York",
  "country": "USA"
}
```

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
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Fotógrafo profesional",
    "website": "https://johndoe.com",
    "phone": "+1234567890",
    "city": "New York",
    "country": "USA"
  },
  "message": "Perfil actualizado exitosamente"
}
```

## 3. Concursos

### 3.1 Obtener Lista de Concursos
**GET** `/contests`

Obtiene una lista paginada de concursos.

#### Query Parameters
- `page` (int): Número de página (default: 1)
- `limit` (int): Elementos por página (default: 20, max: 100)
- `status` (string): Filtrar por estado (draft, active, closed, archived)
- `search` (string): Búsqueda por título
- `public` (boolean): Solo concursos públicos

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
        "description": "Concurso anual de fotografía...",
        "start_date": "2024-01-01",
        "end_date": "2024-03-31",
        "registration_deadline": "2024-02-28",
        "status": "active",
        "is_public": true,
        "created_at": "2024-01-01T00:00:00Z",
        "categories_count": 5,
        "participants_count": 150
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
    "description": "Concurso anual de fotografía...",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "registration_deadline": "2024-02-28",
    "max_photos_per_user": 10,
    "max_photos_per_section": 3,
    "status": "active",
    "is_public": true,
    "rules": "Reglas del concurso...",
    "prizes": "Premios disponibles...",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "creator": {
      "id": 1,
      "username": "admin",
      "profile": {
        "first_name": "Admin",
        "last_name": "User"
      }
    },
    "categories": [
      {
        "id": 1,
        "name": "Paisaje",
        "description": "Fotografías de paisajes naturales",
        "sections_count": 3
      }
    ],
    "statistics": {
      "total_participants": 150,
      "total_photos": 450,
      "categories_count": 5,
      "sections_count": 15
    }
  }
}
```

### 3.3 Crear Concurso
**POST** `/contests`

Crea un nuevo concurso.

#### Parámetros
```json
{
  "title": "Nuevo Concurso de Fotografía",
  "subtitle": "Tema libre",
  "description": "Descripción del concurso...",
  "start_date": "2024-02-01",
  "end_date": "2024-04-30",
  "registration_deadline": "2024-03-15",
  "max_photos_per_user": 10,
  "max_photos_per_section": 3,
  "is_public": true,
  "rules": "Reglas del concurso...",
  "prizes": "Premios disponibles..."
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Nuevo Concurso de Fotografía",
    "status": "draft",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Concurso creado exitosamente"
}
```

### 3.4 Actualizar Concurso
**PUT** `/contests/{id}`

Actualiza los datos de un concurso.

#### Parámetros
```json
{
  "title": "Concurso Actualizado",
  "description": "Nueva descripción...",
  "end_date": "2024-05-31",
  "status": "active"
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Concurso Actualizado",
    "status": "active"
  },
  "message": "Concurso actualizado exitosamente"
}
```

### 3.5 Eliminar Concurso
**DELETE** `/contests/{id}`

Elimina un concurso.

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Concurso eliminado exitosamente"
}
```

### 3.6 Obtener Categorías de Concurso
**GET** `/contests/{id}/categories`

Obtiene todas las categorías de un concurso específico.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paisaje",
      "description": "Fotografías de paisajes naturales",
      "max_photos": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "sections": [
        {
          "id": 1,
          "name": "Paisaje Urbano",
          "description": "Paisajes de ciudades",
          "max_photos": 3
        }
      ]
    }
  ]
}
```

### 3.7 Obtener Resultados de Concurso
**GET** `/contests/{id}/results`

Obtiene todos los resultados de un concurso.

#### Query Parameters
- `section_id` (int): Filtrar por sección
- `user_id` (int): Filtrar por usuario
- `status` (string): Filtrar por estado
- `sort` (string): Ordenar por (score, position, submitted_at)

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contest_id": 1,
      "user_id": 1,
      "section_id": 1,
      "photo_title": "Amanecer en la ciudad",
      "photo_description": "Captura del amanecer...",
      "file_path": "uploads/photos/photo1.jpg",
      "thumbnail_path": "uploads/thumbnails/photo1.jpg",
      "score": 8.5,
      "position": 1,
      "status": "winner",
      "submitted_at": "2024-02-15T10:30:00Z",
      "evaluated_at": "2024-03-01T15:00:00Z",
      "user": {
        "username": "john_doe",
        "profile": {
          "first_name": "John",
          "last_name": "Doe"
        }
      },
      "section": {
        "name": "Paisaje Urbano",
        "category": {
          "name": "Paisaje"
        }
      }
    }
  ]
}
```

### 3.8 Obtener Estadísticas de Concurso
**GET** `/contests/{id}/statistics`

Obtiene estadísticas detalladas de un concurso.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "contest": {
      "id": 1,
      "title": "Concurso de Fotografía 2024"
    },
    "general": {
      "total_participants": 150,
      "total_photos": 450,
      "categories_count": 5,
      "sections_count": 15,
      "average_score": 7.2,
      "submission_rate": 85.5
    },
    "by_category": [
      {
        "category_id": 1,
        "category_name": "Paisaje",
        "participants": 45,
        "photos": 135,
        "average_score": 7.8
      }
    ],
    "by_section": [
      {
        "section_id": 1,
        "section_name": "Paisaje Urbano",
        "participants": 30,
        "photos": 90,
        "average_score": 8.1
      }
    ],
    "top_winners": [
      {
        "user_id": 1,
        "username": "john_doe",
        "total_wins": 3,
        "average_score": 8.5
      }
    ]
  }
}
```

## 4. Categorías

### 4.1 Obtener Lista de Categorías
**GET** `/categories`

Obtiene una lista de todas las categorías.

#### Query Parameters
- `contest_id` (int): Filtrar por concurso
- `search` (string): Búsqueda por nombre

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paisaje",
      "description": "Fotografías de paisajes naturales",
      "contest_id": 1,
      "max_photos": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "contest": {
        "title": "Concurso de Fotografía 2024"
      },
      "sections_count": 3
    }
  ]
}
```

### 4.2 Obtener Categoría por ID
**GET** `/categories/{id}`

Obtiene los detalles de una categoría específica.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Paisaje",
    "description": "Fotografías de paisajes naturales",
    "contest_id": 1,
    "max_photos": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "contest": {
      "id": 1,
      "title": "Concurso de Fotografía 2024"
    },
    "sections": [
      {
        "id": 1,
        "name": "Paisaje Urbano",
        "description": "Paisajes de ciudades",
        "max_photos": 3
      }
    ]
  }
}
```

### 4.3 Crear Categoría
**POST** `/categories`

Crea una nueva categoría.

#### Parámetros
```json
{
  "name": "Retrato",
  "description": "Fotografías de retratos",
  "contest_id": 1,
  "max_photos": 3
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Retrato",
    "contest_id": 1
  },
  "message": "Categoría creada exitosamente"
}
```

### 4.4 Actualizar Categoría
**PUT** `/categories/{id}`

Actualiza una categoría existente.

#### Parámetros
```json
{
  "name": "Retrato Artístico",
  "description": "Retratos con enfoque artístico",
  "max_photos": 5
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Retrato Artístico",
    "max_photos": 5
  },
  "message": "Categoría actualizada exitosamente"
}
```

### 4.5 Eliminar Categoría
**DELETE** `/categories/{id}`

Elimina una categoría.

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente"
}
```

### 4.6 Obtener Secciones de Categoría
**GET** `/categories/{id}/sections`

Obtiene todas las secciones de una categoría.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paisaje Urbano",
      "description": "Paisajes de ciudades",
      "max_photos": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "results_count": 45
    }
  ]
}
```

## 5. Secciones

### 5.1 Obtener Lista de Secciones
**GET** `/sections`

Obtiene una lista de todas las secciones.

#### Query Parameters
- `category_id` (int): Filtrar por categoría
- `contest_id` (int): Filtrar por concurso
- `search` (string): Búsqueda por nombre

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Paisaje Urbano",
      "description": "Paisajes de ciudades",
      "category_id": 1,
      "max_photos": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "category": {
        "name": "Paisaje",
        "contest": {
          "title": "Concurso de Fotografía 2024"
        }
      },
      "results_count": 45
    }
  ]
}
```

### 5.2 Obtener Sección por ID
**GET** `/sections/{id}`

Obtiene los detalles de una sección específica.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Paisaje Urbano",
    "description": "Paisajes de ciudades",
    "category_id": 1,
    "max_photos": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "category": {
      "id": 1,
      "name": "Paisaje",
      "contest": {
        "id": 1,
        "title": "Concurso de Fotografía 2024"
      }
    },
    "statistics": {
      "total_participants": 45,
      "total_photos": 135,
      "average_score": 7.8,
      "winners_count": 3
    }
  }
}
```

### 5.3 Crear Sección
**POST** `/sections`

Crea una nueva sección.

#### Parámetros
```json
{
  "name": "Retrato Callejero",
  "description": "Retratos tomados en la calle",
  "category_id": 2,
  "max_photos": 3
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Retrato Callejero",
    "category_id": 2
  },
  "message": "Sección creada exitosamente"
}
```

### 5.4 Actualizar Sección
**PUT** `/sections/{id}`

Actualiza una sección existente.

#### Parámetros
```json
{
  "name": "Retrato Urbano",
  "description": "Retratos en entorno urbano",
  "max_photos": 5
}
```

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Retrato Urbano",
    "max_photos": 5
  },
  "message": "Sección actualizada exitosamente"
}
```

### 5.5 Eliminar Sección
**DELETE** `/sections/{id}`

Elimina una sección.

#### Headers
```
Authorization: Bearer <admin_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Sección eliminada exitosamente"
}
```

### 5.6 Obtener Resultados de Sección
**GET** `/sections/{id}/results`

Obtiene todos los resultados de una sección específica.

#### Query Parameters
- `sort` (string): Ordenar por (score, position, submitted_at)
- `status` (string): Filtrar por estado

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contest_id": 1,
      "user_id": 1,
      "section_id": 1,
      "photo_title": "Amanecer en la ciudad",
      "photo_description": "Captura del amanecer...",
      "file_path": "uploads/photos/photo1.jpg",
      "thumbnail_path": "uploads/thumbnails/photo1.jpg",
      "score": 8.5,
      "position": 1,
      "status": "winner",
      "submitted_at": "2024-02-15T10:30:00Z",
      "user": {
        "username": "john_doe",
        "profile": {
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    }
  ]
}
```

## 6. Resultados

### 6.1 Obtener Lista de Resultados
**GET** `/results`

Obtiene una lista paginada de resultados.

#### Query Parameters
- `page` (int): Número de página (default: 1)
- `limit` (int): Elementos por página (default: 20, max: 100)
- `contest_id` (int): Filtrar por concurso
- `user_id` (int): Filtrar por usuario
- `section_id` (int): Filtrar por sección
- `status` (string): Filtrar por estado
- `sort` (string): Ordenar por (score, position, submitted_at)

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "contest_id": 1,
        "user_id": 1,
        "section_id": 1,
        "photo_title": "Amanecer en la ciudad",
        "score": 8.5,
        "position": 1,
        "status": "winner",
        "submitted_at": "2024-02-15T10:30:00Z",
        "user": {
          "username": "john_doe",
          "profile": {
            "first_name": "John",
            "last_name": "Doe"
          }
        },
        "section": {
          "name": "Paisaje Urbano",
          "category": {
            "name": "Paisaje"
          }
        }
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

### 6.2 Obtener Resultado por ID
**GET** `/results/{id}`

Obtiene los detalles completos de un resultado.

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
    "contest_id": 1,
    "user_id": 1,
    "section_id": 1,
    "photo_title": "Amanecer en la ciudad",
    "photo_description": "Captura del amanecer en el centro de la ciudad...",
    "file_path": "uploads/photos/photo1.jpg",
    "thumbnail_path": "uploads/thumbnails/photo1.jpg",
    "score": 8.5,
    "position": 1,
    "status": "winner",
    "submitted_at": "2024-02-15T10:30:00Z",
    "evaluated_at": "2024-03-01T15:00:00Z",
    "evaluated_by": 2,
    "comments": "Excelente composición y uso de la luz",
    "user": {
      "id": 1,
      "username": "john_doe",
      "profile": {
        "first_name": "John",
        "last_name": "Doe"
      }
    },
    "section": {
      "id": 1,
      "name": "Paisaje Urbano",
      "category": {
        "id": 1,
        "name": "Paisaje"
      }
    },
    "contest": {
      "id": 1,
      "title": "Concurso de Fotografía 2024"
    },
    "evaluator": {
      "username": "judge1",
      "profile": {
        "first_name": "Judge",
        "last_name": "User"
      }
    }
  }
}
```

### 6.3 Crear Resultado
**POST** `/results`

Envía una nueva fotografía para un concurso.

#### Parámetros (multipart/form-data)
- `contest_id` (int): ID del concurso
- `section_id` (int): ID de la sección
- `photo_title` (string): Título de la fotografía
- `photo_description` (string): Descripción de la fotografía
- `photo` (file): Archivo de imagen

#### Headers
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 2,
    "contest_id": 1,
    "section_id": 1,
    "photo_title": "Nueva fotografía",
    "status": "submitted",
    "submitted_at": "2024-02-15T10:30:00Z"
  },
  "message": "Fotografía enviada exitosamente"
}
```

### 6.4 Actualizar Resultado
**PUT** `/results/{id}`

Actualiza los datos de un resultado.

#### Parámetros
```json
{
  "photo_title": "Título actualizado",
  "photo_description": "Descripción actualizada"
}
```

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
    "photo_title": "Título actualizado",
    "photo_description": "Descripción actualizada"
  },
  "message": "Resultado actualizado exitosamente"
}
```

### 6.5 Eliminar Resultado
**DELETE** `/results/{id}`

Elimina un resultado.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Resultado eliminado exitosamente"
}
```

### 6.6 Evaluar Resultado
**POST** `/results/{id}/evaluate`

Evalúa una fotografía (solo jueces).

#### Parámetros
```json
{
  "score": 8.5,
  "comments": "Excelente composición y uso de la luz",
  "status": "approved"
}
```

#### Headers
```
Authorization: Bearer <judge_token>
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "score": 8.5,
    "status": "approved",
    "evaluated_at": "2024-03-01T15:00:00Z"
  },
  "message": "Fotografía evaluada exitosamente"
}
```

### 6.7 Obtener Resultados por Concurso
**GET** `/results/contest/{contest_id}`

Obtiene todos los resultados de un concurso específico.

#### Query Parameters
- `section_id` (int): Filtrar por sección
- `user_id` (int): Filtrar por usuario
- `status` (string): Filtrar por estado
- `sort` (string): Ordenar por

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "section_id": 1,
      "photo_title": "Amanecer en la ciudad",
      "score": 8.5,
      "position": 1,
      "status": "winner",
      "user": {
        "username": "john_doe",
        "profile": {
          "first_name": "John",
          "last_name": "Doe"
        }
      },
      "section": {
        "name": "Paisaje Urbano",
        "category": {
          "name": "Paisaje"
        }
      }
    }
  ]
}
```

### 6.8 Obtener Resultados por Usuario
**GET** `/results/user/{user_id}`

Obtiene todos los resultados de un usuario específico.

#### Query Parameters
- `contest_id` (int): Filtrar por concurso
- `status` (string): Filtrar por estado
- `sort` (string): Ordenar por

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contest_id": 1,
      "section_id": 1,
      "photo_title": "Amanecer en la ciudad",
      "score": 8.5,
      "position": 1,
      "status": "winner",
      "submitted_at": "2024-02-15T10:30:00Z",
      "contest": {
        "title": "Concurso de Fotografía 2024"
      },
      "section": {
        "name": "Paisaje Urbano",
        "category": {
          "name": "Paisaje"
        }
      }
    }
  ]
}
```

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
  "CATEGORY_NOT_FOUND": "Categoría no encontrada",
  "SECTION_NOT_FOUND": "Sección no encontrada",
  "RESULT_NOT_FOUND": "Resultado no encontrado",
  "PERMISSION_DENIED": "Permisos insuficientes",
  "FILE_TOO_LARGE": "Archivo demasiado grande",
  "INVALID_FILE_TYPE": "Tipo de archivo no permitido",
  "CONTEST_CLOSED": "Concurso cerrado",
  "MAX_PHOTOS_REACHED": "Límite de fotografías alcanzado",
  "EMAIL_ALREADY_EXISTS": "Email ya registrado",
  "USERNAME_ALREADY_EXISTS": "Nombre de usuario ya existe"
}
```

## 8. Ejemplos de Uso

### 8.1 Flujo Completo de Participación
1. **Registro de usuario**
   ```bash
   POST /auth/register
   ```

2. **Verificación de email**
   ```bash
   POST /auth/verify-email
   ```

3. **Login**
   ```bash
   POST /auth/login
   ```

4. **Obtener concursos disponibles**
   ```bash
   GET /contests?status=active
   ```

5. **Obtener categorías y secciones**
   ```bash
   GET /contests/{id}/categories
   ```

6. **Enviar fotografía**
   ```bash
   POST /results
   ```

7. **Ver resultados**
   ```bash
   GET /results/user/{user_id}
   ```

### 8.2 Flujo de Administración
1. **Login como administrador**
   ```bash
   POST /auth/login
   ```

2. **Crear concurso**
   ```bash
   POST /contests
   ```

3. **Crear categorías**
   ```bash
   POST /categories
   ```

4. **Crear secciones**
   ```bash
   POST /sections
   ```

5. **Evaluar fotografías**
   ```bash
   POST /results/{id}/evaluate
   ```

6. **Ver estadísticas**
   ```bash
   GET /contests/{id}/statistics
   ```

## 9. Rate Limiting

### 9.1 Límites por Endpoint
- **Autenticación**: 5 requests por minuto
- **Registro**: 3 requests por hora
- **Subida de archivos**: 10 requests por hora
- **API general**: 100 requests por minuto

### 9.2 Headers de Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 10. Webhooks (Futuro)

### 10.1 Eventos Disponibles
- `user.registered`: Usuario registrado
- `contest.created`: Concurso creado
- `photo.submitted`: Fotografía enviada
- `photo.evaluated`: Fotografía evaluada
- `contest.closed`: Concurso cerrado

### 10.2 Formato de Webhook
```json
{
  "event": "photo.submitted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "result_id": 1,
    "user_id": 1,
    "contest_id": 1
  }
}
```

---

**Navegación**: [README](README.md) | [Arquitectura](arquitectura.md) | [Definición Técnica](definicion_tecnica.md) | [Volver al README Principal](../../README.md) 