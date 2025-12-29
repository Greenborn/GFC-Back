# Endpoints: Contest Records (contests_records)

## Descripción
Endpoints CRUD para gestionar registros de la tabla `contests_records`. Esta tabla almacena enlaces y objetos JSON asociados a concursos específicos.

## Base URL
```
https://gfc.prod-api.greenborn.com.ar/api
```

## Seguridad
- **Autenticación**: Todos los endpoints requieren token Bearer
- **Permisos de lectura**: Todos los usuarios autenticados
- **Permisos de escritura**: Solo administradores (`role_id == '1'`)

---

## 1. Listar Contest Records

### Endpoint
**GET** `/api/contest-record`

### Descripción
Obtiene una lista paginada de registros de `contests_records`, con opción de filtrar por concurso.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción | Valor por defecto |
|-----------|------|-----------|-------------|-------------------|
| `page` | integer | No | Número de página | 1 |
| `per-page` | integer | No | Elementos por página | 20 |
| `sort` | string | No | Campo de ordenamiento. Usar `-` para descendente | `-id` |
| `filter[contest_id]` | integer | No | Filtrar por ID de concurso | - |

### Ejemplo de Solicitud
```bash
curl -X GET "https://gfc.prod-api.greenborn.com.ar/api/contest-record?page=1&per-page=10&filter[contest_id]=36" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a"
```

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 1,
      "url": "https://example.com/resultado.json",
      "object": "{\"key\": \"value\"}",
      "contest_id": 36
    },
    {
      "id": 2,
      "url": null,
      "object": "{\"data\": \"test\"}",
      "contest_id": 36
    }
  ],
  "_meta": {
    "totalCount": 25,
    "pageCount": 3,
    "currentPage": 1,
    "perPage": 10
  }
}
```

### Respuesta de Error (500)
```json
{
  "message": "Error al obtener registros",
  "error": "Mensaje de error detallado"
}
```

---

## 2. Obtener Contest Record por ID

### Endpoint
**GET** `/api/contest-record/:id`

### Descripción
Obtiene los detalles de un registro específico de `contests_records`.

### Headers
```
Authorization: Bearer <access_token>
```

### Path Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del registro |

### Ejemplo de Solicitud
```bash
curl -X GET "https://gfc.prod-api.greenborn.com.ar/api/contest-record/1" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a"
```

### Respuesta Exitosa (200)
```json
{
  "id": 1,
  "url": "https://example.com/resultado.json",
  "object": "{\"key\": \"value\"}",
  "contest_id": 36
}
```

### Respuesta de Error (400)
```json
{
  "message": "ID inválido"
}
```

### Respuesta de Error (404)
```json
{
  "message": "Registro no encontrado"
}
```

---

## 3. Crear Contest Record

### Endpoint
**POST** `/api/contest-record`

### Descripción
Crea un nuevo registro en `contests_records`. Solo administradores pueden crear registros.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Permisos
- Solo usuarios con `role_id == '1'` (administradores)

### Body Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso asociado |
| `url` | string | No | URL del recurso externo (max 255 caracteres) |
| `object` | string/text | No | Objeto JSON serializado u otro contenido |

### Ejemplo de Solicitud
```bash
curl -X POST "https://gfc.prod-api.greenborn.com.ar/api/contest-record" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a" \
  -H "Content-Type: application/json" \
  -d '{
    "contest_id": 36,
    "url": "https://example.com/resultado.json",
    "object": "{\"premio\": \"Primer Premio\", \"categoria\": \"Color\"}"
  }'
```

### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Registro creado exitosamente",
  "data": {
    "id": 3,
    "url": "https://example.com/resultado.json",
    "object": "{\"premio\": \"Primer Premio\", \"categoria\": \"Color\"}",
    "contest_id": 36
  }
}
```

### Respuesta de Error (400)
```json
{
  "message": "El campo contest_id es requerido"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden crear registros"
}
```

### Respuesta de Error (404)
```json
{
  "message": "El concurso especificado no existe"
}
```

---

## 4. Actualizar Contest Record (Completo)

### Endpoint
**PUT** `/api/contest-record/:id`

### Descripción
Actualiza todos los campos de un registro existente. Requiere enviar todos los campos. Solo administradores pueden actualizar registros.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Permisos
- Solo usuarios con `role_id == '1'` (administradores)

### Path Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del registro a actualizar |

### Body Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso asociado |
| `url` | string | No | URL del recurso externo |
| `object` | string/text | No | Objeto JSON serializado |

### Ejemplo de Solicitud
```bash
curl -X PUT "https://gfc.prod-api.greenborn.com.ar/api/contest-record/3" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a" \
  -H "Content-Type: application/json" \
  -d '{
    "contest_id": 36,
    "url": "https://example.com/resultado_actualizado.json",
    "object": "{\"premio\": \"Segundo Premio\", \"categoria\": \"Blanco y Negro\"}"
  }'
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Registro actualizado exitosamente",
  "data": {
    "id": 3,
    "url": "https://example.com/resultado_actualizado.json",
    "object": "{\"premio\": \"Segundo Premio\", \"categoria\": \"Blanco y Negro\"}",
    "contest_id": 36
  }
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden actualizar registros"
}
```

### Respuesta de Error (404)
```json
{
  "message": "Registro no encontrado"
}
```

---

## 5. Actualizar Contest Record (Parcial)

### Endpoint
**PATCH** `/api/contest-record/:id`

### Descripción
Actualiza parcialmente un registro existente. Solo se actualizan los campos enviados. Solo administradores pueden actualizar registros.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Permisos
- Solo usuarios con `role_id == '1'` (administradores)

### Path Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del registro a actualizar |

### Body Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | No | ID del concurso asociado |
| `url` | string | No | URL del recurso externo |
| `object` | string/text | No | Objeto JSON serializado |

### Ejemplo de Solicitud
```bash
curl -X PATCH "https://gfc.prod-api.greenborn.com.ar/api/contest-record/3" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/nuevo_url.json"
  }'
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Registro actualizado exitosamente",
  "data": {
    "id": 3,
    "url": "https://example.com/nuevo_url.json",
    "object": "{\"premio\": \"Segundo Premio\", \"categoria\": \"Blanco y Negro\"}",
    "contest_id": 36
  }
}
```

### Respuesta de Error (400)
```json
{
  "message": "No se proporcionaron campos para actualizar"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden actualizar registros"
}
```

---

## 6. Eliminar Contest Record

### Endpoint
**DELETE** `/api/contest-record/:id`

### Descripción
Elimina un registro de `contests_records`. Solo administradores pueden eliminar registros.

### Headers
```
Authorization: Bearer <access_token>
```

### Permisos
- Solo usuarios con `role_id == '1'` (administradores)

### Path Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del registro a eliminar |

### Ejemplo de Solicitud
```bash
curl -X DELETE "https://gfc.prod-api.greenborn.com.ar/api/contest-record/3" \
  -H "Authorization: Bearer yeCk1wTui-819R7E1LkWVamHsohSns_a"
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Registro eliminado exitosamente"
}
```

### Respuesta de Error (400)
```json
{
  "message": "ID inválido"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden eliminar registros"
}
```

### Respuesta de Error (404)
```json
{
  "message": "Registro no encontrado"
}
```

---

## Estructura de la Tabla

### contests_records
| Campo | Tipo | Nulo | Descripción |
|-------|------|------|-------------|
| `id` | SERIAL | No | ID auto-incremental (PK) |
| `url` | VARCHAR(255) | Sí | URL de recurso externo |
| `object` | TEXT | Sí | Objeto JSON u otro contenido de texto |
| `contest_id` | INTEGER | No | ID del concurso (FK a `contest.id`) |

### Relaciones
- `contest_id` → `contest.id` (FK)

---

## Notas Técnicas

### Validaciones
- El campo `contest_id` debe existir en la tabla `contest`
- El campo `url` tiene límite de 255 caracteres
- Los campos `url` y `object` pueden ser `null`

### Logging
Todas las operaciones (crear, actualizar, eliminar) se registran en la tabla `log_operaciones` con:
- Usuario que realizó la acción
- Tipo de operación
- Datos relevantes (ID, contest_id, etc.)
- Timestamp de la operación

### Protección de Escritura
Los endpoints de modificación (POST, PUT, PATCH, DELETE) están protegidos por:
1. Middleware de autenticación (`authMiddleware`)
2. Middleware de protección de escritura (`writeProtection`)
3. Validación de rol de administrador

---

## Ejemplos de Uso Completos

### Crear un registro para un concurso
```bash
# 1. Autenticarse
curl -X POST "https://gfc.prod-api.greenborn.com.ar/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'

# 2. Crear registro
curl -X POST "https://gfc.prod-api.greenborn.com.ar/api/contest-record" \
  -H "Authorization: Bearer TOKEN_RECIBIDO" \
  -H "Content-Type: application/json" \
  -d '{
    "contest_id": 51,
    "url": "https://gfc-assets.com/resultados/concurso_51.json",
    "object": "{\"temporada\": 2025, \"tipo\": \"interno\"}"
  }'
```

### Listar registros de un concurso específico
```bash
curl -X GET "https://gfc.prod-api.greenborn.com.ar/api/contest-record?filter[contest_id]=51&page=1&per-page=20" \
  -H "Authorization: Bearer TOKEN"
```

### Actualizar solo la URL de un registro
```bash
curl -X PATCH "https://gfc.prod-api.greenborn.com.ar/api/contest-record/5" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://gfc-assets.com/resultados/concurso_51_updated.json"
  }'
```

### Eliminar un registro
```bash
curl -X DELETE "https://gfc.prod-api.greenborn.com.ar/api/contest-record/5" \
  -H "Authorization: Bearer TOKEN"
```
