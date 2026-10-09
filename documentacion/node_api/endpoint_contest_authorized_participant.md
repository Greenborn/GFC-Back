# Endpoint: Contest Authorized Participant (Participantes Autorizados de Concurso)

## Descripción
Gestión del listado de participantes autorizados de un concurso. Permite a un administrador subir un archivo (CSV, XLSX o PDF) con el padrón de personas habilitadas a participar, previsualizar el resultado del parseo antes de persistirlo, confirmar la importación (que **reemplaza por completo** el listado anterior del concurso) y consultar el padrón vigente. Se usa, entre otras cosas, para marcar en el listado de concursantes a quienes se inscribieron pero no figuran en el padrón (comparación por DNI, ignorando puntos).

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación**: Todos los endpoints requieren token Bearer.
- **Permisos de escritura**: Solo administradores (`role_id == '1'`) pueden parsear (`/parse`) o confirmar (`/confirm`) un listado.
- **Protección escritura**: El endpoint `POST /confirm` respeta `MODO_ESCRITURA` (`READ_ONLY`/`READ_WRITE`).
- **Columna obligatoria**: Del archivo subido, sólo la columna DNI es obligatoria (apellido, nombre, fecha de nacimiento, facultad y disciplina son opcionales). Filas sin DNI se excluyen automáticamente, sin bloquear la importación.

---

## 1. Listar Participantes Autorizados de un Concurso

### Endpoint
**GET** `/api/contest-authorized-participants`

### Descripción
Obtiene el padrón de participantes autorizados vigente de un concurso.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 1,
      "contest_id": 1,
      "last_name": "Pérez",
      "first_name": "Juan",
      "dni": "30.123.456",
      "dni_normalized": "30123456",
      "birth_date": "01/01/1990",
      "faculty": "Ingeniería",
      "discipline": "Fotografía",
      "created_at": "2026-10-09T12:00:00.000Z"
    }
  ]
}
```

---

## 2. Consultar Estado del Padrón

### Endpoint
**GET** `/api/contest-authorized-participants/status`

### Descripción
Devuelve si un concurso tiene un padrón cargado, cuántas filas tiene y cuándo se cargó.

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |

### Respuesta Exitosa (200)
```json
{
  "has_list": true,
  "count": 120,
  "uploaded_at": "2026-10-09T12:00:00.000Z"
}
```

---

## 3. Parsear Archivo (Preview, sin persistir)

### Endpoint
**POST** `/api/contest-authorized-participants/parse`

### Descripción
Sube un archivo CSV, XLSX o PDF y lo parsea en el backend, devolviendo las filas reconocidas y estadísticas. **No persiste nada en la base de datos.**

### Headers
```
Authorization: Bearer <token_admin>
Content-Type: multipart/form-data
```

### Body (multipart/form-data)
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |
| `file` | file | Sí | Archivo `.csv`, `.xlsx` o `.pdf` (máx. 5MB) |

### Ejemplo de Solicitud
```bash
curl -X POST "http://localhost:3000/api/contest-authorized-participants/parse" \
  -H "Authorization: Bearer <token>" \
  -F "contest_id=1" \
  -F "file=@padron.csv"
```

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "rows": [
    {
      "last_name": "Pérez",
      "first_name": "Juan",
      "dni": "30.123.456",
      "dni_normalized": "30123456",
      "birth_date": "01/01/1990",
      "faculty": "Ingeniería",
      "discipline": "Fotografía"
    }
  ],
  "stats": {
    "total_rows": 125,
    "valid_rows": 120,
    "skipped_no_dni": 4,
    "skipped_duplicate": 1
  }
}
```

### Respuesta de Error (400) - Columna DNI no encontrada
```json
{
  "success": false,
  "message": "No se encontró una columna de DNI en el archivo"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden acceder a este recurso."
}
```

### Respuesta de Error (404) - Concurso no existe
```json
{
  "success": false,
  "message": "El concurso especificado no existe"
}
```

---

## 4. Confirmar Importación (Persiste, reemplaza el padrón anterior)

### Endpoint
**POST** `/api/contest-authorized-participants/confirm`

### Descripción
Persiste el listado previsualizado por `/parse`. **Reemplaza por completo** el padrón anterior del concurso (borra todas las filas existentes y luego inserta las nuevas, en una transacción). El servidor vuelve a sanear las filas recibidas (normaliza DNI, descarta filas sin DNI o duplicadas) sin confiar ciegamente en lo enviado por el cliente.

### Headers
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

### Body de Request
```json
{
  "contest_id": 1,
  "rows": [
    { "last_name": "Pérez", "first_name": "Juan", "dni": "30.123.456", "birth_date": "01/01/1990", "faculty": "Ingeniería", "discipline": "Fotografía" }
  ]
}
```

### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": { "contest_id": 1, "imported_count": 120 }
}
```

### Respuesta de Error (400) - Sin filas válidas
```json
{
  "success": false,
  "message": "No hay filas válidas para importar (todas carecen de DNI)"
}
```

### Respuesta de Error (503) - Modo solo lectura
```json
{
  "success": false,
  "message": "Sistema en modo de solo lectura",
  "error": "READ_ONLY_MODE"
}
```

---

## Estructura de Tabla

### `contest_authorized_participant`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK | Identificador único |
| `contest_id` | INTEGER NOT NULL | FK → `contest.id` |
| `last_name` | VARCHAR(255) | Apellido (opcional) |
| `first_name` | VARCHAR(255) | Nombre (opcional) |
| `dni` | VARCHAR(25) NOT NULL | DNI tal cual figura en el archivo |
| `dni_normalized` | VARCHAR(25) NOT NULL | DNI sin puntos ni espacios, usado para lookups y unicidad |
| `birth_date` | VARCHAR(30) | Fecha de nacimiento como texto crudo (opcional) |
| `faculty` | VARCHAR(255) | Facultad (opcional) |
| `discipline` | VARCHAR(255) | Disciplina (opcional) |
| `created_at` | DATETIME NOT NULL | Fecha de carga del listado |

**Restricciones:**
- Unique: `(contest_id, dni_normalized)`
- Índice: `(contest_id, dni_normalized)`
- Foreign Key: `contest_id` → `contest.id` ON DELETE CASCADE

---

## Uso en el listado de concursantes

El frontend consulta `GET /api/contest-authorized-participants?contest_id=<id>` para armar el conjunto de DNIs normalizados autorizados, y marca con un badge "No habilitado" a los inscriptos (`profile.dni`, normalizado) que no figuren en ese conjunto. Si el concurso no tiene ningún participante autorizado cargado (padrón vacío), no se muestra ningún badge.

---

**Navegación**: [README](README.md) | [Endpoints](endpoints.md) | [Volver al README Principal](../../README.md)
