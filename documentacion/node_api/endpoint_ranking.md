# Ranking

**`GET`** `/ranking`

Retorna datos de ranking global: perfiles, fotoclubs, secciones y categorías.

---

## 1. Ranking general

**`GET`** `/api/ranking`

### Headers

```
Authorization: Bearer <token>
```

### Query Params

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `unique_id` | string | solo SSO | ID de trazabilidad para tokens SSO |
| `year` | integer | no | Año de referencia (se incluye en log, el ranking retorna datos globales) |

### Ejemplo

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/ranking?year=2026&unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

### Response (200)

```json
{
  "items": {
    "profiles": [
      {
        "id": 1,
        "profile_id": 386,
        "section_id": 1,
        "category_id": 2,
        "name": "Juan Pérez",
        "puntaje_temporada": 45,
        "score_total": 120,
        "prizes": "1er PREMIO, 2do PREMIO",
        "premios_temporada": "1er PREMIO"
      }
    ],
    "profiles_ranking": [
      {
        "id": 1,
        "profile_id": 386,
        "score": 120,
        "prizes": "1er PREMIO, 2do PREMIO"
      }
    ],
    "fotoclubs": [
      {
        "id": 1,
        "fotoclub_id": 1,
        "name": "El Faro",
        "score": 250,
        "prizes": "1er PREMIO",
        "puntaje_temporada": 150,
        "premios_temporada": "1er PREMIO",
        "porc_efectividad_anual": "85%"
      }
    ],
    "Section": [
      { "id": 1, "name": "Monocromo" },
      { "id": 2, "name": "Color" }
    ],
    "Category": [
      { "id": 1, "name": "Primera, number one" },
      { "id": 2, "name": "Segunda" }
    ]
  }
}
```

---

## 2. Detalle de ranking por concurso y perfil

**`GET`** `/api/ranking/detalle/:contest_id/:profile_id`

Retorna el detalle de un perfil en un concurso específico (imágenes, puntajes, posición).

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/ranking/detalle/68/386?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

---

## 3. Detalle de ranking anual por perfil

**`GET`** `/api/ranking/detalle/:profile_id`

Retorna el ranking anual de un perfil, incluyendo resultados de todos los concursos del año.

### Query Params

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | integer | no | Año a consultar (default: año actual) |

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/ranking/detalle/386?year=2026&unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

---

## 4. Detalle de ranking con filtros

**`GET`** `/api/ranking/detalle`

### Query Params

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `profile_id` | integer | **sí** | ID del perfil |
| `contest_id` | integer | no | Filtrar por concurso específico |
| `section_id` | integer | no | Filtrar por sección |
| `year` | integer | no | Año (default: año actual) |

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/ranking/detalle?profile_id=386&contest_id=68&year=2026&unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

---

## Tablas de datos

### `profiles_ranking_category_section`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | PK |
| `profile_id` | integer | FK → profile.id |
| `name` | text | Nombre del perfil |
| `section_id` | integer | FK → section.id |
| `category_id` | integer | FK → category.id |
| `puntaje_temporada` | integer | Puntaje de la temporada |
| `score_total` | integer | Score total acumulado |
| `prizes` | text | Premios obtenidos |
| `premios_temporada` | text | Premios de la temporada |

### `fotoclub_ranking`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | PK |
| `fotoclub_id` | integer | FK → fotoclub.id |
| `name` | text | Nombre del fotoclub |
| `score` | integer | Score total |
| `prizes` | text | Premios obtenidos |
| `puntaje_temporada` | integer | Puntaje de la temporada |
| `premios_temporada` | text | Premios de la temporada |
| `porc_efectividad_anual` | text | Porcentaje de efectividad anual |

---

## Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 401 | Token ausente/inválido | `{ "success": false, "message": "..." }` |
| 400 | Parámetros inválidos | `{ "success": false, "message": "Parámetros inválidos" }` |
| 403 | Concurso no juzgado | `{ "success": false, "message": "El concurso aún no ha sido juzgado" }` |
| 403 | No inscripto | `{ "success": false, "message": "El concursante no está inscripto en el concurso" }` |
| 404 | Concurso/perfil no encontrado | `{ "success": false, "message": "..." }` |
| 500 | Error interno | `{ "success": false, "message": "Error interno" }` |

---

## Notas técnicas

- **Auth**: usa `authMiddleware` (compatible con tokens locales y SSO)
- **SSO**: los tokens SSO requieren `?unique_id=` en la URL
- **Log**: cada consulta se registra en `log_operaciones`
- **Año**: el parámetro `year` se registra en el log pero no filtra los datos (el ranking retorna datos globales de `profiles_ranking_category_section` y `fotoclub_ranking`)
- **Caché**: los endpoints de ranking utilizan un sistema de caché en memoria centralizado (`utils/cache.js`) con TTL de 1 hora. La primera consulta tras la expiración regenera los datos desde la BD; las siguientes sirven desde caché. Las validaciones de existencia (contest, profile, inscription) no se cachean, solo los datos pesados (joins, agregaciones)
- **Invalidación**: no hay invalidación manual; el caché expira automáticamente a la hora. Si se necesita forzar refresco, se puede reiniciar el servidor o esperar el TTL
