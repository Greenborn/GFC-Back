---
name: agregar_propiedad_preferencia
description: Agregar una nueva propiedad permitida en user_preferences_meta para que los usuarios puedan guardar esa preferencia. Usar cuando se pida habilitar una nueva clave de configuración de usuario.
---

# agregar_propiedad_preferencia

**Objetivo:** Registrar una nueva clave en `user_preferences_meta` para habilitarla como preferencia de usuario. Sin este registro, el endpoint `PUT /api/user/preferences` rechazará la clave con error `invalid_keys`.

## Tabla destino

`user_preferences_meta` en la base de datos PostgreSQL.

### Esquema

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `integer PK` | Autoincremental |
| `key` | `varchar(100) UNIQUE` | Clave única de la propiedad |
| `description` | `text` | Descripción de para qué sirve |
| `value_type` | `varchar(50)` | Tipo de valor esperado |
| `created_at` | `datetime` | Fecha de creación |

### `value_type` disponibles

- `string` — Texto plano
- `number` — Valor numérico
- `boolean` — true/false
- `json` — Objeto JSON

## Cómo agregar una propiedad

Ejecutar en la base de datos:

```sql
INSERT INTO user_preferences_meta (key, description, value_type, created_at)
VALUES ('theme', 'Tema visual del usuario (dark/light)', 'string', NOW());
```

O desde el backend con Knex:

```javascript
await global.knex('user_preferences_meta').insert({
  key: 'theme',
  description: 'Tema visual del usuario (dark/light)',
  value_type: 'string',
  created_at: new Date()
});
```

## Verificación

1. Insertar el registro en `user_preferences_meta`
2. Llamar `PUT /api/user/preferences` con `{"theme": "dark"}` → debe devolver `200` con los datos
3. Probar con una clave no registrada → debe devolver `400` con `invalid_keys`

## Endpoints relacionados

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/user/preferences` | Obtener todas las preferencias del usuario |
| `GET` | `/api/user/preferences/:key` | Obtener una preferencia específica |
| `PUT` | `/api/user/preferences` | Guardar/actualizar preferencias (valida contra meta) |
| `DELETE` | `/api/user/preferences/:key` | Eliminar una preferencia |

## Documentación

- [endpoint_user_preferences.md](../../../documentacion/node_api/endpoint_user_preferences.md) — Documentación completa de endpoints
