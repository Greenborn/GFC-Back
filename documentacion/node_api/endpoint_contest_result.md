# Resultado de Concurso (Contest Result)

**`POST`** `/contest-result`

Crea un registro en la tabla `contest_result` — vincula una imagen con un concurso, una métrica (premio/puntaje) y una sección.

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

### Body

```json
{
  "contest_id": 68,
  "image_id": 13957,
  "metric_id": 13814,
  "section_id": 2
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `contest_id` | integer | **sí** | ID del concurso |
| `image_id` | integer | **sí** | ID de la imagen |
| `metric_id` | integer | **sí** | ID de la métrica (premio/puntaje asignado) |
| `section_id` | integer | **sí** | ID de la sección (Monocromo/Color) |

---

## Ejemplo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/contest-result?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"contest_id": 68, "image_id": 13957, "metric_id": 13814, "section_id": 2}'
```

---

## Respuestas

### 201 — Resultado creado

```json
{
  "success": true,
  "data": {
    "id": 512,
    "contest_id": 68,
    "image_id": 13957,
    "metric_id": 13814,
    "section_id": 2
  }
}
```

### 400 — Campos requeridos faltantes

```json
{
  "success": false,
  "message": "contest_id, image_id, metric_id y section_id son requeridos"
}
```

---

## Tabla `contest_result`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer (PK) | ID autoincremental |
| `contest_id` | integer (FK) | Concurso → `contest.id` |
| `image_id` | integer (FK) | Imagen → `image.id` |
| `metric_id` | integer (FK) | Métrica (premio/puntaje) → `metric.id` |
| `section_id` | integer (FK) | Sección → `section.id` |

---

## Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Falta algún campo requerido | `{ "success": false, "message": "contest_id, image_id, metric_id y section_id son requeridos" }` |
| 500 | Error interno | `{ "success": false, "message": "Error al crear resultado de concurso", "error": "..." }` |

---

## Notas técnicas

- **Auth**: usa `authMiddleware` (compatible con tokens locales y SSO)
- **Write Protection**: respeta `MODO_ESCRITURA=READ_ONLY` (retorna `503`)
- **SSO**: los tokens SSO requieren `?unique_id=` en la URL
- **Log**: cada creación se registra en `log_operaciones`
- **Endpoint GET**: existe `GET /contest-result` con filtros avanzados (búsqueda, paginación, expand de image/profile/fotoclub)
- **Caché en GET**: el endpoint `GET /contest-result` cachea los resultados por 24hs cuando el concurso ya está juzgado (`contest.judged = true`). La clave de caché incluye todos los query params (filtros, paginación, ordenamiento), por lo que cada combinación de filtros se cachea independientemente. Los concursos no juzgados no se cachean
- **Integración**: este endpoint es usado por el sistema de jurado para asignar premios a imágenes en cada sección del concurso
