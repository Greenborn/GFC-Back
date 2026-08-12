# Endpoint: Contest Judge (Jueces de Concurso)

## Descripción
Gestión de jueces asignados a concursos. Permite listar, agregar y quitar usuarios que oficiarán como jueces de un concurso.

## Base URL
```
http://localhost:3000/api
```

## Seguridad
- **Autenticación**: Todos los endpoints requieren token Bearer
- **Permisos de escritura**: Solo administradores (`role_id == '1'`) pueden agregar o quitar jueces
- **Protección escritura**: Los endpoints POST y DELETE respetan `MODO_ESCRITURA` (`READ_ONLY`/`READ_WRITE`)

---

## 1. Listar Jueces de un Concurso

### Endpoint
**GET** `/api/contest-judge`

### Descripción
Obtiene la lista de usuarios asignados como jueces de un concurso específico.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:3000/api/contest-judge?contest_id=1" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "id": 1,
      "contest_id": 1,
      "user_id": 5,
      "created_at": "2026-07-22T12:00:00.000Z",
      "user": {
        "id": 5,
        "username": "juez1",
        "email": "juez1@example.com",
        "profile_id": 10
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

---

## 2. Agregar Juez a un Concurso

### Endpoint
**POST** `/api/contest-judge`

### Descripción
Asigna un usuario como juez de un concurso. Solo administradores.

### Headers
```
Authorization: Bearer <token_admin>
Content-Type: application/json
```

### Body de Request
```json
{
  "contest_id": 1,
  "user_id": 5
}
```

### Respuesta Exitosa (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contest_id": 1,
    "user_id": 5,
    "created_at": "2026-07-22T12:00:00.000Z"
  }
}
```

### Respuesta de Error (400) - Campos faltantes
```json
{
  "success": false,
  "message": "Los campos contest_id y user_id son obligatorios"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden agregar jueces"
}
```

### Respuesta de Error (404) - Concurso no existe
```json
{
  "success": false,
  "message": "El concurso especificado no existe"
}
```

### Respuesta de Error (404) - Usuario no existe
```json
{
  "success": false,
  "message": "El usuario especificado no existe"
}
```

### Respuesta de Error (409) - Duplicado
```json
{
  "success": false,
  "message": "El usuario ya es juez de este concurso"
}
```

---

## 3. Quitar Juez de un Concurso

### Endpoint
**DELETE** `/api/contest-judge/{id}`

### Descripción
Remueve un juez de un concurso por su ID de registro. Solo administradores.

### Headers
```
Authorization: Bearer <token_admin>
```

### Path Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | integer | Sí | ID del registro `contest_judge` |

### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Juez removido correctamente del concurso"
}
```

### Respuesta de Error (400)
```json
{
  "success": false,
  "message": "ID inválido"
}
```

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Acceso denegado: solo administradores pueden quitar jueces"
}
```

### Respuesta de Error (404)
```json
{
  "success": false,
  "message": "Registro de juez no encontrado"
}
```

---

## 4. Juez Activo (Heartbeat) — Reemplazado por WebSocket

> **Deprecado**: La presencia/actividad de jueces ahora se maneja por **WebSocket (socket.io)**. El endpoint HTTP `/api/contest-judge/heartbeat` fue reemplazado y responde `410 Gone`.

El heartbeat ahora se envía por el canal de socket.io emitiendo el evento `contest:heartbeat`. Consultar [Presencia de jueces por WebSocket](#6-presencia-de-jueces-por-websocket) para el contrato completo.

- **Condición obligatoria**: El concurso debe estar en juzgamiento (`is_judging = true`), de lo contrario se rechaza con error.
- **Validación con cache**: Para no consultar la DB en cada heartbeat, la pertenencia del juez al concurso se valida contra una cache en memoria de la tabla `contest_judge` (TTL de 1 hora).
- **Almacenamiento**: La actividad se guarda en un objeto en memoria (`Map`). No persiste en DB.
- **Ventana de actividad**: Un juez se considera activo si su último heartbeat es ≤ 1 minuto.

---

## 5. Consultar Jueces Activos

### Endpoint
**GET** `/api/contest-judge/active`

### Descripción
Devuelve la lista de jueces del concurso que están activos (enviaron heartbeat en el último minuto), junto con su timestamp de última actividad.

### Seguridad
- **Autenticación**: Requiere token Bearer
- **Permisos**: Administradores (`role_id == '1'`) o jueces del concurso (fila en `contest_judge`)

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `contest_id` | integer | Sí | ID del concurso |

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:3000/api/contest-judge/active?contest_id=5" \
  -H "Authorization: Bearer <token>"
```

### Respuesta Exitosa (200)
```json
{
  "items": [
    {
      "user_id": 5,
      "last_active": 1720000000000,
      "user": {
        "id": 5,
        "username": "juez1",
        "email": "juez1@example.com",
        "profile_id": 10
      }
    }
  ],
  "is_judging": true
}
```

### Respuesta de Error (400) - Falta contest_id
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
  "message": "Acceso denegado: solo administradores o jueces del concurso pueden ver jueces activos"
}
```

### Notas
- `last_active` es el timestamp (epoch ms) del último heartbeat del juez.
- Solo se incluyen jueces cuyo heartbeat es ≤ 1 minuto.
- `is_judging` indica si el concurso está actualmente en fase de juzgamiento.
- Este endpoint **no requiere** protección de escritura (es de solo lectura).

---

## 6. Presencia de Jueces por WebSocket

La presencia de jueces (jueces presentes/online) se maneja en tiempo real por **socket.io** (mismo servidor HTTP, autenticado vía SSO). El servidor expone la sala `contest:{contest_id}` y tres funciones (`onFunction`). Reemplaza al antiguo endpoint HTTP de heartbeat.

### Conexión

El cliente se conecta a socket.io con el token SSO/local en el handshake de autenticación:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/socket.io',
  auth: { token: '<access_token>', unique_id: '<unique_id si es SSO>' }
});
```

### Funciones (Cliente → Servidor)

Todas usan el patrón con callback ACK.

#### `contest:join` — Unirse a la sala de un concurso

```js
socket.emit('contest:join', { contest_id: 5 }, (res) => {
  console.log(res.success, res.items, res.is_judging);
});
```

- **Validación**: concurso existe, usuario es administrador (`role_id == '1'`) o juez del concurso.
- **Acción**: une el socket a la sala `contest:5`. Si el usuario es juez del concurso **y** el concurso está en juzgamiento (`is_judging`), lo marca como presente (`markActive`).
- **ACK**: `{ success, items, is_judging }` con la lista actual de presentes.
- **Admite watch**: un administrador que no es juez se une a la sala y recibe las actualizaciones sin contarse como juez presente.

#### `contest:heartbeat` — Mantener viva la presencia (en lugar del HTTP)

```js
socket.emit('contest:heartbeat', { contest_id: 5 }, (res) => {
  console.log(res.success, res.last_active);
});
```

- **Validación**: concurso existe, `is_judging === true`, y el usuario es juez del concurso.
- **Acción**: renueva el timestamp de actividad del juez (ventana de 1 minuto). No emite broadcast (solo keep-alive).
- **ACK**: `{ success, contest_id, is_judging, last_active }`.
- El frontend debe emitirlo periódicamente (p. ej. cada 20-30 s) mientras el juez está en la pantalla de juzgamiento.

#### `contest:leave` — Salir de la sala

```js
socket.emit('contest:leave', { contest_id: 5 }, (res) => console.log(res.success));
```

- **Acción**: deja la sala y difunde la presencia actualizada.
- **ACK**: `{ success }`.

### Evento (Servidor → Cliente)

#### `contest:judges:update` — Cambios en la presencia

Se emite a la sala `contest:{contest_id}` cuando cambia la presencia (un juez entra, sale o se desconecta).

```js
socket.on('contest:judges:update', (payload) => {
  console.log(payload.contest_id, payload.items, payload.is_judging);
});
```

**Payload**:
```json
{
  "contest_id": 5,
  "items": [
    {
      "user_id": 5,
      "last_active": 1720000000000,
      "user": { "id": 5, "username": "juez1", "email": "juez1@example.com", "profile_id": 10 }
    }
  ],
  "is_judging": true
}
```

### Notas
- **Presencia efímera**: se guarda en memoria (`Map`). Al desconectarse el socket de un juez, se remueve de inmediato de la presencia.
- **Ventana de actividad**: un juez se considera presente si su último heartbeat es ≤ 1 minuto.
- **Sala por concurso**: `contest:{contest_id}`. Solo administradores y jueces del concurso pueden unirse.
- Para carga inicial / REST, sigue disponible `GET /api/contest-judge/active` (mismo formato de respuesta).

---

## 7. Validación en Inscripción

Al inscribir un perfil en un concurso (`POST /api/profile-contest`), el sistema valida automáticamente que el usuario asociado al perfil **no sea un juez** del concurso. Si lo es, la inscripción es rechazada.

### Respuesta de Error (403)
```json
{
  "success": false,
  "message": "Un juez del concurso no puede inscribirse como participante"
}
```

---

## Estructura de Tabla

### `contest_judge`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK | Identificador único |
| `contest_id` | INTEGER NOT NULL | FK → `contest.id` |
| `user_id` | INTEGER NOT NULL | FK → `user.id` |
| `created_at` | DATETIME NOT NULL | Fecha de asignación |

**Restricciones:**
- Unique: `(contest_id, user_id)`
- Foreign Key: `contest_id` → `contest.id` ON DELETE CASCADE
- Foreign Key: `user_id` → `user.id` ON DELETE CASCADE

---

**Navegación**: [README](README.md) | [Endpoints](endpoints.md) | [Volver al README Principal](../../README.md)
