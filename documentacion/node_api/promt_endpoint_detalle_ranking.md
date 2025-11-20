# Endpoint: Detalle de Ranking por Concursante

## Descripción Técnica

Este endpoint permite obtener los detalles del ranking para cada concursante en un concurso específico. La información se obtiene combinando los datos de las tablas `contest`, `profile`, `profile_contest`, `contest_result`, `metric`, y las relaciones con categorías y secciones.

### Ruta
`GET /api/ranking/detalle`

#### Query Params
- `profile_id` (int, requerido): ID del concursante (perfil)
- `contest_id` (int, opcional): ID del concurso
- `year` (int, opcional): Año a consultar cuando no se indica `contest_id` (por defecto, año actual)

### Comportamiento
- Con `contest_id`: devuelve el detalle para ese concurso.
- Sin `contest_id`: devuelve todos los concursos del año indicado (o del año actual) en los que el perfil participó o está inscripto, filtrando por `end_date >= 1 de enero` y año de `end_date` igual al `year` solicitado.

### Respuesta
- Con `contest_id`:
  - `contest`: datos del concurso
  - `profile`: datos del concursante (incluye `fotoclub` si aplica)
  - `categories`: categoría asignada por inscripción (`profile_contest.category_id`)
  - `sections`: secciones en las que tiene resultados
  - `results`: arreglo por sección con imágenes y sus métricas (`prize`, `score`)
  - `ranking`: `total_score` y `position` dentro del concurso

- Sin `contest_id`:
  - `profile`: datos del concursante
  - `year`: año consultado
  - `items`: arreglo por concurso del año con `contest`, `categories`, `sections`, `results`, `ranking`
  - `count`: cantidad de concursos en el resultado

#### Ejemplo de respuesta
```json
{
  "contest": { ... },
  "profile": { ... },
  "categories": [ ... ],
  "sections": [ ... ],
  "results": [
    {
      "section": "Naturaleza",
      "category": "Fauna",
      "images": [
        {
          "image_id": 123,
          "title": "Nombre de la obra",
          "thumbnail_url": "https://assets.../thumbnails/123.jpg",
          "metric": {
            "prize": "Oro",
            "score": 95
          }
        }
      ]
    }
  ],
  "ranking": {
    "total_score": 250,
    "position": 2
  }
}
```

#### Ejemplo de respuesta (sin `contest_id`)
```json
{
  "profile": { "id": 123, "name": "Juan", "last_name": "Pérez" },
  "year": 2025,
 "items": [
    {
      "contest": { "id": 51, "name": "Concurso A", "end_date": "2025-03-20 23:59:00" },
      "categories": [ { "id": 2, "name": "Primera" } ],
      "sections": [ { "id": 1, "name": "Color" } ],
      "results": [ { "section": "Color", "category": "Primera", "images": [ { "image_id": 10047, "title": "A LA DERECHA", "thumbnail_url": "https://.../thumbs/10047.jpg", "metric": { "prize": "1er PREMIO", "score": 95 } } ] } ],
      "ranking": { "total_score": 95, "position": 1 }
    }
  ],
  "count": 1
}
```

### Consultas SQL Sugeridas

1. **Obtener datos del concursante y concurso:**
```sql
SELECT p.*, c.*
FROM profile p
JOIN profile_contest pc ON pc.profile_id = p.id
JOIN contest c ON c.id = pc.contest_id
WHERE c.id = :contest_id AND p.id = :profile_id;
```

2. **Obtener categorías y secciones:**
```sql
SELECT cc.category_id, cs.section_id
FROM contest_category cc
JOIN contest_section cs ON cs.contest_id = cc.contest_id
WHERE cc.contest_id = :contest_id;
```

3. **Obtener resultados y métricas del concursante:**
```sql
SELECT cr.*, m.*
FROM contest_result cr
JOIN metric m ON m.id = cr.metric_id
JOIN image i ON i.id = cr.image_id
LEFT JOIN thumbnail t ON t.image_id = i.id
WHERE cr.contest_id = :contest_id AND i.profile_id = :profile_id;
```

4. **Cálculo de ranking por concurso:**
```sql
SELECT i.profile_id, SUM(m.score) AS total_score
FROM contest_result cr
JOIN image i ON i.id = cr.image_id
JOIN metric m ON m.id = cr.metric_id
WHERE cr.contest_id = :contest_id
GROUP BY i.profile_id
ORDER BY total_score DESC;
```
La posición del `profile_id` consultado se obtiene por el índice en el orden descendente.

5. **Selección de concursos del año (sin `contest_id`):**
```sql
SELECT id, end_date
FROM contest
WHERE end_date >= :start_of_year;
```
Luego filtrar por `YEAR(end_date) = :year` y obtener los concursos en los que el perfil esté inscripto (`profile_contest`) o tenga resultados (`contest_result` + `image.profile_id`).

### Consideraciones
- Autenticación obligatoria mediante `Authorization: Bearer <token>`.
- Con `contest_id`: validar inscripción del perfil en el concurso (`profile_contest`), en caso contrario responder `403`.
- Sin `contest_id`: filtrar concursos por año usando `end_date >= 1 de enero` del año indicado y año de cierre igual al `year`.
- Los puntajes se toman de `metric.score`; se asignan al juzgar según `metric_abm`.
- Optimizar consultas con índices en `contest_result.metric_id`, `contest_result.image_id`, `image.profile_id` y `profile_contest`.

### Seguridad
- Solo usuarios autenticados pueden acceder.
- Proteger datos sensibles del concursante.

### Ejemplos de Uso
**Por concurso**
```
curl -H "Authorization: Bearer <token>" \
  "http://localhost:7779/api/ranking/detalle?contest_id=51&profile_id=123"
```

**Por año (sin contest_id)**
```
curl -H "Authorization: Bearer <token>" \
  "http://localhost:7779/api/ranking/detalle?profile_id=123&year=2025"
```

### Códigos de Respuesta
- 200: OK
- 400: Parámetros inválidos (por ejemplo, `profile_id` inválido)
- 401: No autenticado
- 403: El concursante no está inscripto en el concurso
- 404: Concurso o concursante no encontrado
- 500: Error interno

---
