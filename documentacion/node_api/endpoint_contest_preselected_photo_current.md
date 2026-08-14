# Endpoint: Foto Actual de Juzgamiento (Preselección)

## Descripción
Devuelve cuál es la fotografía actual que un juez debe juzgar en la fase de **preselección** de un concurso, junto con el progreso del juez.

La "foto actual" es la **primera fotografía del concurso ordenada por `code` (ascendente) que el juez autenticado aún no ha votado** (no tiene voto en `contest_preselected_photo.votes`).

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación obligatoria**: Requiere sesión iniciada. Se valida con `authMiddleware` (SSO). Si no se envía un token Bearer válido (usuario sin sesión), la petición se rechaza con `401 Unauthorized` y **no se procesa**.
- **Permisos**: Administradores (`role_id == '1'`) o usuarios que son **jueces del concurso** (`contest_judge`) pueden acceder.
- El endpoint es de solo lectura (GET). No respeta `MODO_ESCRITURA` porque no modifica datos.

---

## 1. Obtener Foto Actual de Juzgamiento

### Endpoint
**GET** `/api/contest-preselected-photo/current`

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |

### Headers
```
Authorization: Bearer <access_token>
```

### Reglas de negocio
- El concurso debe existir y **no** estar borrado (soft delete `deleted_at`).
- El concurso debe estar en etapa de juzgamiento (`is_judging == true`).
- La fase debe ser **`preseleccion`** (`judging_stage == 'preseleccion'`). En fase `puntuacion` (o sin juzgamiento) responde `400`.
- El usuario autenticado debe ser admin o juez del concurso.

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:3000/api/contest-preselected-photo/current?contest_id=5" \
  -H "Authorization: Bearer <access_token>"
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "contest_id": 5,
  "current_photo": {
    "image_id": 10047,
    "code": "3336_2025_38_Color_10047",
    "title": "A LA DERECHA",
    "url": "https://assets.prod-gfc.greenborn.com.ar/images/2025/Primera/Color/3336_2025_38_Color_10047.jpg",
    "section_id": 3
  },
  "judged_count": 12,
  "total_count": 100,
  "remaining_count": 88,
  "all_judged": false
}
```

### Respuesta Exitosa (200) - Todas juzgadas
Cuando el juez ya votó todas las fotografías del concurso, `current_photo` es `null` y `all_judged` es `true`:
```json
{
  "success": true,
  "contest_id": 5,
  "current_photo": null,
  "judged_count": 100,
  "total_count": 100,
  "remaining_count": 0,
  "all_judged": true
}
```

### Respuesta de Error (401) - Sin sesión iniciada
Si no se envía token Bearer válido (usuario no autenticado):
```json
{
  "success": false,
  "message": "No autorizado"
}
```

### Respuesta de Error (400) - Falta `contest_id`
```json
{
  "success": false,
  "message": "El parámetro contest_id es obligatorio"
}
```

### Respuesta de Error (404) - Concurso no encontrado
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

### Respuesta de Error (400) - No en juzgamiento o fase incorrecta
```json
{
  "success": false,
  "message": "El concurso no está en etapa de juzgamiento"
}
```
```json
{
  "success": false,
  "message": "El endpoint de foto actual solo está disponible en la fase de preselección"
}
```

### Respuesta de Error (403) - Sin permisos
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores o jueces del concurso pueden consultar la foto actual"
}
```

---

## Campos de la respuesta
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `contest_id` | integer | ID del concurso |
| `current_photo` | object \| null | Fotografía actual a juzgar, o `null` si ya se juzgaron todas |
| `current_photo.image_id` | integer | ID de la imagen |
| `current_photo.code` | string | Código de la imagen |
| `current_photo.title` | string | Título de la imagen |
| `current_photo.url` | string | URL completa de la imagen (incluye `IMG_BASE_PATH`) |
| `current_photo.section_id` | integer | ID de la sección a la que pertenece |
| `judged_count` | integer | Cantidad de fotos ya juzgadas por el juez actual |
| `total_count` | integer | Total de fotos del concurso |
| `remaining_count` | integer | Fotos restantes por juzgar |
| `all_judged` | boolean | `true` si el juez ya juzgó todas las fotos |

---

## Notas de implementación
- Archivo: `node_api/routes/contest-preselected-photo.js` (ruta montada en `node_api/server.js` bajo `/api/contest-preselected-photo`).
- Reutiliza la función interna `parseVotes` para interpretar el mapa de votos `{ [user_id]: 'aceptar' | 'rechazar' }` de `contest_preselected_photo.votes`.
- La lista de fotos del concurso se obtiene de `contest_result` (join a `image`), filtrada por `contest_id` y ordenada por `image.code` asc.
- No persiste progreso: el avance se deduce de los votos ya emitidos por el juez (sin tabla ni migración nueva).
- Registra la consulta mediante `logAction`.

---

**Navegación**: [README](README.md) | [Endpoints](endpoints.md) | [Volver al README Principal](../../README.md)
