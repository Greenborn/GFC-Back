# Endpoints de Autenticación SSO

Endpoints para integrar el frontend con el sistema de autenticación SSO externo (`auth.greenborn.com.ar`).

## Base URL

```
https://gfc.api2.greenborn.com.ar/api
```

## Flujo de uso desde el frontend

```
1. Usuario inicia sesión con Google → SSO redirige con token temporal
2. Frontend intercambia token temporal por bearer_token (POST /auth/login contra el SSO)
3. Frontend almacena bearer_token y unique_id
4. Frontend consulta GET /user/sso-profile para saber si el usuario ya existe en el backend local
5. Si existe → redirigir a dashboard
6. Si no existe → mostrar formulario de registro/vinculación
7. Una vez registrado, las requests autenticadas usan GET /user/me para obtener datos del perfil
```

---

## 1. Obtener perfil del usuario autenticado

**`GET`** `/user/me`

Devuelve los datos del usuario actual autenticado. Requiere que el token se haya validado previamente (ya sea token local o SSO).

### Headers

```
Authorization: Bearer <bearer_token>
```

### Query Params (solo para tokens SSO)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `unique_id` | string | solo para SSO | ID único de trazabilidad |
| (opcional) `expand` | string | no | Campos adicionales: `profile`, `profile.fotoclub`, `role` |

### Ejemplo de request

```bash
# Token local (sin unique_id)
curl 'https://gfc.api2.greenborn.com.ar/api/user/me' \
  -H 'Authorization: Bearer <token_local>'

# Token SSO (con unique_id)
curl 'https://gfc.api2.greenborn.com.ar/api/user/me?unique_id=req_1719000000_abc123' \
  -H 'Authorization: Bearer <bearer_token_sso>'
```

### Respuesta exitosa (200)

```json
{
  "success": true,
  "user": {
    "id": 4,
    "username": "lucho.2012.tandil",
    "email": "lucho.2012.tandil@gmail.com",
    "role_id": 3,
    "profile_id": 31,
    "status": 1,
    "dni": null,
    "created_at": "2025-06-19T00:00:00.000Z"
  }
}
```

> **Nota:** Los campos sensibles (`password_hash`, `access_token`, `password_reset_token`, `sign_up_verif_code`, `sign_up_verif_token`, `updated_at`) se filtran automáticamente.

### Respuesta con `?expand=profile,profile.fotoclub,role`

```json
{
  "success": true,
  "user": {
    "id": 4,
    "username": "...",
    "email": "...",
    "role_id": 3,
    "profile_id": 31,
    "status": 1,
    "profile": {
      "id": 31,
      "name": "Lucho",
      "last_name": "",
      "fotoclub_id": 1,
      "img_url": null,
      "fotoclub": {
        "id": 1,
        "name": "Testing"
      }
    },
    "role": {
      "id": 3,
      "type": "Concursante"
    }
  }
}
```

### Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 401 | Token ausente o inválido | `{ "success": false, "message": "Token de autenticación requerido" }` |
| 400 | Token SSO sin `unique_id` | `{ "success": false, "message": "unique_id requerido en query param" }` |
| 401 | Token rechazado por SSO | `{ "success": false, "message": "Token inválido" }` |
| 401 | Sesión Google expirada | `{ "success": false, "message": "Sesión expirada", "require_reauth": true }` |
| 500 | SSO no disponible | `{ "success": false, "message": "Error de autenticación" }` |

---

## 2. Buscar usuario local por email SSO (sin crearlo)

**`GET`** `/user/sso-profile`

Consulta el SSO con el bearer_token y `unique_id`, obtiene los datos del usuario SSO, y busca si existe un usuario local con ese email. **No crea ningún registro.**

Ideal para decidir en el frontend si mostrar la pantalla de dashboard o un formulario de registro/vinculación.

### Headers

```
Authorization: Bearer <bearer_token>
```

### Query Params

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `unique_id` | string | **sí** | ID único de trazabilidad (mismo usado en el login SSO) |

### Ejemplo de request

```bash
curl 'https://gfc.api2.greenborn.com.ar/api/user/sso-profile?unique_id=req_1719000000_abc123' \
  -H 'Authorization: Bearer <bearer_token_sso>'
```

### Respuesta — usuario existe (200)

```json
{
  "success": true,
  "exists": true,
  "user": {
    "id": 4,
    "username": "lucho.2012.tandil",
    "email": "lucho.2012.tandil@gmail.com",
    "role_id": 3,
    "profile_id": 31,
    "status": 1,
    "dni": null
  }
}
```

### Respuesta — usuario NO existe (200)

```json
{
  "success": true,
  "exists": false,
  "user": null
}
```

### Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 401 | Token ausente | `{ "success": false, "message": "Token requerido" }` |
| 400 | `unique_id` ausente | `{ "success": false, "message": "unique_id requerido" }` |
| 401 | Token SSO inválido/expirado | `{ "success": false, "message": "Token SSO inválido" }` |
| 500 | Error de conexión con SSO | `{ "success": false, "message": "Error al verificar SSO", "error": {...} }` |

---

## 3. Almacenamiento en frontend

Luego del flujo de login SSO, el frontend debe persistir:

| Dato | Dónde | Propósito |
|------|-------|-----------|
| `bearer_token` | localStorage / sessionStorage | Enviar en header `Authorization` |
| `unique_id` | localStorage / sessionStorage | Enviar como query param `?unique_id=` |
| `user` (opcional) | localStorage / sessionStorage | Cache del perfil del usuario |

### Ejemplo de interceptor Axios

```javascript
// axios-config.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gfc.api2.greenborn.com.ar/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sso_bearer_token');
  const uniqueId = localStorage.getItem('sso_unique_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (uniqueId) {
    config.params = { ...config.params, unique_id: uniqueId };
  }
  return config;
});

// Manejo de sesión expirada
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data?.require_reauth) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Mapeo de datos SSO → DB local

Cuando el middleware valida un token SSO y el usuario no existe localmente, se crean automáticamente estos registros:

| Tabla | Campo SSO | Campo DB |
|-------|-----------|----------|
| `profile` | `name` | `name` |
| `profile` | — | `last_name: ''` |
| `profile` | — | `fotoclub_id: null` |
| `user` | `email` | `email` |
| `user` | `name` | `username` |
| `user` | — | `role_id` ← determinado por `SSO_ROLE_MAP` (default `3` Concursante) |
| `user` | — | `profile_id` ← FK al `profile` creado |
| `user` | — | `status: 1` |

La búsqueda para determinar si el usuario ya existe se hace por **email**.

---

## 5. Roles y permisos

Los usuarios SSO usan el mismo sistema de roles que los usuarios locales. Al crearse se les asigna un `role_id` según el mapeo configurado en la variable de entorno `SSO_ROLE_MAP`.

### Configuración

```env
# .env
# Formato: {"email_exacto": role_id, "*@dominio": role_id}
# 1=Administrador, 2=Delegado, 3=Concursante
SSO_ROLE_MAP={"admin@greenborn.com.ar":1,"*@delegados.gfc.com":2}
```

### Reglas de resolución

1. **Match exacto**: `admin@greenborn.com.ar` → role `1` (Administrador)
2. **Match por dominio** (prefijo `*`): `*@delegados.gfc.com` → cualquier email que termine en `@delegados.gfc.com` obtiene role `2` (Delegado)
3. **Sin match**: se asigna `3` (Concursante) — comportamiento default
4. **Variable no definida o inválida**: se asigna `3` (Concursante)

### Ejemplos

| Email SSO | SSO_ROLE_MAP | role_id asignado |
|-----------|--------------|------------------|
| `admin@greenborn.com.ar` | `{"admin@greenborn.com.ar":1}` | `1` (Admin) |
| `juan@delegados.gfc.com` | `{"*@delegados.gfc.com":2}` | `2` (Delegado) |
| `user@gmail.com` | `{"admin@greenborn.com.ar":1}` | `3` (Concursante, default) |
| `user@gmail.com` | *(no definido)* | `3` (Concursante, default) |

### Permisos en endpoints

Una vez asignado el rol, los permisos funcionan igual que con usuarios locales:

| Rol | Acceso |
|-----|--------|
| `1` (Administrador) | Todos los endpoints, incluyendo adminMiddleware |
| `2` (Delegado) | Gestión de usuarios de su fotoclub, sin acceso admin |
| `3` (Concursante) | Solo su propio perfil y datos públicos |

Si un SSO user necesita un rol distinto al asignado automáticamente, un administrador puede cambiarlo vía `PUT /api/user/:id`.
