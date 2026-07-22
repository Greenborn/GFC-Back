# Endpoint: Contest Preselected Photo (Preselección de Fotos por Jurado)

## Descripción
Gestión de fotos preseleccionadas por los jueces de un concurso. Permite a los jueces marcar/desmarcar fotos como preseleccionadas y consultar el listado de fotos preseleccionadas con sus votos.

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación**: Todos los endpoints requieren token Bearer
- **Permisos**: Solo usuarios que son **jueces del concurso** (`contest_judge`) pueden acceder
- **Protección escritura**: El endpoint POST respeta `MODO_ESCRITURA` (`READ_ONLY`/`READ_WRITE`)

---

## 1. Listar Fotos Preseleccionadas

### Endpoint
**GET** `/api/contest-preselected-photo`

### Descripción
Obtiene el listado de fotos preseleccionadas de un concurso. Solo jueces del concurso.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |
| `expand` | string | No | Campos a expandir. Soporta `image` para incluir datos de la foto |

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:3000/api/contest-preselected-photo?contest_id=1&expand=image" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 1,
      "contest_id": 1,
      "image_id": 100,
      "preselected": true,
      "votes": [5, 8, 12],
      "vote_count": 3,
      "image": {
        "id": 100,
        "code": "3336_2025_38_Color_10047",
        "title": "A LA DERECHA",
        "url": "/images/2025/Primera/Color/3336_2025_38_Color_10047.jpg"
      }
    }
  ]
}
```

### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "El parámetro contest_id es obligatorio"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo jueces del concurso pueden ver las fotos preseleccionadas"
}
```

---

## 2. Definir Estado de Preselección

### Endpoint
**POST** `/api/contest-preselected-photo`

### Descripción
Marca o desmarca una foto como preseleccionada. Cada juez emite su voto individual. Si al menos un juez votó a favor, la foto queda como `preselected: true`. Solo jueces del concurso.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body de Request
```json
{
  "contest_id": 1,
  "image_id": 100,
  "preselected": true
}
```

### Comportamiento
- Si `preselected: true`: agrega el `user_id` del juez actual al array `votes` (si no estaba ya)
- Si `preselected: false`: remueve el `user_id` del juez actual del array `votes`
- `preselected` se establece como `true` si hay al menos un voto en el array

### Respuesta Exitosa (201) - Nuevo registro
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contest_id": 1,
    "image_id": 100,
    "preselected": true,
    "votes": "[5]"
  }
}
```

### Respuesta Exitosa (200) - Actualización
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contest_id": 1,
    "image_id": 100,
    "preselected": false,
    "votes": "[]"
  }
}
```

### Respuesta de Error (400) - Campos faltantes
```json
{
  "success": false,
  "message": "Los campos contest_id, image_id y preselected son obligatorios"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo jueces del concurso pueden definir preselección"
}
```

---

## Estructura de Tabla

### `contest_preselected_photo`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK | Identificador único |
| `contest_id` | INTEGER NOT NULL | FK → `contest.id` |
| `image_id` | INTEGER NOT NULL | FK → `image.id` |
| `preselected` | BOOLEAN | Indica si la foto está preseleccionada |
| `votes` | JSON/TEXT | Array de IDs de usuarios que votaron a favor |

**Restricciones:**
- Unique: `(contest_id, image_id)`
- Foreign Key: `contest_id` → `contest.id` ON DELETE CASCADE
- Foreign Key: `image_id` → `image.id` ON DELETE CASCADE

---

**Navegación**: [README](README.md) | [Endpoints](endpoints.md) | [Volver al README Principal](../../README.md)
