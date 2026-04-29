# Endpoint: Contest

## Descripción
Listado de concursos con paginación y opciones de expansión. El endpoint acepta tanto `/api/contest` como `/api/contests` por compatibilidad.

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación**: Todos los endpoints requieren token Bearer
- **Permisos de lectura**: Todos los usuarios autenticados

---

## 1. Listar Concursos

### Endpoint
**GET** `/api/contest`

### Descripción
Obtiene una lista paginada de concursos y permite expandir datos relacionados como `categories` y `sections`.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción | Valor por defecto |
|-----------|------|-----------|-------------|-------------------|
| `expand` | string | No | Lista separada por comas de relaciones a expandir. Soporta `categories` y `sections` | - |
| `sort` | string | No | Campo de ordenamiento. Ej: `-id` para descendente, `id` para ascendente | - |
| `page` | integer | No | Número de página | 1 |
| `per-page` | integer | No | Elementos por página | 20 |
| `search` | string | No | Término de búsqueda para filtrar concursos cuyo `name` o `description` contienen el valor | - |

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:3000/api/contest?expand=categories,sections&sort=-id&page=1&per-page=20" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo de Búsqueda
```bash
curl -X GET "http://localhost:3000/api/contest?search=verano&expand=categories,sections&sort=-id&page=1&per-page=20" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 101,
      "name": "Concurso de Fotografía 2026",
      "description": "Concurso anual de la federación",
      "start_date": "2026-05-01 00:00:00",
      "end_date": "2026-06-30 23:59:59",
      "active": true,
      "categories": [
        { "id": 10, "name": "Color", "mostrar_en_ranking": true },
        { "id": 11, "name": "Blanco y Negro", "mostrar_en_ranking": true }
      ],
      "sections": [
        { "id": 5, "name": "Libre" },
        { "id": 7, "name": "Documental" }
      ]
    }
  ],
  "_links": {
    "self": { "href": "http://localhost:3000/api/contest?expand=categories,sections&sort=-id&page=1&per-page=20" },
    "first": { "href": "http://localhost:3000/api/contest?expand=categories,sections&sort=-id&page=1&per-page=20" },
    "last": { "href": "http://localhost:3000/api/contest?expand=categories,sections&sort=-id&page=3&per-page=20" },
    "next": { "href": "http://localhost:3000/api/contest?expand=categories,sections&sort=-id&page=2&per-page=20" }
  },
  "_meta": {
    "totalCount": 58,
    "pageCount": 3,
    "currentPage": 1,
    "perPage": 20
  }
}
```

### Notas
- El endpoint retorna un objeto `items` con los concursos.
- La paginación se controla con `page` y `per-page`.
- La expansión de `categories` y `sections` se realiza solo si se incluye el parámetro `expand`.
- El parámetro `search` filtra concursos cuyo `name` o `description` contienen el término ingresado.
- El parámetro `sort=-id` ordena los concursos del más reciente al más antiguo.
