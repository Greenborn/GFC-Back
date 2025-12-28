# Endpoint Fotos del Año - Nueva Estructura

## Descripción General

El endpoint de registro de fotografías del año ha sido rediseñado para aceptar una estructura jerárquica de directorios que refleja la organización de premios del concurso.

## Endpoint

**POST** `/api/foto-del-anio`

**Autenticación:** Requerida (Solo administradores)

## Estructura de Datos

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
- ✓ No pueden haber fotografías duplicadas en diferentes ubicaciones

### 2. Validación de Base de Datos
- ✓ Todas las fotografías deben existir en la tabla `image`
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
  - **Autor:** Se concatena `profile.last_name + " " + profile.name`
    - Donde `image.profile_id = profile.id`

## Proceso de Inserción

1. **Transacción:** Todo el proceso se ejecuta dentro de una transacción
2. **Eliminación:** Se eliminan registros existentes de la misma temporada
3. **Inserción:** Se insertan los nuevos 8 registros con:
   - `id_foto`: ID de la imagen
   - `puesto`: Título del puesto/premio
   - `orden`: Número de orden (1-8)
   - `temporada`: Año obtenido de `contest.end_date`
   - `nombre_obra`: Título de la imagen
   - `nombre_autor`: Nombre completo del autor
   - `url_imagen`: Nombre del archivo original

## Respuestas

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

### Error - Fotografías Duplicadas (400)

```json
{
  "success": false,
  "message": "Existen fotografías duplicadas en diferentes ubicaciones",
  "duplicados": ["2416_2025_52_Color_12030.jpg"]
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

## Ejemplo de Uso con cURL

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

## Diagrama de Flujo

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
│  exactamente 8 fotografías únicas   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  INICIO TRANSACCIÓN                 │
│  ┌───────────────────────────────┐  │
│  │ Buscar en tabla image         │  │
│  │ (por código sin extensión)    │  │
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

## Notas Importantes

1. **Atomicidad:** Si cualquier validación falla, se hace rollback de toda la transacción
2. **Reemplazo:** Los registros existentes de la temporada se eliminan antes de insertar los nuevos
3. **Códigos de Fotografías:** El código se obtiene quitando la extensión del archivo (.jpg, .jpeg, .png)
4. **Temporada:** Se determina automáticamente del año de `contest.end_date`
5. **Orden:** Cada fotografía tiene un orden fijo según su categoría y tipo
6. **Logging:** Cada operación se registra en el log del sistema

## Relación con Tablas de Base de Datos

```
foto_del_anio
├─ id_foto ──────────┬─> image.id
│                    │   ├─ code (para validar archivo)
│                    │   ├─ title (nombre_obra)
│                    │   └─ profile_id ──┬─> profile.id
│                    │                    ├─ name
│                    │                    └─ last_name
│                    │
├─ contest_result ───┴─> contest_result.image_id
│  └─ contest_id ────────> contest.id
│                          └─ end_date (para obtener temporada)
│
├─ puesto (generado según ubicación en estructura)
├─ orden (fijo: 1-8)
├─ temporada (año de contest.end_date)
├─ nombre_obra (image.title)
├─ nombre_autor (profile.last_name + " " + profile.name)
└─ url_imagen (nombre archivo original)
```
