# Imagen (Image)

**`POST`** `/images`

Crea un registro de imagen en el sistema. Soporta carga mediante base64 (a través de `photo_base64`) o URL directa.

---

## Request

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Query Params (opcional)

```
?unique_id=req_xxx   (solo para tokens SSO)
```

### Body

```json
{
  "code": "Co68Ca1S2-",
  "title": "Mi Fotografía",
  "profile_id": 386,
  "photo_base64": {
    "file": "data:image/jpeg;base64,/9j/4AAQ...",
    "name": "foto.jpg"
  },
  "url": "_"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `code` | string | **sí** | Código único de la imagen (max 20 chars) |
| `title` | string | **sí** | Título de la imagen (max 45 chars) |
| `profile_id` | integer | **sí** | ID del perfil propietario |
| `photo_base64` | object | no | Objeto con `file` (data URI) y opcional `name` |
| `url` | string | no | URL directa de la imagen. Si es `"_"` se ignora |

> Si se envía `photo_base64`, la imagen se procesa y guarda automáticamente, y `url` se genera internamente.
> Si se envía `url`, se usa directamente sin procesamiento de imagen.

---

## Ejemplo completo

```bash
curl -X POST 'https://gfc.prod-api.greenborn.com.ar/api/images?unique_id=req_abc123' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "Co68Ca1S2-",
    "title": "test",
    "profile_id": 386,
    "photo_base64": {
      "file": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      "name": "673857967_1476837757468867_4371297213981386927_n.jpg"
    },
    "url": "_"
  }'
```

---

## Respuestas

### 201 — Imagen creada

```json
{
  "success": true,
  "data": {
    "id": 512,
    "code": "Co68Ca1S2-",
    "title": "test",
    "profile_id": 386,
    "url": "images/1719000000_a1b2c3d4.jpg"
  }
}
```

### 400 — Campos requeridos faltantes

```json
{
  "success": false,
  "message": "code, title y profile_id son requeridos"
}
```

### 400 — Sin imagen

```json
{
  "success": false,
  "message": "Debe proporcionar una imagen (photo_base64) o una url"
}
```

### 403 — Sin permisos

```json
// Concursante intenta crear imagen para otro perfil
{ "success": false, "message": "No puede crear una imagen para un perfil que no le pertenece" }

// Admin intenta crear imagen para su propio perfil
{ "success": false, "message": "Un administrador no puede crear imágenes para su propio perfil" }
```

---

## Autorización por rol

| Rol | Comportamiento |
|-----|----------------|
| `1` (Administrador) | Puede crear imágenes para **cualquier perfil excepto el suyo propio** |
| `2` (Delegado) | Puede crear imágenes para cualquier perfil |
| `3` (Concursante) | Solo puede crear imágenes para su **propio perfil** |

---

## Procesamiento de imagen

Cuando se envía `photo_base64.file` (data URI), la imagen se procesa automáticamente:

1. Se extrae el contenido base64 (se elimina el prefijo `data:image/...;base64,`)
2. Se procesa con `sharp`:
   - Rotación automática según EXIF
   - Redimensiona a máximo **1920px** en su lado mayor (sin aumentar si es menor)
   - Convierte a **JPEG calidad 100**
3. Se guarda en `{IMG_REPOSITORY_PATH}/images/{timestamp}_{random}.jpg`
4. La `url` se setea como `images/{timestamp}_{random}.jpg`

---

## Errores

| Código | Condición | Respuesta |
|--------|-----------|-----------|
| 400 | Falta `code`, `title` o `profile_id` | `{ "success": false, "message": "code, title y profile_id son requeridos" }` |
| 400 | `photo_base64.file` inválido | `{ "success": false, "message": "Formato de imagen inválido" }` |
| 400 | Sin imagen ni url | `{ "success": false, "message": "Debe proporcionar una imagen (photo_base64) o una url" }` |
| 403 | Concursante para otro perfil | `{ "success": false, "message": "No puede crear una imagen para un perfil que no le pertenece" }` |
| 403 | Admin para su propio perfil | `{ "success": false, "message": "Un administrador no puede crear imágenes para su propio perfil" }` |
| 500 | Error interno | `{ "success": false, "message": "Error al crear imagen", "error": "..." }` |

---

## Notas técnicas

- **Auth**: usa `authMiddleware` (compatible con tokens locales y SSO)
- **Write Protection**: respeta `MODO_ESCRITURA=READ_ONLY` (retorna `503`)
- **SSO**: los tokens SSO requieren `?unique_id=` en la URL
- **Log**: cada creación se registra en `log_operaciones`
- **Procesamiento**: usa `sharp` para redimensionar y convertir a JPEG con calidad 100
- **Directorios**: las imágenes se guardan en `{IMG_REPOSITORY_PATH}/images/` (configurable en `.env`)
