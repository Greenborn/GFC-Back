# Inscripción en Concurso (Profile-Contest)

**`POST`** `/profile-contest`

Inscribe un perfil en un concurso. Crea un registro en la tabla `profile_contest`.

---

## Request

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Params

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `unique_id` | string | solo SSO | ID de trazabilidad para tokens SSO |
| `expand` | string | no | Campos a expandir separados por coma |

### Body

```json
{
  "profile_id": 386,
  "contest_id": 68,
  "category_id": 1
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `profile_id` | integer | **sí** | ID del perfil a inscribir |
| `contest_id` | integer | **sí** | ID del concurso |
| `category_id` | integer | no | ID de la categoría (opcional) |

---

## Ejemplo completo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/profile-contest?expand=profile,profile.user,profile.fotoclub,category&unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"profile_id": 386, "contest_id": 68, "category_id": 1}'
```

---

## Respuestas

### 201 — Inscripción creada

```json
{
  "success": true,
  "data": {
    "id": 512,
    "profile_id": 386,
    "contest_id": 68,
    "category_id": 1,
    "profile": {
      "id": 386,
      "name": "Juan Pérez",
      "last_name": "",
      "fotoclub_id": 2,
      "img_url": "images/profile_386_abc.jpg",
      "user": {
        "id": 42,
        "username": "juanperez",
        "email": "juan@example.com",
        "role_id": 3,
        "profile_id": 386,
        "status": 1
      },
      "fotoclub": {
        "id": 2,
        "name": "El Faro"
      }
    },
    "category": {
      "id": 1,
      "name": "Primera, number one"
    }
  }
}
```

> Los campos expandidos (`profile`, `profile.user`, `profile.fotoclub`, `category`) solo aparecen si se incluyen en el query param `expand`.

### 400 — Campos requeridos faltantes

```json
{
  "success": false,
  "message": "profile_id y contest_id son requeridos"
}
```

### 403 — Sin permisos

```json
// Concursante intenta inscribir otro perfil
{ "success": false, "message": "No puede inscribir un perfil que no le pertenece" }

// Admin intenta inscribirse a sí mismo
{ "success": false, "message": "Un administrador no puede inscribirse a sí mismo" }

// Delegado intenta inscribir perfil de otro fotoclub
{ "success": false, "message": "No puede inscribir un perfil fuera de su fotoclub" }
```

### 409 — Ya inscrito

```json
{
  "success": false,
  "message": "El perfil ya está inscrito en este concurso"
}
```

---

## Autorización por rol

| Rol | Comportamiento |
|-----|----------------|
| `1` (Administrador) | Puede inscribir **cualquier perfil excepto el suyo propio** |
| `2` (Delegado) | Puede inscribir perfiles de su **mismo fotoclub** |
| `3` (Concursante) | Solo puede inscribir su **propio perfil** |

### Filtros aplicados

- **Concursante**: `profile_id` debe coincidir con `req.user.profile_id`
- **Delegado**: el perfil destino debe tener el mismo `fotoclub_id` que el perfil del delegado
- **Admin**: recibe `403` si intenta inscribir su propio perfil

---

## Expand (query param)

Controla qué relaciones se incluyen en la respuesta.

| Valor | Incluye |
|-------|---------|
| `category` | Datos de la categoría (`category`) |
| `profile` | Datos del perfil (`profile`) |
| `profile.user` | Usuario asociado al perfil (requiere `profile`) |
| `profile.fotoclub` | Fotoclub del perfil (requiere `profile`) |

Ejemplos:

```bash
# Solo categoría
?expand=category

# Perfil completo con usuario y fotoclub
?expand=profile,profile.user,profile.fotoclub

# Todo (categoría + perfil + usuario + fotoclub)
?expand=profile,profile.user,profile.fotoclub,category
```

---

## Notas técnicas

- **Write Protection**: respeta `MODO_ESCRITURA=READ_ONLY` (retorna `503`)
- **SSO compatible**: usa `authMiddleware`, el token SSO debe incluir `?unique_id=` en la URL
- **Unique constraint**: la BD tiene una constraint `UNIQUE(profile_id, contest_id)`. El endpoint verifica duplicado antes de insertar y también captura el error de la BD como fallback
- **Log**: cada inscripción se registra en `log_operaciones` con evento `Inscripción en concurso`
