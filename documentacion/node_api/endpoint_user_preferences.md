# User Preferences — Preferencias de Usuario

Endpoints para gestionar preferencias clave-valor por usuario. Cada preferencia debe estar definida como propiedad permitida en `user_preferences_meta` antes de poder guardarse.

## Base URL

```
https://gfc.prod-api.greenborn.com.ar/api/user
```

## Autenticación

Todos los endpoints requieren **Bearer Token** (authMiddleware):

```
Authorization: Bearer <token>
```

---

## 1. Obtener todas las preferencias

**GET** `/api/user/preferences`

Devuelve un objeto con todas las preferencias del usuario autenticado.

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "notifications_enabled": true,
    "language": "es"
  }
}
```

### Respuesta de Error (401)

```json
{
  "success": false,
  "message": "Token de autenticación requerido"
}
```

---

## 2. Obtener una preferencia específica

**GET** `/api/user/preferences/:key`

### Parámetros de URL

- `key` (string): Clave de la preferencia (ej: `theme`)

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "theme": "dark"
  }
}
```

### Respuesta de Error (404)

```json
{
  "success": false,
  "message": "Preferencia no encontrada"
}
```

---

## 3. Guardar preferencias (crear o actualizar)

**PUT** `/api/user/preferences`

Crea o actualiza una o varias preferencias. Usa upsert (INSERT ... ON CONFLICT DO UPDATE).

El valor puede ser texto plano o JSON. Si se envía un objeto, se serializa automáticamente.

### Validación

Todas las claves deben existir en `user_preferences_meta`. Si alguna clave no está permitida, se rechaza toda la operación.

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "theme": "dark",
  "notifications_enabled": true,
  "language": "es",
  "filters": {
    "category": "Primera",
    "section": "Color"
  }
}
```

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "notifications_enabled": true,
    "language": "es",
    "filters": {
      "category": "Primera",
      "section": "Color"
    }
  }
}
```

### Respuesta de Error (400) — Claves no permitidas

```json
{
  "success": false,
  "message": "Las siguientes claves no son propiedades permitidas",
  "invalid_keys": ["unknown_key"]
}
```

---

## 4. Eliminar una preferencia

**DELETE** `/api/user/preferences/:key`

### Parámetros de URL

- `key` (string): Clave de la preferencia a eliminar

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Preferencia eliminada"
}
```

### Respuesta de Error (404)

```json
{
  "success": false,
  "message": "Preferencia no encontrada"
}
```

---

## Tablas

### user_preferences

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer PK` | ID autoincremental |
| `user_id` | `integer FK` | ID del usuario (`user.id`) |
| `key` | `varchar(100)` | Clave de preferencia |
| `value` | `text` | Valor (texto o JSON serializado) |
| `created_at` | `datetime` | Fecha de creación |
| `updated_at` | `datetime` | Fecha de última actualización |

Unique: `(user_id, key)`

### user_preferences_meta

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer PK` | ID autoincremental |
| `key` | `varchar(100) UNIQUE` | Clave de propiedad permitida |
| `description` | `text` | Descripción de la propiedad |
| `value_type` | `varchar(50)` | Tipo esperado (`string`, `number`, `boolean`, `json`) |
| `created_at` | `datetime` | Fecha de creación |

---

## Ejemplos de uso

### cURL

```bash
# Obtener todas las preferencias
curl -H "Authorization: Bearer <token>" \
  "https://gfc.prod-api.greenborn.com.ar/api/user/preferences"

# Guardar preferencias
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","language":"es"}' \
  "https://gfc.prod-api.greenborn.com.ar/api/user/preferences"

# Obtener una preferencia
curl -H "Authorization: Bearer <token>" \
  "https://gfc.prod-api.greenborn.com.ar/api/user/preferences/theme"

# Eliminar una preferencia
curl -X DELETE -H "Authorization: Bearer <token>" \
  "https://gfc.prod-api.greenborn.com.ar/api/user/preferences/theme"
```

### JavaScript (axios)

```js
const api = axios.create({
  baseURL: 'https://gfc.prod-api.greenborn.com.ar/api',
  headers: { Authorization: `Bearer ${token}` }
});

// Guardar
await api.put('/user/preferences', { theme: 'dark', language: 'es' });

// Obtener todas
const { data } = await api.get('/user/preferences');

// Obtener una
const { data } = await api.get('/user/preferences/theme');

// Eliminar
await api.delete('/user/preferences/theme');
```

---

## Migraciones

Las tablas se crean automáticamente al iniciar el servidor:

| Archivo | Descripción |
|---------|-------------|
| `270722_create_user_preferences_table.js` | Tabla `user_preferences` |
| `270723_create_user_preferences_meta_table.js` | Tabla `user_preferences_meta` |

---

[Navegación: Volver a Endpoints](endpoints.md)
