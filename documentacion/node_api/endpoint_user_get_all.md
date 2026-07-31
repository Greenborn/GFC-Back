# Endpoint: GET /api/user/get_all

Listado de usuarios con **búsqueda, filtrado, ordenado y paginación**. Devuelve además los catálogos auxiliares `profile`, `role` y `fotoclub`.

## Autenticación

Requiere token Bearer:
```
Authorization: Bearer <token>
```

Todos los usuarios autenticados pueden consumir este endpoint.

- **Administrador** (`role_id == 1`) y otros roles: reciben el listado completo.
- **Delegado** (`role_id == 2`): la respuesta queda limitada a usuarios con `role_id == 3` cuyo `profile.fotoclub_id` pertenezca al mismo fotoclub que el delegado. Si el delegado no tiene fotoclub, solo ve `role_id == 3` con `profile_id == -1`.

## Parámetros de Query (todos opcionales)

| Parámetro | Tipo | Descripción | Default |
|---|---|---|---|
| `page` | int | Número de página (desde 1) | `1` |
| `per-page` | int | Registros por página | `20` |
| `sort` | string | Columna de ordenado | `id` |
| `sort_dir` | string | `asc` o `desc` | `asc` |
| `search` | string | Búsqueda global sobre campos de identidad | — |
| `q` | string | Alias de `search` | — |
| `filter[columna]` | varios | Filtro exacto por columna | — |

### Columnas de ordenado válidas (`sort`)
`id`, `username`, `email`, `dni`, `status`, `role_id`, `profile_id`, `created_at`, `updated_at`

Si se pasa un valor no válido, se usa `id`.

### Búsqueda (`search` / `q`)
Busca de forma insensible a mayúsculas y acentos en:
- `username`
- `email`
- `dni`
- `id` (solo si el término es numérico)

### Filtros (`filter[columna]`)
Columnas filtrables: `id`, `username`, `email`, `dni`, `status`, `role_id`, `profile_id`.

Sintaxis admitidas:
- Exacta: `filter[role_id]=3`
- Múltiples con coma: `filter[role_id]=1,2`
- Operadores de objeto:
  - `filter[status][in]=0,1`
  - `filter[id][between]=1,100`
  - `filter[id][inside]=1,100`

Los filtros se combinan con la búsqueda y con la restricción de delegado mediante `AND`.

## Respuesta (200)

```json
{
  "items": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "dni": null,
      "status": 1,
      "role_id": 1,
      "profile_id": 10,
      "created_at": null,
      "updated_at": "1722983871"
    }
  ],
  "_links": {
    "self": { "href": "http://host/api/user/get_all?page=1" },
    "first": { "href": "http://host/api/user/get_all?page=1" },
    "last": { "href": "http://host/api/user/get_all?page=5" }
  },
  "_meta": {
    "totalCount": 100,
    "pageCount": 5,
    "currentPage": 1,
    "perPage": 20
  },
  "profile": [ ],
  "role": [ ],
  "fotoclub": [ ]
}
```

### Campos de `items`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | int | |
| `username` | string | |
| `email` | string | |
| `dni` | string \| null | |
| `status` | int | 0 = deshabilitado, 1 = habilitado |
| `role_id` | int | |
| `profile_id` | int | |
| `created_at` | string \| null | |
| `updated_at` | string \| null | |

### Metadatos de paginación (`_meta`)
- `totalCount`: total de registros que coinciden con los filtros.
- `pageCount`: cantidad total de páginas.
- `currentPage`: página actual.
- `perPage`: registros por página.

### Enlaces (`_links`)
- `self`, `first`, `last` siempre presentes.
- `next` presente si hay página siguiente.
- `prev` presente si no es la primera página.

## Seguridad

Los campos sensibles **nunca** se devuelven al frontend:
- `password_hash`
- `password_reset_token`
- `access_token`
- `sign_up_verif_code`
- `sign_up_verif_token`
- `pass_recovery_date`

## Ejemplos

```bash
# Página 2, 10 por página
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?page=2&per-page=10"

# Ordenado descendente por username
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?sort=username&sort_dir=desc"

# Búsqueda por término
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?search=lucho"

# Filtro por rol
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?filter[role_id]=3"

# Combinado: filtro por estado + búsqueda + orden + paginación
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?filter[status]=1&search=adrian&sort=email&sort_dir=asc&page=1&per-page=20"

# Filtros múltiples por rol
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/user/get_all?filter[role_id]=1,2"
```

## Errores

| Código | Caso |
|---|---|
| `401` | Token faltante o inválido |
| `500` | Error interno (`{ "message": "Error al obtener registros" }`) |
