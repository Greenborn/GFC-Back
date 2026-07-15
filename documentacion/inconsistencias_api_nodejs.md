# Inconsistencias en la API Node.js (`node_api/`)

> Generado: 2026-07-15

---

## 🔴 Críticas

### 1. Dead routes en `ranking.js`
`module.exports = router;` está colocado **antes** de las rutas `/detalle/:profile_id` (línea 182) y `/detalle` (línea 308).  
→ Esas rutas nunca se registran y no responden a ninguna petición.

### 2. `gfc_web_sockets.js` importa archivos inexistentes
El archivo contiene:
```js
const Auth = require('./Auth.js')
const Juez = require('./Juez.js')
```
`Auth.js` y `Juez.js` no existen en el proyecto. El archivo no se carga desde `server.js` (código muerto).

### 3. `PUT /api/section/edit` sin ningún middleware
Cualquier persona puede editar secciones.

### 4. `PUT /api/metric/edit` sin ningún middleware
Cualquier persona puede editar métricas.

### 5. `GET /api/log/get_all` sin middleware
Cualquier persona puede ver todos los logs de operaciones.

---

## 🟡 Inconsistencias de autenticación

### 6. Mezcla de auth por sesión vs token
- Endpoints que usan `req.session.user` (login con sesión):
  - `routes/category.js` (`get_all`, `edit`)
  - `routes/section.js` (`get_all`, `edit`)
  - `routes/metrics.js` (`get_all`, `edit`)
  - `routes/contest.js` (`get_all`)
- Endpoints que usan `req.user` (Bearer token vía `authMiddleware`):
  - Todos los demás endpoints protegidos.

**Problema:** Usuarios que autentican vía SSO no tienen sesión (`req.session.user` = `undefined`), por lo que fallan en los primeros.

### 7. `PUT /api/category/edit` sin `authMiddleware`
Tiene `writeProtection` pero **no** `authMiddleware` ni `adminMiddleware`.  
Usa `req.session.user` que puede ser `undefined`.

---

## 🟡 Formatos de respuesta inconsistentes

### 8. Al menos 4 formatos distintos
| Formato | Archivos |
|---|---|
| `{ r: false, error: '...' }` | `auth.js` |
| `{ stat: false, text: '...' }` | `category.js`, `section.js`, `metrics.js`, `fotoclub.js`, `footer.js` |
| `{ success: false, message: '...' }` | `user.js`, `profile.js`, `contest.js`, `images.js`, `metric-abm.js` |
| `{ message: '...' }` (sin flag) | `contest.js`, `section.js` |

---

## 🟡 Endpoints sin `writeProtection` en operaciones de escritura

9. `POST /api/results/judging`
10. `POST /api/results/recalcular-ranking`
11. `PUT /api/contests/:id` (tiene `adminMiddleware` pero no `writeProtection`)

---

## 🟡 Endpoints públicos cuestionables

12. `GET /api/category/get_all` — sin middleware, referencia interna a `req.session.user`
13. `GET /api/section/get_all` — sin middleware, referencia interna a `req.session.user`

---

## 🔵 Otras observaciones

14. **Ruta `foto-del-anio` duplicada** — existe en `contestresult.js:619` y en `routes/foto_del_anio.js`
15. **`contestresult.js` contiene `POST /disable_user`** — pertenecería más lógicamente a `user.js` o un admin controller
16. **`contest.js` montado bajo dos prefijos** (`/api/contests` y `/api/contest`) — intencional pero puede causar confusión
17. **Sin capa de validación centralizada** — cada endpoint valida manualmente con distintos approach
18. **Paths hardcodeados** — `IMG_REPOSITORY_PATH` y `URL_AUTH_SERVICE` con fallbacks hardcodeados en múltiples archivos
