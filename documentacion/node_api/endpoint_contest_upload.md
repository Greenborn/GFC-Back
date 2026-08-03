# Carga de Foto a Concurso (Contest Upload)

**`POST`** `/contest-upload`

Endpoint unificado para que un participante suba una fotografía directamente a un concurso. En una **única transacción** crea:

1. La **imagen** (`image`)
2. La **métrica inicial** (`metric`) con `prize = '0'`, `score = null` (aún sin puntaje; se completará luego cuando el jurado asigne el premio)
3. El **resultado de concurso** (`contest_result`) que vincula imagen ↔ concurso ↔ sección ↔ métrica

A diferencia del flujo en 2 pasos (`POST /images` + `POST /contest-result`), este endpoint valida que el usuario esté **inscripto** y que la carga cumpla todas las reglas del concurso (no ser juez, concurso activo, límite de imágenes por sección, sin títulos duplicados).

---

## Request

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body

```json
{
  "contest_id": 68,
  "section_id": 2,
  "title": "Mi fotografía 2026",
  "photo_base64": {
    "file": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `contest_id` | integer | **sí** | ID del concurso |
| `section_id` | integer | **sí** | ID de la sección (Monocromo/Color). Debe pertenecer al concurso vía `contest_section` |
| `title` | string | **sí** | Título de la fotografía. No debe repetirse para el mismo perfil en el mismo concurso |
| `photo_base64.file` | string | **sí** | Imagen en base64 (data URI o base64 crudo). Se procesa con sharp (máx. 1920×1920, JPEG) |

> **Nota:** `metric_id` **no** se envía. El endpoint crea automáticamente la métrica con `prize = '0'` y `score = null`; ese `metric_id` se usará luego al asignar puntaje.

---

## Ejemplo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/contest-upload' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "contest_id": 68,
    "section_id": 2,
    "title": "Mi fotografía 2026",
    "photo_base64": { "file": "data:image/jpeg;base64,<base64>" }
  }'
```

---

## Reglas de validación (en orden)

| # | Regla | Condición | Respuesta |
|---|-------|-----------|-----------|
| 1 | **Campos requeridos** | `contest_id`, `section_id`, `title`, `photo_base64.file` | `400` |
| 2 | **Admin no participa** | `role_id == '1'` | `403` "Un administrador no puede participar en un concurso" |
| 3 | **No ser juez** | existe `contest_judge(contest_id, user_id)` | `403` "Los jueces no pueden participar en el concurso" |
| 4 | **Concurso existe y activo** | `contest` sin `deleted_at` | `404` "Concurso no encontrado" |
| 5 | **No en jurado** | `contest.is_judging == true` | `403` "El concurso está en período de jurado..." |
| 6 | **Concurso de test** | `contest.is_test` sin `is_test_enabled` | `404` "Concurso no encontrado" |
| 7 | **Fechas** | `now` fuera de `[start_date, end_date]` | `403` "El concurso aún no ha comenzado"/"ha finalizado" |
| 8 | **Inscripción** | no existe `profile_contest(profile_id, contest_id)` | `403` "No está inscripto en el concurso" |
| 9 | **Sección válida** | `section_id` no existe en `contest_section` | `400` "La sección no pertenece al concurso" |
| 10 | **Límite por sección** | nº de imágenes del perfil en `(contest_id, section_id)` `>= contest.max_img_section` | `409` "Límite de imágenes por sección alcanzado" |
| 11 | **Título duplicado** | el perfil ya tiene imagen con el mismo `title` en el concurso | `409` "Ya existe una imagen con ese título..." |
| 12 | **Imagen inválida** | `saveImageFromBase64` devuelve `null` | `400` "Formato de imagen inválido" |

> `profile_id` se toma **siempre** de `req.user.profile_id` (el perfil del usuario autenticado). No se acepta `profile_id` en el body.

---

## Respuestas

### 201 — Foto subida correctamente

```json
{
  "success": true,
  "data": {
    "image": {
      "id": 13957,
      "code": "4521_2026_68_Monocromo_13957",
      "title": "Mi fotografía 2026",
      "profile_id": 501,
      "url": "images/1712400000000_abcd1234.jpg",
      "width": 1920,
      "height": 1080,
      "mime_type": "image/jpeg"
    },
    "contest_result": {
      "id": 512,
      "contest_id": 68,
      "image_id": 13957,
      "metric_id": 13814,
      "section_id": 2
    }
  }
}
```

### 400 — Faltan campos

```json
{
  "success": false,
  "message": "contest_id, section_id, title y photo_base64.file son requeridos"
}
```

### 403 — No está inscripto

```json
{
  "success": false,
  "message": "No está inscripto en el concurso"
}
```

### 409 — Límite alcanzado

```json
{
  "success": false,
  "message": "Límite de imágenes por sección alcanzado (3)"
}
```

---

## Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Faltan campos / sección inválida / imagen inválida | `{ "success": false, "message": "..." }` |
| 403 | Admin, juez, no inscripto, concurso cerrado/en jurado | `{ "success": false, "message": "..." }` |
| 404 | Concurso no encontrado / concurso de test oculto | `{ "success": false, "message": "..." }` |
| 409 | Límite por sección / título duplicado | `{ "success": false, "message": "..." }` |
| 500 | Error interno (transacción o post-proceso) | `{ "success": false, "message": "Error al subir la foto al concurso", "error": "..." }` |

---

## Notas técnicas

- **Auth**: usa `authMiddleware` (tokens locales y SSO)
- **Write Protection**: respeta `MODO_ESCRITURA=READ_ONLY` (retorna `503`)
- **Transacción**: `metric` + `image` + `contest_result` se crean dentro de `knex.transaction`. Si falla algo, hace rollback (no quedan datos huérfanos)
- **Imagen**: se procesa y guarda en disco con `saveImageFromBase64` (util `utils/images.js`) antes de la transacción
- **Código de imagen**: tras el commit se llama a `generarCodigoImagen` → formato `[4dígitos]_[año]_[id_concurso]_[sección]_[id_image]`
- **Thumbnails**: se generan tras el commit con `getThumbnailGuard` + `generateThumbnails`
- **Caché**: invalida el caché de `contest_result` (`contestResultCache.invalidateAll()`)
- **Log**: cada carga se registra en `log_operaciones`
- **Métrica**: se crea con `prize = '0'`, `score = null`; cuando el jurado asigne un premio, `results.js` (`updatePrizeInMetric`) actualizará esa fila con el `prize` y `score` correspondientes
