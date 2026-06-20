# Métrica (Metric)

**`POST`** `/metric`

Crea un registro en la tabla `metric` — asignación de premio/puntaje para resultados de concursos.

> ⚠️ Diferenciar de `metric_abm`: `metric` almacena los premios asignados en resultados de concursos (tabla `contest_result`), mientras que `metric_abm` es el catálogo de referencia de premios/puntajes.

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
  "prize": "0",
  "score": 0
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `prize` | string | **sí** | Nombre del premio (max 10 caracteres) |
| `score` | integer | **sí** | Puntaje (entero positivo) |

---

## Ejemplo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/metric?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"prize": "0", "score": 0}'
```

---

## Respuestas

### 201 — Métrica creada

```json
{
  "success": true,
  "data": {
    "id": 42,
    "prize": "0",
    "score": 0
  }
}
```

### 400 — Campos requeridos faltantes

```json
{
  "success": false,
  "message": "prize y score son requeridos"
}
```

### 400 — Score inválido

```json
{
  "success": false,
  "message": "El score debe ser un número entero positivo"
}
```

---

## Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Falta `prize` o `score` | `{ "success": false, "message": "prize y score son requeridos" }` |
| 400 | `score` no es entero positivo | `{ "success": false, "message": "El score debe ser un número entero positivo" }` |
| 500 | Error interno | `{ "success": false, "message": "Error al crear métrica", "error": "..." }` |

---

## Notas técnicas

- **Auth**: usa `authMiddleware` (compatible con tokens locales y SSO)
- **Write Protection**: respeta `MODO_ESCRITURA=READ_ONLY` (retorna `503`)
- **SSO**: los tokens SSO requieren `?unique_id=` en la URL
- **Log**: cada creación se registra en `log_operaciones`
- **Tabla**: opera sobre la tabla `metric` (no `metric_abm`)
- **Uso**: la tabla `metric` es referenciada por `contest_result.metric_id` para asignar puntajes en resultados de concursos
