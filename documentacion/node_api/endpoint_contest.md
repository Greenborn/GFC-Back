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

---

## Clonar Datos de Concurso (solo administradores)

### Endpoint
**POST** `/api/contest/clone-data`

### Descripción
Clona los datos relacionados de un concurso origen a un concurso destino de pruebas. Copia categorías, secciones, jueces, registros, participantes, resultados (sin premios) y fotos preseleccionadas. El concurso destino **debe** tener `is_test = true`.

### Seguridad
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Solo administradores (`role_id == '1'`)

### Headers
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

### Body (JSON)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `origen_id` | integer | Sí | ID del concurso origen cuyos datos se copiarán |
| `destino_id` | integer | Sí | ID del concurso destino (debe ser `is_test = true`) |

### Ejemplo de Solicitud
```bash
curl -X POST "http://localhost:3000/api/contest/clone-data" \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"origen_id": 58, "destino_id": 62}'
```

### Proceso
1. Valida que ambos concursos existan y no estén borrados lógicamente
2. Verifica que el concurso destino tenga `is_test = true`
3. Elimina todos los datos existentes del destino en las tablas relacionadas
4. Copia los datos desde el origen al destino (todo dentro de una **transacción**):
   - `contest_category` - Relaciones con categorías
   - `contest_section` - Relaciones con secciones
   - `contest_judge` - Jueces asignados
   - `contests_records` - Registros/documentos
   - `profile_contest` - Participantes inscritos
   - `contest_result` - Imágenes **sin premios** (`metric_id = NULL`)
   - `contest_preselected_photo` - Fotos preseleccionadas (votos reseteados)

### Tablas NO copiadas
| Tabla | Motivo |
|-------|--------|
| `contest` | El destino ya existe con sus propios datos |
| `metric` / `metric_abm` | No se copian las métricas/premios |
| Archivos físicos | Solo se copian referencias, no los archivos de imagen |

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Datos clonados exitosamente del concurso \"Concurso Anual 2025\" al concurso \"Test Simulación\"",
  "data": {
    "origen_id": 58,
    "destino_id": 62,
    "deleted": {
      "contest_category": 3,
      "contest_section": 1,
      "contest_judge": 0,
      "contests_records": 2,
      "profile_contest": 10,
      "contest_result": 25,
      "contest_preselected_photo": 0
    },
    "copied": {
      "contest_category": 5,
      "contest_section": 3,
      "contest_judge": 2,
      "contests_records": 4,
      "profile_contest": 50,
      "contest_result": 120,
      "contest_preselected_photo": 30
    }
  }
}
```

### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "Los campos origen_id y destino_id son obligatorios"
}
```
```json
{
  "success": false,
  "message": "origen_id y destino_id deben ser números válidos"
}
```
```json
{
  "success": false,
  "message": "El concurso destino debe ser un concurso de pruebas (is_test = true)"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder a este recurso."
}
```

### Respuesta de Error (404)
```json
{
  "success": false,
  "message": "Concurso origen no encontrado"
}
```
```json
{
  "success": false,
  "message": "Concurso destino no encontrado"
}
```

### Respuesta de Error (500)
```json
{
  "success": false,
  "message": "Error interno al clonar datos del concurso",
  "error": "Detalles del error"
}
```

### Características del Endpoint
- **Autenticación**: Requerida (Bearer Token)
- **Permisos**: Solo admin (`role_id == '1'`)
- **Transaccional**: Sí, toda la operación se ejecuta en una transacción
- **Logging**: Se registra la operación con detalles de origen, destino y conteos
- **Idempotencia**: Se pueden ejecutar múltiples veces sobre el mismo destino (se limpian los datos previos)
