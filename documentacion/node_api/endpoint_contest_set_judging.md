# Endpoint: Set Judging (Poner Concurso en Juzgamiento)

## Descripción
Permite a un administrador poner un concurso en etapa de juzgamiento. Esto setea `is_judging = true` y automáticamente `judged = false` (si estaba juzgado se resetea).

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
    "judged": false
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
- El campo `is_judging` se expone como booleano en todas las respuestas del concurso (`GET /contest/:id`, `GET /contest/`, etc.).

---

## 2. Campo `is_judging` en respuestas de concurso

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
