# Registro de Usuario

**`POST`** `/auth/register`

Endpoint único para creación de usuarios, compatible con registro tradicional (email+password) y registro post-autenticación SSO.

---

## Campos del Request

| Campo | Tipo | Regular | SSO | Descripción |
|-------|------|---------|-----|-------------|
| `email` | string | **sí** | **sí** | Email del usuario (único) |
| `username` | string | **sí** | **sí** | Nombre de usuario visible |
| `password` | string | **sí** | no | Contraseña (solo registro regular) |
| `name` | string | no | no | Nombre para el perfil (default: toma `username`) |
| `sso` | boolean | no | **sí** | `true` indica flujo SSO |
| `unique_id` | string | no | **sí** | ID de trazabilidad SSO (requerido si `sso: true`) |

---

## Headers

| Header | Regular | SSO |
|--------|---------|-----|
| `Authorization: Bearer <token>` | No requerido | **Requerido** (token SSO válido) |
| `Content-Type: application/json` | **sí** | **sí** |

---

## Registro Regular

Crea un usuario con contraseña. El usuario queda en estado `status: 0` (pendiente de verificación de email).

### Request

```bash
curl -X POST 'https://gfc.api2.greenborn.com.ar/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "nuevo@example.com",
    "username": "nuevo_usuario",
    "password": "mi_contraseña_segura",
    "name": "Nuevo Usuario"
  }'
```

### Response (201)

```json
{
  "success": true,
  "message": "Usuario registrado. Verifica tu email para activar la cuenta.",
  "user": {
    "id": 42,
    "username": "nuevo_usuario",
    "email": "nuevo@example.com",
    "role_id": 3,
    "profile_id": 35,
    "status": 0,
    "dni": null
  }
}
```

### Lo que ocurre internamente

1. Se valida que `email` no esté duplicado
2. Se crea un registro en `profile` con `name` (o `username` si no se envía `name`)
3. Se crea el `user` con:
   - `password_hash` hasheado con bcrypt (formato `$2y$`)
   - `sign_up_verif_code` y `sign_up_verif_token` generados aleatoriamente
   - `status: 0` (pendiente de verificación)
   - `role_id: 3` (Concursante)

---

## Registro SSO

Crea un usuario autenticado vía SSO sin contraseña. El usuario queda activo inmediatamente (`status: 1`).

### Request

```bash
curl -X POST 'https://gfc.api2.greenborn.com.ar/api/auth/register' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "usuario@gmail.com",
    "username": "usuario_google",
    "name": "Usuario Google",
    "sso": true,
    "unique_id": "req_1719000000_abc123"
  }'
```

### Response (201)

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 43,
    "username": "usuario_google",
    "email": "usuario@gmail.com",
    "role_id": 3,
    "profile_id": 36,
    "status": 1,
    "dni": null
  }
}
```

### Lo que ocurre internamente

1. Se valida el Bearer token contra el SSO (`GET /auth/verify?unique_id=...`)
2. Si el token es inválido o expiró → `401`
3. Se verifica que `email` no esté duplicado
4. Se crea un registro en `profile` con `name` (o `username`)
5. Se crea el `user` con:
   - Sin `password_hash`
   - Sin códigos de verificación
   - `status: 1` (activo inmediatamente)
   - `role_id: 3` (Concursante)

---

## Respuestas de Error

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Falta `email` o `username` | `{ "success": false, "message": "Email y username son requeridos" }` |
| 400 | Registro regular sin `password` | `{ "success": false, "message": "Contraseña requerida para registro regular" }` |
| 400 | Registro SSO sin `unique_id` | `{ "success": false, "message": "unique_id requerido para registro SSO" }` |
| 401 | Registro SSO sin token | `{ "success": false, "message": "Token SSO requerido" }` |
| 401 | Token SSO inválido/expirado | `{ "success": false, "message": "Token SSO inválido" }` |
| 409 | Email ya registrado | `{ "success": false, "message": "El email ya está registrado" }` |
| 500 | Error interno | `{ "success": false, "message": "Error interno del servidor" }` |

---

## Flujo de uso desde el frontend

### Registro regular

```
1. Usuario completa formulario (email, username, password)
2. Frontend llama POST /auth/register
3. Backend crea usuario con status=0, genera código de verificación
4. Frontend muestra mensaje "Verifica tu email"
5. Usuario confirma email (endpoint separado)
6. Usuario inicia sesión con POST /auth/login
```

### Registro SSO

```
1. Usuario inicia sesión con Google vía SSO
2. Frontend recibe bearer_token + unique_id en el callback
3. Frontend llama GET /user/sso-profile?unique_id=... para verificar si existe
4. Si existe → redirigir a dashboard
5. Si NO existe → mostrar formulario con email pre-cargado
6. Usuario completa username (y opcionalmente name)
7. Frontend llama POST /auth/register con sso: true + bearer_token + unique_id
8. Backend valida token SSO, crea usuario con status=1
9. Frontend redirige a dashboard (ya autenticado)
```

---

## Notas técnicas

- **Write Protection**: el endpoint respeta el modo `READ_ONLY` (retorna `503` si está activo)
- **Role asignado**: todos los usuarios creados por este endpoint obtienen `role_id: 3` (Concursante)
- **Sin email de confirmación para SSO**: el flag `sso: true` omite la generación de códigos de verificación
- **Profile**: siempre se crea un `profile` asociado con `name` = `name` del body o `username` como fallback
