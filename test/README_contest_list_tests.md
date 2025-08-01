# Tests de Listado de Concursos

Este directorio contiene tests específicos para verificar la funcionalidad del endpoint de listado de concursos.

## Archivos de Test

### `test_contest_list_simple.js`
Test básico que verifica la funcionalidad del endpoint de listado de concursos en la API Node.js con autenticación.

**Características:**
- Verifica que la autenticación es requerida (401 sin token)
- Verifica que tokens inválidos son rechazados (401 con token inválido)
- Prueba diferentes parámetros de consulta con autenticación válida
- Verifica la estructura de respuesta
- Comprueba la expansión de categorías y secciones
- Valida la paginación
- Requiere credenciales válidas para pruebas completas

**Uso:**
```bash
cd test
node test_contest_list_simple.js
```

### `test_contest_list.js`
Test completo que compara la funcionalidad entre la API PHP existente y la nueva API Node.js.

**Características:**
- Requiere autenticación en ambas APIs
- Compara respuestas entre APIs
- Verifica consistencia de datos
- Valida estructura de metadatos
- Mide tiempo de respuesta

**Uso:**
```bash
cd test
node test_contest_list.js
```

## Configuración

Los tests utilizan las siguientes variables de entorno del archivo `.env`:

- `API_BASE_URL`: URL base de la API PHP (default: https://gfc.prod-api.greenborn.com.ar)
- `NODE_API_BASE_URL`: URL base de la API Node.js (default: http://localhost:7779)
- `ADMIN_USERNAME`: Usuario administrativo para pruebas
- `ADMIN_PASSWORD`: Contraseña del usuario administrativo

## Endpoint Probado

```
GET /contest?expand=categories,sections&sort=-id&page=1&per-page=20
```

**⚠️ IMPORTANTE: Este endpoint requiere autenticación mediante token Bearer.**

### Parámetros soportados:
- `expand`: Expandir relaciones (categories, sections)
- `sort`: Ordenamiento (-id para descendente, id para ascendente)
- `page`: Número de página (default: 1)
- `per-page`: Elementos por página (default: 20)

### Estructura de respuesta esperada:
```json
{
  "items": [
    {
      "id": 51,
      "name": "Nombre del concurso",
      "description": "Descripción del concurso",
      "start_date": "2025-07-27 22:53:00",
      "end_date": "2025-08-17 23:58:00",
      "max_img_section": 6,
      "img_url": "images/contest_title_xxx.jpg",
      "rules_url": "images/rules-xxx.pdf",
      "sub_title": "",
      "organization_type": null,
      "judged": null,
      "active": true,
      "sections": [
        {
          "id": 1,
          "name": "Color"
        }
      ],
      "categories": [
        {
          "id": 1,
          "name": "Estímulo",
          "mostrar_en_ranking": 1
        }
      ]
    }
  ],
  "_links": {
    "self": {"href": "..."},
    "first": {"href": "..."},
    "last": {"href": "..."},
    "next": {"href": "..."}
  },
  "_meta": {
    "totalCount": 28,
    "pageCount": 2,
    "currentPage": 1,
    "perPage": 20
  }
}
```

## Prerequisitos

1. **API Node.js en funcionamiento:**
   ```bash
   cd ../node_api
   npm start
   ```

2. **Acceso a la API PHP** (para comparación)

3. **Dependencias instaladas:**
   ```bash
   npm install
   ```

## Ejecución

### Test individual simple:
```bash
node test_contest_list_simple.js
```

### Test completo con comparación:
```bash
node test_contest_list.js
```

### Todos los tests:
```bash
node run_all_tests.js
```

## Ejemplo de Salida

```
🚀 TESTS SIMPLES DE LISTADO DE CONCURSOS - NODE.JS API
=======================================================
🔗 Node.js API: http://localhost:7779

🧪 PROBANDO SEGURIDAD DE AUTENTICACIÓN...

🔒 PROBANDO QUE LA AUTENTICACIÓN ES REQUERIDA...
[TEST AUTH] http://localhost:7779/contest
✅ Autenticación requerida correctamente (401 Unauthorized)
📋 Mensaje: No autenticado

🚫 PROBANDO TOKEN INVÁLIDO...
[TEST INVALID TOKEN] http://localhost:7779/contest
✅ Token inválido rechazado correctamente (401 Unauthorized)
📋 Mensaje: Token inválido

🧪 PROBANDO FUNCIONALIDAD BÁSICA CON AUTENTICACIÓN...

[LOGIN NODE] http://localhost:7779/api/auth/login
✅ Login exitoso en API Node.js

[TEST SIMPLE] http://localhost:7779/contest?expand=categories,sections&sort=-id&page=1&per-page=5
✅ Endpoint de concursos accesible
📊 Status: 200
📊 Total de concursos en página: 5
📄 Total de concursos: 28
📄 Páginas: 6
📄 Página actual: 1
📄 Por página: 5
🔗 Enlaces de navegación: [ 'self', 'first', 'last', 'next' ]

📝 Primer concurso:
   ID: 51
   Nombre: "Tres elementos y Paisaje"
   Descripción: "El Tema será "Tres Elementos" para las secciones color y monocromo con edición libre. Y el subt..."
   Fecha inicio: 2025-07-27 22:53:00
   Fecha fin: 2025-08-17 23:58:00
   Activo: true
   Tipo organización: null
   Juzgado: null
   🗂️ Categorías (2):
      - Estímulo (ID: 1, Ranking: 1)
      - Primera (ID: 2, Ranking: 1)
   📋 Secciones (3):
      - Color (ID: 1)
      - Monocromo (ID: 2)
      - Sub Sección (ID: 7)

⏱️ Tiempo total de ejecución: 245ms
✅ TODOS LOS TESTS SIMPLES EXITOSOS
🔒 Autenticación funcionando correctamente
📊 Endpoint de listado funcionando correctamente
```
