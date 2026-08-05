# Endpoint: Set Judging (Poner Concurso en Juzgamiento)

## Descripción
Permite a un administrador poner un concurso en etapa de juzgamiento. Esto setea `is_judging = true`, automáticamente `judged = false` (si estaba juzgado se resetea) e inicializa la fase del juzgamiento en `judging_stage = 'preseleccion'`.

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación**: Requiere token Bearer
- **Permisos**: Solo administradores (`role_id == '1'`)

---

## 1. Poner concurso en juzgamiento

### Endpoint
**PUT** `/api/contest/:id/set-judging`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parámetros de ruta
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del concurso |

### Body
No requiere body.

### Ejemplo de Solicitud
```bash
curl -X PUT "http://localhost:3000/api/contest/5/set-judging" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Concurso Anual 2026",
    "is_judging": true,
    "judged": false,
    "judging_stage": "preseleccion"
  },
  "message": "El concurso \"Concurso Anual 2026\" ha sido puesto en etapa de juzgamiento"
}
```

### Respuesta: Concurso no encontrado (404)
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

### Respuesta: Acceso denegado (403)
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder a este recurso."
}
```

### Respuesta: Sin jueces asignados (400)
```json
{
  "success": false,
  "message": "No se puede iniciar el juzgamiento: el concurso debe tener al menos un juez asignado"
}
```

### Notas
- **Validación**: Antes de pasar a juzgamiento, se verifica que el concurso tenga al menos un juez asignado en la tabla `contest_judge`. Si no hay ningún juez, se rechaza con error 400.
- Al marcar un concurso como "en juzgamiento", `judged` siempre se setea en `false`, incluso si ya estaba juzgado (permite re-abrir juzgamiento).
- Al marcar un concurso como "en juzgamiento", la fase se inicializa en `judging_stage = 'preseleccion'`.
- El campo `is_judging` se expone como booleano en todas las respuestas del concurso (`GET /contest/:id`, `GET /contest/`, etc.).
- El campo `judging_stage` (`'preseleccion' | 'puntuacion' | null`) también se expone en las respuestas del concurso y se gestiona con el endpoint `PUT /contest/:id/judging-stage`.

---

## 2. Sacar concurso de juzgamiento

### Endpoint
**PUT** `/api/contest/:id/disable-judging`

### Descripción
Saca un concurso de la etapa de juzgamiento setenado `is_judging = false`. No modifica el campo `judged`. Solo administradores.

### Seguridad
- **Autenticación**: Requiere token Bearer
- **Permisos**: Solo administradores (`role_id == '1'`)

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parámetros de ruta
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del concurso |

### Body
No requiere body.

### Ejemplo de Solicitud
```bash
curl -X PUT "http://localhost:3000/api/contest/5/disable-judging" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Concurso Anual 2026",
    "is_judging": false,
    "judged": false,
    "judging_stage": "preseleccion"
  },
  "message": "El concurso \"Concurso Anual 2026\" ha sido sacado de la etapa de juzgamiento"
}
```

### Respuesta: Concurso no encontrado (404)
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

### Respuesta: Acceso denegado (403)
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder a este recurso."
}
```

### Respuesta: ID inválido (400)
```json
{
  "success": false,
  "message": "ID de concurso inválido"
}
```

### Notas
- No requiere validación de jueces asignados (a diferencia de `set-judging`).
- Al sacar de juzgamiento, `judged` permanece intacto.

---

## 3. Campo `is_judging` en respuestas de concurso

El campo `is_judging` está disponible en los siguientes endpoints existentes:

### GET /api/contest/:id

```json
{
  "id": 5,
  "name": "Concurso Anual 2026",
  "is_test": false,
  "judged": false,
  "is_judging": true,
  "active": false
}
```

### GET /api/contest (listado)

```json
{
  "items": [
    {
      "id": 5,
      "name": "Concurso Anual 2026",
      "is_judging": true,
      "judged": false,
      ...
    }
  ]
}
```

### POST /api/contest (creación)

Por defecto `is_judging` se crea como `false`. No es necesario enviarlo en el body.

---

## 4. Cambiar fase del juzgamiento

### Endpoint
**PUT** `/api/contest/:id/judging-stage`

### Descripción
Cambia explícitamente la fase del juzgamiento del concurso entre `preseleccion` y `puntuacion`. El concurso debe estar en etapa de juzgamiento (`is_judging = true`).

### Seguridad
- **Autenticación**: Requiere token Bearer
- **Permisos**: Administradores (`role_id == '1'`) o jueces asignados al concurso (fila en `contest_judge`)

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Parámetros de ruta
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del concurso |

### Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `judging_stage` | string | Sí | Fase: `preseleccion` o `puntuacion` |

### Ejemplo de Solicitud
```bash
curl -X PUT "http://localhost:3000/api/contest/5/judging-stage" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"judging_stage": "puntuacion"}'
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Concurso Anual 2026",
    "is_judging": true,
    "judged": false,
    "judging_stage": "puntuacion"
  },
  "message": "El concurso \"Concurso Anual 2026\" ahora está en fase de puntuacion"
}
```

### Respuesta: Valor inválido (400)
```json
{
  "success": false,
  "message": "El campo judging_stage debe ser \"preseleccion\" o \"puntuacion\""
}
```

### Respuesta: Concurso no está en juzgamiento (400)
```json
{
  "success": false,
  "message": "El concurso debe estar en etapa de juzgamiento para cambiar de fase"
}
```

### Respuesta: Acceso denegado (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores o jueces del concurso"
}
```

### Respuesta: Concurso no encontrado (404)
```json
{
  "success": false,
  "message": "Concurso no encontrado"
}
```

### Notas
- El concurso debe estar en juzgamiento (`is_judging = true`) para poder cambiar de fase.
- Un juez solo puede cambiar la fase de los concursos donde está asignado.
- El administrador puede cambiar la fase de cualquier concurso, sin estar asignado como juez.
