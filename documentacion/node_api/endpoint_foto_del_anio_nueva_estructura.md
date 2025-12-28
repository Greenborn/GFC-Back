# Endpoint Fotos del Año - Nueva Estructura

## Descripción General

El endpoint de registro de fotografías del año ha sido rediseñado para aceptar una estructura jerárquica de directorios que refleja la organización de premios del concurso. Las fotografías pueden repetirse en diferentes categorías/premios.

## Endpoints

### POST `/api/foto-del-anio`

**Autenticación:** Requerida (Solo administradores)

**Descripción:** Registra las fotografías ganadoras del año para una temporada específica.

### GET `/api/foto-del-anio/:temporada`

**Autenticación:** Requerida (Solo administradores)

**Descripción:** Obtiene las fotografías del año de una temporada específica, incluyendo todas sus miniaturas.

## Estructura de Datos - POST

### Request Body

```json
{
  "raiz": "Fotos del año 2025",
  "directorios": {
    "eleccion_jurado": {
      "archivos": ["2416_2025_52_Color_12030.jpg"],
      "subdirectorios": {}
    },
    "eleccion_publico": {
      "archivos": ["2338_2025_51_Monocromo_11188.jpg"],
      "subdirectorios": {}
    },
    "estimulo": {
      "archivos": [],
      "subdirectorios": {
        "sub_seccion": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["8680_2025_51_Sub Sección_11111.jpg"],
              "subdirectorios": {}
            }
          }
        },
        "color": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["8020_2025_51_Color_11525.jpg"],
              "subdirectorios": {}
            }
          }
        },
        "monocromo": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["2338_2025_51_Monocromo_11188.jpg"],
              "subdirectorios": {}
            }
          }
        }
      }
    },
    "primera": {
      "archivos": [],
      "subdirectorios": {
        "sub_seccion": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["2647_2025_54_Sub Sección_12353.jpg"],
              "subdirectorios": {}
            }
          }
        },
        "color": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["2416_2025_52_Color_12030.jpg"],
              "subdirectorios": {}
            }
          }
        },
        "monocromo": {
          "archivos": [],
          "subdirectorios": {
            "eleccion_jurado": {
              "archivos": ["3216_2025_52_Monocromo_12051.jpg"],
              "subdirectorios": {}
            }
          }
        }
      }
    }
  },
  "archivos": []
}
```

## Fotografías Requeridas

El endpoint extrae exactamente **8 fotografías** de ubicaciones específicas en la estructura:

### 1. Fotografías Generales (2)

| Ubicación | Puesto | Orden |
|-----------|--------|-------|
| `directorios.eleccion_jurado.archivos[0]` | Fotografía del Año - Elección Jurado | 1 |
| `directorios.eleccion_publico.archivos[0]` | Fotografía del Año - Elección Público | 2 |

### 2. Categoría Primera (3)

| Ubicación | Puesto | Orden |
|-----------|--------|-------|
| `directorios.primera.subdirectorios.sub_seccion.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Primera - Subsección - Elección Jurado | 3 |
| `directorios.primera.subdirectorios.color.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Primera - Color - Elección Jurado | 4 |
| `directorios.primera.subdirectorios.monocromo.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Primera - Monocromo - Elección Jurado | 5 |

### 3. Categoría Estímulo (3)

| Ubicación | Puesto | Orden |
|-----------|--------|-------|
| `directorios.estimulo.subdirectorios.sub_seccion.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Estímulo - Subsección - Elección Jurado | 6 |
| `directorios.estimulo.subdirectorios.color.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Estímulo - Color - Elección Jurado | 7 |
| `directorios.estimulo.subdirectorios.monocromo.subdirectorios.eleccion_jurado.archivos[0]` | Fotografía del Año Estímulo - Monocromo - Elección Jurado | 8 |

## Proceso de Validación

El endpoint realiza las siguientes validaciones:

### 1. Validación de Estructura
- ✓ Deben estar presentes exactamente 8 fotografías en las ubicaciones especificadas
- ✓ Cada ubicación debe contener exactamente una fotografía
- ✓ **Las fotografías pueden repetirse** en diferentes categorías/premios (la misma foto puede ganar múltiples categorías)

### 2. Validación de Base de Datos
- ✓ Todas las fotografías únicas deben existir en la tabla `image`
  - El código se obtiene quitando la extensión del nombre del archivo
  - Se busca coincidencia en `image.code`
  
- ✓ Todas las fotografías deben tener resultados en `contest_result`
  - Se verifica que `contest_result.image_id` exista para cada imagen

- ✓ Todas las fotografías deben pertenecer a la misma temporada
  - Se obtienen los concursos desde `contest_result.contest_id`
  - Se verifica que todos los `contest.end_date` estén en el mismo año

### 3. Obtención de Datos Complementarios
- Para cada fotografía se obtiene:
  - **Título de la obra:** `image.title`
  - **URL de la imagen:** `image.url`
  - **Autor:** Se concatena `profile.last_name + " " + profile.name`
    - Donde `image.profile_id = profile.id`

## Proceso de Inserción

1. **Transacción:** Todo el proceso se ejecuta dentro de una transacción
2. **Eliminación:** Se eliminan registros existentes de la misma temporada
3. **Inserción:** Se insertan los nuevos 8 registros con:
   - `id_foto`: ID de la imagen (`image.id`)
   - `puesto`: Título del puesto/premio
   - `orden`: Número de orden (1-8)
   - `temporada`: Año obtenido de `contest.end_date`
   - `nombre_obra`: Título de la imagen (`image.title`)
   - `nombre_autor`: Nombre completo del autor (`profile.last_name + " " + profile.name`)
   - `url_imagen`: URL de la imagen (`image.url`)

## Respuestas - POST

### Éxito (200)

```json
{
  "success": true,
  "message": "Se registraron exitosamente 8 fotos del año para la temporada 2025",
  "data": {
    "temporada": 2025,
    "cantidad_fotos": 8
  }
}
```

### Error - Estructura Incompleta (400)

```json
{
  "success": false,
  "message": "Se requieren exactamente 8 fotografías, se encontraron 6",
  "errores": [
    "No se encontró fotografía en: directorios.eleccion_publico.archivos[0]",
    "No se encontró fotografía en: directorios.primera.subdirectorios.monocromo.subdirectorios.eleccion_jurado.archivos[0]"
  ]
}
```

### Error - Fotografías No Encontradas en BD (500)

```json
{
  "success": false,
  "message": "Error al registrar fotos del año",
  "error": "Fotografías no encontradas en la base de datos: 1234_2025_XX_Color_5678, 9876_2025_YY_Mono_4321"
}
```

### Error - Diferentes Temporadas (500)

```json
{
  "success": false,
  "message": "Error al registrar fotos del año",
  "error": "Las fotografías pertenecen a diferentes temporadas: 2024, 2025"
}
```

## Respuestas - GET

### GET `/api/foto-del-anio/:temporada`

**Éxito (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_foto": 12030,
      "puesto": "Fotografía del Año - Elección Jurado",
      "orden": 1,
      "temporada": 2025,
      "nombre_obra": "Título de la fotografía",
      "nombre_autor": "Apellido Nombre",
      "url_imagen": "https://gfc.api2.greenborn.com.ar/uploads/images/2416_2025_52_Color_12030.jpg",
      "thumbnails": [
        {
          "id": 1,
          "image_id": 12030,
          "url": "https://gfc.api2.greenborn.com.ar/uploads/thumbnails/thumb_200x150_2416_2025_52_Color_12030.jpg",
          "width": 200,
          "height": 150,
          "created_at": "2025-12-28T12:00:00.000Z"
        },
        {
          "id": 2,
          "image_id": 12030,
          "url": "https://gfc.api2.greenborn.com.ar/uploads/thumbnails/thumb_800x600_2416_2025_52_Color_12030.jpg",
          "width": 800,
          "height": 600,
          "created_at": "2025-12-28T12:00:00.000Z"
        }
      ]
    },
    {
      "id": 2,
      "id_foto": 11188,
      "puesto": "Fotografía del Año - Elección Público",
      "orden": 2,
      "temporada": 2025,
      "nombre_obra": "Otra fotografía",
      "nombre_autor": "Otro Autor",
      "url_imagen": "https://gfc.api2.greenborn.com.ar/uploads/images/2338_2025_51_Monocromo_11188.jpg",
      "thumbnails": [
        {
          "id": 3,
          "image_id": 11188,
          "url": "https://gfc.api2.greenborn.com.ar/uploads/thumbnails/thumb_200x150_2338_2025_51_Monocromo_11188.jpg",
          "width": 200,
          "height": 150,
          "created_at": "2025-12-28T12:00:00.000Z"
        }
      ]
    }
  ],
  "total": 8
}
```

**Descripción de campos retornados:**
- `id`: ID del registro en tabla `foto_del_anio`
- `id_foto`: ID de la imagen en tabla `image`
- `puesto`: Categoría/premio ganado
- `orden`: Orden de visualización (1-8)
- `temporada`: Año de la temporada
- `nombre_obra`: Título de la fotografía
- `nombre_autor`: Nombre completo del autor
- `url_imagen`: URL completa de la imagen original
- `thumbnails`: Array de miniaturas asociadas a la imagen
  - Cada miniatura incluye todos los campos de la tabla `thumbnail`
  - Puede haber múltiples miniaturas de diferentes tamaños por imagen

**Error - Temporada no especificada (400)**

```json
{
  "success": false,
  "message": "Se requiere especificar la temporada"
}
```

## Ejemplo de Uso con cURL - POST

```bash
curl 'https://gfc.api2.greenborn.com.ar/api/foto-del-anio' \
  -X POST \
  -H 'Authorization: Bearer TU_TOKEN_ADMIN' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "raiz": "Fotos del año 2025",
    "directorios": {
      "eleccion_jurado": {
        "archivos": ["2416_2025_52_Color_12030.jpg"],
        "subdirectorios": {}
      },
      "eleccion_publico": {
        "archivos": ["2338_2025_51_Monocromo_11188.jpg"],
        "subdirectorios": {}
      },
      "estimulo": {
        "archivos": [],
        "subdirectorios": {
          "sub_seccion": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["8680_2025_51_Sub Sección_11111.jpg"],
                "subdirectorios": {}
              }
            }
          },
          "color": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["8020_2025_51_Color_11525.jpg"],
                "subdirectorios": {}
              }
            }
          },
          "monocromo": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["2338_2025_51_Monocromo_11188.jpg"],
                "subdirectorios": {}
              }
            }
          }
        }
      },
      "primera": {
        "archivos": [],
        "subdirectorios": {
          "sub_seccion": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["2647_2025_54_Sub Sección_12353.jpg"],
                "subdirectorios": {}
              }
            }
          },
          "color": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["2416_2025_52_Color_12030.jpg"],
                "subdirectorios": {}
              }
            }
          },
          "monocromo": {
            "archivos": [],
            "subdirectorios": {
              "eleccion_jurado": {
                "archivos": ["3216_2025_52_Monocromo_12051.jpg"],
                "subdirectorios": {}
              }
            }
          }
        }
      }
    },
    "archivos": []
  }'
```

## Ejemplo de Uso con cURL - GET

```bash
# Obtener fotos del año 2025
curl 'https://gfc.api2.greenborn.com.ar/api/foto-del-anio/2025' \
  -H 'Authorization: Bearer TU_TOKEN_ADMIN' \
  -H 'Accept: application/json'
```

## Diagrama de Flujo - POST

```
┌─────────────────────────────────────┐
│   Recibir Request con estructura    │
│   jerárquica de directorios         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Extraer 8 fotografías de           │
│  ubicaciones específicas            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Validar que se encontraron         │
│  exactamente 8 fotografías          │
│  (pueden repetirse)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  INICIO TRANSACCIÓN                 │
│  ┌───────────────────────────────┐  │
│  │ Buscar códigos únicos en      │  │
│  │ tabla image (code, title,     │  │
│  │ profile_id, url)              │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │ Validar en contest_result     │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │ Obtener contests y verificar  │  │
│  │ misma temporada               │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │ Obtener datos de autores      │  │
│  │ (profile)                     │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │ Eliminar registros existentes │  │
│  │ de la temporada               │  │
│  └───────────────────────────────┘  │
│               │                      │
│               ▼                      │
│  ┌───────────────────────────────┐  │
│  │ Insertar 8 nuevos registros   │  │
│  │ (incluye image.url)           │  │
│  └───────────────────────────────┘  │
│                                      │
│  COMMIT TRANSACCIÓN                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Registrar operación en log         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Retornar respuesta exitosa         │
└─────────────────────────────────────┘
```

## Diagrama de Flujo - GET

```
┌─────────────────────────────────────┐
│  Recibir petición GET con           │
│  parámetro temporada                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Obtener fotos de la temporada      │
│  desde tabla foto_del_anio          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Extraer IDs únicos de fotos        │
│  (id_foto)                          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Obtener todas las miniaturas       │
│  desde tabla thumbnail              │
│  WHERE image_id IN (ids)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Agrupar miniaturas por image_id    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Combinar fotos con sus             │
│  miniaturas correspondientes        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Retornar array de fotos con        │
│  campo thumbnails[] para cada una   │
└─────────────────────────────────────┘
```

## Notas Importantes

1. **Atomicidad:** Si cualquier validación falla, se hace rollback de toda la transacción
2. **Reemplazo:** Los registros existentes de la temporada se eliminan antes de insertar los nuevos
3. **Códigos de Fotografías:** El código se obtiene quitando la extensión del archivo (.jpg, .jpeg, .png)
4. **Temporada:** Se determina automáticamente del año de `contest.end_date`
5. **Orden:** Cada fotografía tiene un orden fijo según su categoría y tipo (1-8)
6. **Logging:** Cada operación se registra en el log del sistema
7. **Fotos Repetidas:** Una misma fotografía puede aparecer en múltiples categorías/premios
8. **URL de Imagen:** Se obtiene del campo `url` de la tabla `image`, no del nombre del archivo
9. **Miniaturas:** Se obtienen todas las miniaturas asociadas a cada imagen desde la tabla `thumbnail`
10. **Consultas Eficientes:** Las miniaturas se obtienen en una sola consulta para todas las fotos

## Relación con Tablas de Base de Datos

```
foto_del_anio
├─ id_foto ──────────┬─> image.id
│                    │   ├─ code (para validar archivo)
│                    │   ├─ title (nombre_obra)
│                    │   ├─ url (url_imagen)
│                    │   └─ profile_id ──┬─> profile.id
│                    │                    ├─ name
│                    │                    └─ last_name
│                    │
├─ contest_result ───┴─> contest_result.image_id
│  └─ contest_id ────────> contest.id
│                          └─ end_date (para obtener temporada)
│
├─ thumbnails ───────────> thumbnail.image_id (múltiples por imagen)
│                          ├─ url
│                          ├─ width
│                          ├─ height
│                          └─ ... (todos los campos de thumbnail)
│
├─ puesto (generado según ubicación en estructura)
├─ orden (fijo: 1-8)
├─ temporada (año de contest.end_date)
├─ nombre_obra (image.title)
├─ nombre_autor (profile.last_name + " " + profile.name)
└─ url_imagen (image.url)
```

## Migración Requerida

Para ejecutar en producción antes de usar el endpoint actualizado:

```bash
cd node_api
npx knex migrate:latest
```

Esto ejecutará la migración `251228_add_url_imagen_to_foto_del_anio.js` que agrega la columna `url_imagen` a la tabla `foto_del_anio`.
