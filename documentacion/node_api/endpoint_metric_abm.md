# Métricas ABM (MetricABM)

CRUD completo para la tabla `metric_abm` — catálogo de premios/puntajes y su tipo de organización.

**Base URL:** `https://gfc.prod-api.greenborn.com.ar/api/metric-abm`

---

## Tabla `metric_abm`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer (PK) | ID autoincremental |
| `prize` | varchar(10) | Nombre del premio (ej: `1er PREMIO`, `ACEPTADA`) |
| `score` | integer | Puntaje asignado al premio (unique) |
| `organization_type` | enum | Tipo: `INTERNO`, `EXTERNO`, `EXTERNO_0`, `EXTERNO_UNICEN` |

---

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/` | authMiddleware | Listar todas las métricas |
| `GET` | `/:id` | authMiddleware | Obtener una métrica por ID |
| `POST` | `/` | authMiddleware + writeProtection | Crear nueva métrica |
| `PUT` | `/:id` | authMiddleware + writeProtection | Actualizar métrica |
| `DELETE` | `/:id` | authMiddleware + writeProtection (solo admin) | Eliminar métrica |

---

## 1. Listar métricas

**`GET`** `/api/metric-abm`

### Headers

```
Authorization: Bearer <token>
```

### Query Params (opcional)

```
?unique_id=req_xxx   (solo para tokens SSO)
```

### Ejemplo

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/metric-abm?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

### Response (200)

```json
{
  "success": true,
  "items": [
    {
      "id": 1,
      "prize": "1er PREMIO",
      "score": 15,
      "organization_type": "INTERNO"
    },
    {
      "id": 2,
      "prize": "ACEPTADA",
      "score": 5,
      "organization_type": "INTERNO"
    }
  ]
}
```

---

## 2. Obtener métrica por ID

**`GET`** `/api/metric-abm/:id`

```bash
curl 'https://gfc.prod-api.greenborn.com.ar/api/metric-abm/1?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

### Response (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "prize": "1er PREMIO",
    "score": 15,
    "organization_type": "INTERNO"
  }
}
```

### Error (404)

```json
{ "success": false, "message": "Métrica no encontrada" }
```

---

## 3. Crear métrica

**`POST`** `/api/metric-abm`

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body

```json
{
  "prize": "NUEVO PREMIO",
  "score": 10,
  "organization_type": "INTERNO"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `prize` | string | **sí** | Nombre del premio (max 10 caracteres) |
| `score` | integer | **sí** | Puntaje (entero positivo) |
| `organization_type` | string | **sí** | `INTERNO`, `EXTERNO`, `EXTERNO_0` o `EXTERNO_UNICEN` |

### Ejemplo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/metric-abm?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"prize": "MENCION", "score": 8, "organization_type": "INTERNO"}'
```

### Response (201)

```json
{
  "success": true,
  "data": {
    "id": 15,
    "prize": "MENCION",
    "score": 8,
    "organization_type": "INTERNO"
  }
}
```

### Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Falta `prize`, `score` o `organization_type` | `{ "success": false, "message": "prize, score y organization_type son requeridos" }` |
| 400 | `score` no es entero positivo | `{ "success": false, "message": "El score debe ser un número entero positivo" }` |
| 400 | `organization_type` inválido | `{ "success": false, "message": "Tipo de organización inválido. Valores: INTERNO, EXTERNO, EXTERNO_0, EXTERNO_UNICEN" }` |

---

## 4. Actualizar métrica

**`PUT`** `/api/metric-abm/:id`

### Body (mismos campos que POST)

```json
{
  "prize": "1er PREMIO",
  "score": 20,
  "organization_type": "EXTERNO"
}
```

### Ejemplo

```bash
curl -X PUT 'https://gfc.prod-api.greenborn.com.ar/api/metric-abm/1?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"prize": "1er PREMIO", "score": 20, "organization_type": "EXTERNO"}'
```

### Response (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "prize": "1er PREMIO",
    "score": 20,
    "organization_type": "EXTERNO"
  }
}
```

### Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | ID inválido | `{ "success": false, "message": "ID inválido" }` |
| 404 | ID no existe | `{ "success": false, "message": "Métrica no encontrada" }` |
| 400 | Validación de campos | (mismos que POST) |

---

## 5. Eliminar métrica

**`DELETE`** `/api/metric-abm/:id`

**Requiere rol `1` (Administrador).**

### Ejemplo

```bash
curl -X DELETE 'https://gfc.prod-api.greenborn.com.ar/api/metric-abm/15?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>'
```

### Response (200)

```json
{
  "success": true,
  "message": "Métrica eliminada correctamente"
}
```

### Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 403 | No es admin | `{ "success": false, "message": "Solo administradores pueden eliminar métricas" }` |
| 404 | ID no existe | `{ "success": false, "message": "Métrica no encontrada" }` |

---

## Notas técnicas

- **Auth**: todos los endpoints usan `authMiddleware` (compatible con tokens locales y SSO)
- **Write Protection**: `POST`, `PUT`, `DELETE` respetan `MODO_ESCRITURA=READ_ONLY` (retornan `503`)
- **SSO**: los tokens SSO requieren `?unique_id=` en la URL
- **Log**: todas las operaciones se registran en `log_operaciones` con el evento correspondiente
- **Score unique**: la BD tiene una constraint `UNIQUE(score)`. Si se intenta duplicar un score, la BD lanzará error
- **Trigger BD**: PostgreSQL tiene un trigger que bloquea modificaciones mientras haya concursos vigentes
