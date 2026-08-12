---
name: crear-crud
description: Crear un módulo CRUD completo con TableEditor server-side (redimensionable, reordenable, preferencias de columnas), permisos, menú y endpoints paginados
requires: [init-backend-nodejs, init-frontend-vuejs]
---

# Skill: Crear módulo CRUD genérico

Usar cuando el usuario pida **agregar un CRUD genérico** para una entidad nueva. Este skill genera un módulo auto-registrable con backend (controlador paginado, rutas con permisos, migración, seed) y frontend (tab en panel + menú lateral opcional, TableEditor con filtrado/ordenamiento/paginación vía API, preferencias de columnas guardadas por usuario).

**Requisitos previos:** El proyecto debe tener `init-backend-nodejs` e `init-frontend-vuejs` aplicados (middleware de auth, knex, stores, y la librería `vue-table-editor` instalada).

---

## 0. Preguntar datos de la entidad

Usar la herramienta `question` para recolectar la información base de la entidad.

```
<question>
Pregunta: Nombre de la entidad en singular (snake_case, ej: producto, categoria, ticket)
Header: Entidad singular
```

```
<question>
Pregunta: Nombre de la entidad en plural (snake_case, ej: productos, categorias, tickets)
Header: Entidad plural
```

```
<question>
Pregunta: Nombre legible en singular (ej: Producto, Categoria, Ticket)
Header: Nombre singular legible
```

```
<question>
Pregunta: Nombre legible en plural (ej: Productos, Categorias, Tickets)
Header: Nombre plural legible
```

```
<question>
Pregunta: Nombre de la tabla en la base de datos (ej: productos, categorias, tickets)
Header: Nombre de tabla
```

```
<question>
Pregunta: Titulo para la vista CRUD (ej: Productos, Categorias, Tickets)
Header: Titulo de vista
```

> Los valores ingresados reemplazan `<entidad>`, `<entidades>`, `<Entidad>`, `<Entidades>`, `<tabla_bd>` y `<titulo_vista>` respectivamente en el resto del skill.

---

## 0.5. Preguntar si la tabla ya existe

Usar la herramienta `question` para determinar si la tabla ya existe en la base de datos:

```
<question>
Pregunta: ¿La tabla <tabla_bd> ya existe en la base de datos?
Header: Tabla existente
Options:
  - No, crear tabla nueva (Recommended)
  - Si, ya existe
```

> Guardar la respuesta como `<tabla_existe>`. Si es "Si, ya existe", la tabla ya tiene datos y se debe tratar como tabla existente (ver secciones 7 y 9).

---

## 1. Preguntar prefijo de permisos

Usar la herramienta `question` para definir el prefijo de permisos CRUD.

```
<question>
Pregunta: Prefijo para permisos (default: <entidades>). Se generaran: <prefijo>.ver, <prefijo>.crear, <prefijo>.editar, <prefijo>.eliminar
Header: Prefijo permisos
```

> Ejemplo: si el prefijo es `productos`, se crean `productos.ver`, `productos.crear`, `productos.editar`, `productos.eliminar`.

---

## 2. Preguntar roles para cada permiso

Usar la herramienta `question` para cada permiso, preguntar qué roles deben tenerlo.

Primero obtener los roles existentes de la base de datos:
```bash
cd backend && node -e "
import db from './src/config/db.js';
const roles = await db('roles').select('*');
console.log(JSON.stringify(roles));
process.exit(0);
"
```

Usar `<permisos_existentes>` para almacenar los roles disponibles. Luego preguntar:

```
<question>
Pregunta: ¿Que roles deben tener el permiso "<prefijo>.ver"?
Header: Permiso: <prefijo>.ver
Options:
  - ADMIN
  - USUARIO
```

Repetir para cada permiso: `<prefijo>.crear`, `<prefijo>.editar`, `<prefijo>.eliminar`.

> Guardar las selecciones como `<roles_ver>`, `<roles_crear>`, `<roles_editar>`, `<roles_eliminar>`.

---

## 3. Definir campos de la tabla

El agente debe implementar un bucle para recolectar los campos uno por uno.

Primero preguntar cuántos campos tendrá la tabla (sin contar `id`, `created_at`, `updated_at` que se agregan automáticamente):

```
<question>
Pregunta: ¿Cuantos campos personalizados tendra la tabla <entidad>? (sin contar id, created_at, updated_at)
Header: Numero de campos
```

Luego para cada campo `i` de 1 a N, preguntar:

```
<question>
Pregunta: Nombre del campo <i> (snake_case, ej: nombre_completo, precio_unitario)
Header: Campo <i> - nombre
```

```
<question>
Pregunta: Label del campo <i> (ej: Nombre completo, Precio unitario)
Header: Campo <i> - label
```

```
<question>
Pregunta: Tipo de dato del campo <i>
Header: Campo <i> - tipo
Options:
  - string (VARCHAR)
  - text (TEXT)
  - integer (INT)
  - decimal (DECIMAL)
  - boolean (BOOLEAN)
  - date (DATE)
  - datetime (DATETIME)
  - enum (ENUM)
```

Si el tipo es `decimal`:
```
<question>
Pregunta: Precision del decimal (ej: 10,2)
Header: Campo <i> - decimal precision
```

Si el tipo es `enum`:
```
<question>
Pregunta: Opciones del enum separadas por coma (ej: activo,inactivo,pendiente)
Header: Campo <i> - enum opciones
```

```
<question>
Pregunta: ¿El campo <i> es editable en formularios (crear/editar)?
Header: Campo <i> - editable
Options:
  - Si
  - No
```

```
<question>
Pregunta: ¿El campo <i> es visible en la tabla?
Header: Campo <i> - visible tabla
Options:
  - Si (Recommended)
  - No
```

```
<question>
Pregunta: Ancho del campo <i> en la tabla (ej: 150px, dejar vacio para auto)
Header: Campo <i> - ancho
```

```
<question>
Pregunta: ¿El campo <i> es sorteable en la tabla?
Header: Campo <i> - sorteable
Options:
  - Si (Recommended)
  - No
```

```
<question>
Pregunta: ¿El campo <i> debe incluirse en la busqueda global?
Header: Campo <i> - buscable
Options:
  - Si (Recommended)
  - No
```

Si el campo es editable, preguntar reglas de validación:

```
<question>
Pregunta: ¿El campo <i> es requerido?
Header: Campo <i> - requerido
Options:
  - No (Recommended)
  - Si
```

```
<question>
Pregunta: ¿El campo <i> debe ser unico?
Header: Campo <i> - unico
Options:
  - No (Recommended)
  - Si
```

Para tipo `string`:
```
<question>
Pregunta: Longitud maxima del campo <i> (dejar vacio para 255)
Header: Campo <i> - maxLength
```

Para tipo `integer` o `decimal`:
```
<question>
Pregunta: Valor minimo del campo <i> (dejar vacio para sin minimo)
Header: Campo <i> - min
```

```
<question>
Pregunta: Valor maximo del campo <i> (dejar vacio para sin maximo)
Header: Campo <i> - max
```

> Guardar todos los campos en un array `<campos>` donde cada elemento tiene: `{nombre, label, tipo, opciones_enum, editable, visible_tabla, ancho, sorteable, buscable, validacion: {requerido, unico, min, max, maxLength}}`

### Determinar el campo de identificador primario (PK)

Después de recolectar todos los campos, el agente debe determinar qué campo actúa como identificador primario (PK) de la entidad.

Reglas de detección automática:
1. Si existe un campo llamado `slug` y **no** hay un campo `id` en la definición → `<pk_field>` = `slug`, `<pk_type>` = `string`
2. Si existe un campo de tipo `uuid` que el usuario indica como identificador (preguntar si es el ID) → `<pk_field>` = `uuid`, `<pk_type>` = `string`
3. En cualquier otro caso → `<pk_field>` = `id`, `<pk_type>` = `increments`

> Guardar los valores como `<pk_field>` y `<pk_type>`. Estos valores se usan en el resto del skill para generar migraciones, controladores, rutas y vistas correctamente.

---

## 4. Preguntar configuración de menú lateral

```
<question>
Pregunta: ¿Deseas agregar un enlace en el menu lateral para este CRUD?
Header: Menu lateral
Options:
  - Si (Recommended)
  - No
```

Si la respuesta es `Si`:
```
<question>
Pregunta: Label del enlace en el menu (ej: Productos, Categorias)
Header: Menu - label
```

```
<question>
Pregunta: Icono Bootstrap para el menu (ej: bi-box, bi-tag, bi-ticket)
Header: Menu - icono
```

---

## 5. Preguntar configuración de tab en panel

```
<question>
Pregunta: ¿Deseas agregar un tab en un panel para este CRUD?
Header: Tab en panel
Options:
  - Si (Recommended)
  - No
```

Si la respuesta es `Si`:
```
<question>
Pregunta: ¿En que panel deseas agregar el tab?
Header: Tab - panel
Options:
  - sidebarRight (Panel derecho)
  - sidebarChat (Panel izquierdo)
  - devPanel (Panel inferior)
```

```
<question>
Pregunta: Label del tab (ej: Productos, Categorias)
Header: Tab - label
```

```
<question>
Pregunta: Prioridad del tab (menor numero = mas a la izquierda/arriba)
Header: Tab - priority
```

---

## 6. TableEditor — librería `vue-table-editor` (soporte server-side nativo)

El componente `TableEditor` se consume de la librería `vue-table-editor` (instalada por
`init-frontend-vuejs`). **No se crea ni se copia `TableEditor.vue` en el proyecto.**

Importar en cada vista/tab que use la tabla:
```javascript
import { TableEditor, BtnConfig } from 'vue-table-editor'
import 'vue-table-editor/style.css'
```

Soporte server-side nativo:
- `config.lazy = true` activa la carga server-side
- El componente recibe `:api="{ list, create, edit, delete }"`
- Ordenamiento, búsqueda global, paginación y filtros emiten llamadas a `api.list()` automáticamente
- Preferencias de columnas (visibilidad, orden, ancho) se persisten automáticamente (por defecto vía localStorage; opcionalmente inyectar `config.preferencesStore` con el store de preferencias del host)
- Columnas redimensionables y reordenables por drag & drop
- Edición inline configurable vía `config.inlineEditing`

No es necesario modificar ningún archivo de la librería — todas las funcionalidades vienen incluidas.

---

## 7. Generar migración de base de datos

### Si la tabla NO existe (`<tabla_existe>` = "No, crear tabla nueva")

Crear archivo `backend/src/modules/<entidad>/<timestamp>_create_<entidades>.js`:

```javascript
export function up(knex) {
  return knex.schema.createTable('<tabla_bd>', (table) => {
    // <PK_MIGRATION>
    // Generar la columna PK según <pk_field> y <pk_type>:
    // - Si <pk_field> es "id" y <pk_type> es "increments":
    //     table.increments('id').primary();
    // - Si <pk_field> es "slug" (string PK):
    //     table.string('slug', 255).primary();
    // - Si <pk_field> es otro campo string (ej: uuid):
    //     table.string('<pk_field>', 255).primary();
    // </PK_MIGRATION>

    // <CAMPOS_MIGRATION>
    // Cada campo se genera según su tipo:
    // string: table.string('<nombre>', <maxLength>).notNullable()
    // text: table.text('<nombre>').notNullable()
    // integer: table.integer('<nombre>').notNullable()
    // decimal: table.decimal('<nombre>', <precision>).notNullable()
    // boolean: table.boolean('<nombre>').defaultTo(false).notNullable()
    // date: table.date('<nombre>').notNullable()
    // datetime: table.datetime('<nombre>').notNullable()
    // enum: table.enu('<nombre>', [<opciones>]).notNullable()
    //
    // Si no requerido: .nullable() en vez de .notNullable()
    // Si unico en string: agregar .unique()
    // </CAMPOS_MIGRATION>

    // <VALIDACION_MIGRATION>
    // Si min/max en integer/decimal: table.check('?? >= ?', ['<nombre>', <min>])
    // (Knex no soporta CHECK directo en createTable, se hace via raw si es necesario)
    // </VALIDACION_MIGRATION>

    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('<tabla_bd>');
}
```

> Nota: Como la tabla es nueva, se pueden usar `.notNullable()` y `.unique()` sin problemas ya que no hay datos existentes.

### Si la tabla ya existe (`<tabla_existe>` = "Si, ya existe")

**No generar migración de creación de tabla.** La tabla ya está en la BD. En su lugar, generar solo una migración de ALTER TABLE **si hay campos nuevos que agregar** (el agente debe preguntar al usuario qué campos agregar, si es necesario).

Si se necesita agregar campos, crear `backend/src/modules/<entidad>/<timestamp>_alter_<entidades>.js`:

```javascript
export function up(knex) {
  return knex.schema.alterTable('<tabla_bd>', (table) => {
    // <CAMPOS_ALTER>
    // Para cada campo nuevo usar SIEMPRE .nullable()
    // string: table.string('<nombre>', <maxLength>).nullable()
    // text: table.text('<nombre>').nullable()
    // integer: table.integer('<nombre>').nullable()
    // decimal: table.decimal('<nombre>', <precision>).nullable()
    // boolean: table.boolean('<nombre>').defaultTo(false)
    // date: table.date('<nombre>').nullable()
    // datetime: table.datetime('<nombre>').nullable()
    // enum: table.enu('<nombre>', [<opciones>]).nullable()
    //
    // NUNCA usar .notNullable() ni .unique() en ALTER TABLE
    // ya que la tabla puede tener registros existentes.
    // </CAMPOS_ALTER>
  });
}

export function down(knex) {
  return knex.schema.alterTable('<tabla_bd>', (table) => {
    // <CAMPOS_ALTER_DROP>
    // table.dropColumn('<nombre>');
    // </CAMPOS_ALTER_DROP>
  });
}
```

> **Regla importante en ALTER TABLE:** Siempre usar `.nullable()`. Nunca usar `.notNullable()` ni `.unique()` en migraciones que modifican tablas existentes. Las validaciones de requerido y único deben hacerse exclusivamente en el controlador backend.

---

## 8. Generar seed de permisos

Crear archivo `backend/src/modules/<entidad>/<timestamp>_seed_<entidad>_permisos.js`:

```javascript
import db from '../../config/db.js';

export async function seed(knex) {
  // Insertar permisos
  const permisosData = [
    { nombre: '<prefijo>.ver', descripcion: 'Ver <entidades>' },
    { nombre: '<prefijo>.crear', descripcion: 'Crear <entidades>' },
    { nombre: '<prefijo>.editar', descripcion: 'Editar <entidades>' },
    { nombre: '<prefijo>.eliminar', descripcion: 'Eliminar <entidades>' },
  ];

  for (const p of permisosData) {
    const existe = await db('permisos').where({ nombre: p.nombre }).first();
    if (!existe) {
      await db('permisos').insert(p);
    }
  }

  // Asignar permisos a roles segun seleccion del usuario
  // <ASIGNAR_PERMISOS>
  // Para cada permiso, obtener su id y los ids de los roles seleccionados,
  // luego insertar en roles_permisos si no existe.
  //
  // Ejemplo para <prefijo>.ver:
  //   const permVer = await db('permisos').where({ nombre: '<prefijo>.ver' }).first();
  //   const rolesVer = await db('roles').whereIn('nombre', ['<roles_ver>']);
  //   for (const rol of rolesVer) {
  //     const exist = await db('roles_permisos').where({ rol_id: rol.id, permiso_id: permVer.id }).first();
  //     if (!exist) await db('roles_permisos').insert({ rol_id: rol.id, permiso_id: permVer.id });
  //   }
  //
  // Repetir para <prefijo>.crear, .editar, .eliminar
  // </ASIGNAR_PERMISOS>
}
```

> El agente debe reemplazar `<ASIGNAR_PERMISOS>` con el código real de asignación según los roles seleccionados en el paso 2.

---

## 9. Generar controlador backend

Crear archivo `backend/src/modules/<entidad>/<entidad>.controller.js`:

```javascript
import crypto from 'crypto';
import db from '../../config/db.js';

const TABLE = '<tabla_bd>';

// <PK_TYPE>
// El campo PK se define como <pk_field> (valor: "<pk_field>").
// Si <pk_field> NO es "id", reemplazar "id" por "<pk_field>" en todo el controlador:
// - const { id } = req.params; → const { <pk_field> } = req.params;
// - db(TABLE).where({ id }) → db(TABLE).where({ <pk_field> })
// - db(TABLE).whereNot({ id }) → db(TABLE).whereNot({ <pk_field> })
// - data: { id, ... } → data: { [<pk_field>]: <pk_field>, ... }
// (el agente debe hacer este reemplazo al generar el código real)
//
// Determinar según la tabla:
// - Si la tabla es NUEVA (<tabla_existe> = "No, crear tabla nueva") → PK es auto-increment (increments)
// - Si la tabla YA EXISTE (<tabla_existe> = "Si, ya existe") → verificar si la PK es string o increments
//   inspeccionando la migración existente o la estructura de la tabla.
// </PK_TYPE>

// Listar con paginacion, ordenamiento, busqueda
export async function listar(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const sortField = req.query.sortField || 'id';
    const sortDir = req.query.sortDir === 'desc' ? 'desc' : 'asc';
    const search = req.query.search || '';

    let query = db(TABLE);
    let countQuery = db(TABLE);

    // Busqueda global
    if (search) {
      const searchFields = ['<CAMPOS_BUSCABLES>'];
      query = query.where(function () {
        for (const field of searchFields) {
          this.orWhere(field, 'like', `%${search}%`);
        }
      });
      countQuery = countQuery.where(function () {
        for (const field of searchFields) {
          this.orWhere(field, 'like', `%${search}%`);
        }
      });
    }

    // Total antes de paginar
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Ordenamiento
    const allowedSortFields = ['id', '<CAMPOS_SORTEABLES>'];
    const safeField = allowedSortFields.includes(sortField) ? sortField : 'id';
    query = query.orderBy(safeField, sortDir === 'desc' ? 'desc' : 'asc');

    // Paginacion
    const offset = (page - 1) * pageSize;
    const rows = await query.offset(offset).limit(pageSize).select('*');

    res.status(200).json({
      status: true,
      data: { rows, total, page, pageSize },
    });
  } catch (err) {
    console.log('Error al listar <entidades>:', err);
    res.status(200).json({ status: false, error: 'Error al listar <entidades>' });
  }
}

// Obtener por ID (usar <pk_field> como campo PK)
export async function obtener(req, res) {
  try {
    // <PK_OBTENER>
    // NOTA: <pk_field> define el campo PK. Si <pk_field> != "id",
    // reemplazar "id" por "<pk_field>" en todo el controlador.
    // Ejemplo con pk_field="slug":
    //   const { slug } = req.params;
    //   const row = await db(TABLE).where({ slug }).first();
    // </PK_OBTENER>
    const { id } = req.params;
    const row = await db(TABLE).where({ id }).first();
    if (!row) {
      return res.status(200).json({ status: false, error: '<Entidad> no encontrado' });
    }
    res.status(200).json({ status: true, data: row });
  } catch (err) {
    console.log('Error al obtener <entidad>:', err);
    res.status(200).json({ status: false, error: 'Error al obtener <entidad>' });
  }
}

// Crear
export async function crear(req, res) {
  try {
    const <CAMPOS_CREAR_VALIDACION> = req.body;

    // Validar campos requeridos
    <VALIDAR_REQUERIDOS>

    // Validar unicidad
    <VALIDAR_UNICIDAD>

    const payload = { <CAMPOS_PAYLOAD> };

    // <PK_ID_GENERATION>
    // El campo PK es <pk_field> (tipo: <pk_type>).
    // Generar segun el tipo:
    //
    // Opcion A — <pk_type> es "increments" (auto-increment, ej: tabla con increments('id')):
    //   // <pk_field> se genera automaticamente
    //   const [id] = await db(TABLE).insert(payload);
    //   res.status(200).json({ status: true, data: { id, ... } });
    //
    // Opcion B — <pk_type> es "string" (PK string, ej: slug o uuid):
    //   const id = crypto.randomUUID();
    //   payload.id = id;
    //   await db(TABLE).insert(payload);
    //   // Si <pk_field> es "slug", el slug debe venir del input, no generarse con randomUUID
    //   res.status(200).json({ status: true, data: { [<pk_field>]: <pk_field>, ... } });
    //
    // Si <pk_field> NO es "id", reemplazar "id" por "<pk_field>" en todo el codigo generado.
    // </PK_ID_GENERATION>
    const [id] = await db(TABLE).insert(payload);

    res.status(200).json({ status: true, data: { id, message: '<Entidad> creado correctamente' } });
  } catch (err) {
    console.log('Error al crear <entidad>:', err);
    res.status(200).json({ status: false, error: 'Error al crear <entidad>' });
  }
}

// Actualizar
export async function actualizar(req, res) {
  try {
    // <PK_ACTUALIZAR>
    // NOTA: Usar <pk_field> como campo PK. Si <pk_field> != "id",
    // reemplazar "id" por "<pk_field>" en todo el codigo generado:
    //   const { slug } = req.params;
    //   const existente = await db(TABLE).where({ slug }).first();
    // </PK_ACTUALIZAR>
    const { id } = req.params;
    const existente = await db(TABLE).where({ id }).first();
    if (!existente) {
      return res.status(200).json({ status: false, error: '<Entidad> no encontrado' });
    }

    const <CAMPOS_EDITAR_VALIDACION> = req.body;

    // <VALIDAR_UNICIDAD_EDITAR>
    // Para cada campo único, validar que no exista otro registro con el mismo valor,
    // excluyendo el registro actual con .whereNot({ id }):
    //
    // NOTA: Si <pk_field> != "id", usar .whereNot({ <pk_field> }) en vez de .whereNot({ id })
    //
    // if (slug && slug !== existente.slug) {
    //   const slugExistente = await db(TABLE).where({ slug }).whereNot({ id }).first();
    //   if (slugExistente) return res.status(200).json({ status: false, error: 'El slug ya existe' });
    // }
    //
    // Repetir para cada campo único.
    // </VALIDAR_UNICIDAD_EDITAR>

    const payload = {};
    <CAMPOS_PAYLOAD_ACTUALIZAR>
    if (Object.keys(payload).length === 0) {
      return res.status(200).json({ status: false, error: 'No hay campos para actualizar' });
    }

    // <PK_UPDATE_WHERE>
    // Si <pk_field> != "id": await db(TABLE).where({ <pk_field> }).update(payload);
    // </PK_UPDATE_WHERE>
    await db(TABLE).where({ id }).update(payload);

    res.status(200).json({ status: true, data: { message: '<Entidad> actualizado correctamente' } });
  } catch (err) {
    console.log('Error al actualizar <entidad>:', err);
    res.status(200).json({ status: false, error: 'Error al actualizar <entidad>' });
  }
}

// Eliminar
export async function eliminar(req, res) {
  try {
    // <PK_ELIMINAR>
    // NOTA: Usar <pk_field> como campo PK. Si <pk_field> != "id",
    // reemplazar "id" por "<pk_field>":
    //   const { slug } = req.params;
    //   const existente = await db(TABLE).where({ slug }).first();
    //   await db(TABLE).where({ slug }).del();
    // </PK_ELIMINAR>
    const { id } = req.params;
    const existente = await db(TABLE).where({ id }).first();
    if (!existente) {
      return res.status(200).json({ status: false, error: '<Entidad> no encontrado' });
    }

    await db(TABLE).where({ id }).del();
    res.status(200).json({ status: true, data: { message: '<Entidad> eliminado correctamente' } });
  } catch (err) {
    console.log('Error al eliminar <entidad>:', err);
    res.status(200).json({ status: false, error: 'Error al eliminar <entidad>' });
  }
}

> El agente debe reemplazar los placeholders `<CAMPOS_*>` y `<VALIDAR_*>` con el código real generado según los campos definidos por el usuario.

---

## 10. Generar rutas backend

Crear archivo `backend/src/modules/<entidad>/<entidad>.routes.js`:

```javascript
import { Router } from 'express';
import authMiddleware from '../../middleware/auth.js';
import {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
} from './<entidad>.controller.js';

const router = Router();

router.get('/list', authMiddleware('<prefijo>.ver'), listar);
// <PK_ROUTE>
// Usar <pk_field> como parametro de ruta. Si <pk_field> != "id":
//   router.get('/:slug', authMiddleware(...), obtener);
//   router.put('/:slug', authMiddleware(...), actualizar);
//   router.delete('/:slug', authMiddleware(...), eliminar);
// Si <pk_field> es "id":
//   router.get('/:id', ...);
// </PK_ROUTE>
router.get('/:id', authMiddleware('<prefijo>.ver'), obtener);
router.post('/', authMiddleware('<prefijo>.crear'), crear);
router.put('/:id', authMiddleware('<prefijo>.editar'), actualizar);
router.delete('/:id', authMiddleware('<prefijo>.eliminar'), eliminar);

export default router;
```

---

## 11. Generar manifest backend del módulo

Crear archivo `backend/src/modules/<entidad>/index.js`:

```javascript
import <entidad>Routes from './<entidad>.routes.js';

export default {
  id: '<entidad>',
  name: '<Entidades>',
  routes: [
    { path: '/api/<entidades>', router: <entidad>Routes },
  ],
};
```

---

## 12. Modificar Sidebar.vue para agregar enlace de menú (opcional)

Si el usuario eligió agregar enlace en el menú lateral, modificar el archivo `frontend/src/components/layout/Sidebar.vue`.

Buscar el array `navItems()` dentro del `computed` y agregar la entrada:

```javascript
    { to: '/<entidad>', label: '<menu_label>', icon: '<menu_icono>', permiso: '<prefijo>.ver' },
```

Además, agregar la ruta en `frontend/src/router/index.js`:

```javascript
  {
    path: '/<entidad>',
    name: '<entidad>',
    component: () => import('../modules/<entidad>/components/<Entidad>View.vue'),
    meta: { requiereAuth: true, permisos: ['<prefijo>.ver'] },
  },
```

> Nota: Se genera una vista independiente (`<Entidad>View.vue`) además del tab, para que funcione tanto desde el menú lateral como desde el tab del panel.

---

## 13. Generar vista frontend para ruta independiente

Crear archivo `frontend/src/modules/<entidad>/components/<Entidad>View.vue`:

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4"><titulo_vista></h1>

    <TableEditor
      ref="table"
      id="<entidad>"
      :api="apiEntidad"
      :config="tableConfig"
      @rowSelected="onRowSelected"
      @rowDoubleClick="onRowDblClick"
    />

    <!-- Modal Formulario -->
    <div class="modal fade" tabindex="-1" ref="modal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar <Entidad>' : 'Nuevo <Entidad>' }}</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardar">
            <div class="modal-body">
              <!-- CAMPOS_FORMULARIO -->
              <div v-if="errorModal" class="alert alert-danger py-2">{{ errorModal }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="cargando">{{ cargando ? 'Guardando...' : 'Guardar' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import api from '../../api/axios'
import { TableEditor, BtnConfig } from 'vue-table-editor'
import 'vue-table-editor/style.css'

export default {
  name: '<Entidad>View',
  components: { TableEditor },
  // <PK_FRONTEND>
  // NOTA: El campo PK de la entidad es <pk_field>.
  // Si <pk_field> NO es "id", reemplazar todas las referencias a ".id"
  // por ".<pk_field>" en los metodos guardar, eliminar, etc.
  // Ejemplo:
  //   this.editando.id → this.editando.<pk_field>
  //   row.id → row[<pk_field>]
  // </PK_FRONTEND>
  data() {
    return {
      selectedRow: null,
      editando: null,
      form: { <CAMPOS_FORM_DATA> },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      apiEntidad: {
        list: (params) => api.get(`/<entidades>/list`, { params }).then(r => r.data),
        create: (data) => api.post(`/<entidades>`, data).then(r => r.data),
        edit: (data) => api.put(`/<entidades>/${data.id}`, data).then(r => r.data),
        delete: (data) => api.delete(`/<entidades>/${data.id}`).then(r => r.data),
      },
    }
  },
  computed: {
    tableConfig() {
      return {
        lazy: true,
        selectionMode: 'single',
        elementName: { singular: '<Entidad>', gender: '<GENERO>' },
        buttons: {
          toolbar: [
            { key: 'create', icon: 'plus', severity: 'success', label: '<LABEL_CREAR>',
              onClick: () => this.abrirModal() },
            { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              isDisabled: () => !this.selectedRow, onClick: () => this.abrirModal(this.selectedRow) },
            { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              isDisabled: () => !this.selectedRow, onClick: () => this.eliminar(this.selectedRow) },
          ],
          rowActions: [
            { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              onClick: (r) => this.abrirModal(r) },
            { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              onClick: (r) => this.eliminar(r) },
          ],
        },
      }
    },
  },
  methods: {
    onRowSelected(row) { this.selectedRow = row },
    onRowDblClick(row) {
      if (row) this.abrirModal(row)
    },
    abrirModal(row) {
      this.errorModal = ''
      if (row) {
        this.editando = row
        this.form = { <CAMPOS_FORM_EDITAR> }
      } else {
        this.editando = null
        this.form = { <CAMPOS_FORM_VACIO> }
      }
      this.modalInstance.show()
    },
    cerrarModal() { this.modalInstance.hide() },
    async guardar() {
      this.errorModal = ''
      this.cargando = true
      try {
        const payload = { <CAMPOS_FORM_PAYLOAD> }
        if (this.editando) {
          await api.put(`/<entidades>/${this.editando.id}`, payload)
        } else {
          await api.post(`/<entidades>`, payload)
        }
        this.modalInstance.hide()
        this.$refs.table.refresh()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally { this.cargando = false }
    },
    async eliminar(row) {
      if (!row || !confirm(`Eliminar <entidad> "${row.<CAMPO_IDENTIFICADOR>}"?`)) return
      try {
        await api.delete(`/<entidades>/${row.id}`)
        this.$refs.table.refresh()
      } catch (err) { alert(err.response?.data?.error || 'Error al eliminar') }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
  },
}
</script>
```

> El agente debe reemplazar los placeholders:
> - `<COLUMNAS_TABLA>` — array de definiciones de columnas `{ field, headerName, type, sortable }`
> - `<CAMPOS_FORMULARIO>` — campos del formulario HTML
> - `<CAMPOS_FORM_DATA>` — valores iniciales del form en data()
> - `<CAMPOS_FORM_EDITAR>` — relleno del form al editar
> - `<CAMPOS_FORM_VACIO>` — valores vacíos del form
> - `<CAMPOS_FORM_PAYLOAD>` — payload del PUT/POST
> - `<CAMPO_IDENTIFICADOR>` — campo usado para mostrar identidad al eliminar (primer campo visible, o `slug` si existe)
> - `<GENERO>` — 'M' o 'F' según el género de `<Entidad>`
> - `<LABEL_CREAR>` — 'Nuevo' (M) o 'Nueva' (F)
>
> Las preferencias de columnas (orden, ancho, visibilidad) se persisten automáticamente por el TableEditor mediante el `:id` prop. No es necesario código adicional en la vista.

---

## 14. Generar componente tab para panel (opcional)

Si el usuario eligió agregar un tab en un panel, crear `frontend/src/modules/<entidad>/components/<Entidad>Tab.vue`:

```javascript
<template>
  <div class="p-2" style="height:100%;display:flex;flex-direction:column;">
    <h6 class="mb-2"><titulo_vista></h6>

    <TableEditor
      ref="table"
      id="<entidad>"
      :api="apiEntidad"
      :config="tabConfig"
      @rowSelected="onRowSelected"
      @rowDoubleClick="onRowDblClick"
    />

    <!-- Modal Formulario -->
    <div class="modal fade" tabindex="-1" ref="modal">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header" style="padding:0.4rem 0.75rem">
            <h6 class="modal-title">{{ editando ? 'Editar <Entidad>' : 'Nuevo <Entidad>' }}</h6>
            <button type="button" class="btn-close btn-close-sm" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardar">
            <div class="modal-body" style="padding:0.5rem 0.75rem">
              <!-- CAMPOS_FORMULARIO_TAB -->
              <div v-if="errorModal" class="alert alert-danger py-1 small">{{ errorModal }}</div>
            </div>
            <div class="modal-footer" style="padding:0.4rem 0.75rem">
              <button type="button" class="btn btn-sm btn-secondary" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn btn-sm btn-primary" :disabled="cargando">{{ cargando ? 'Guardando...' : 'Guardar' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import api from '../../api/axios'
import { TableEditor, BtnConfig } from 'vue-table-editor'
import 'vue-table-editor/style.css'

export default {
  name: '<Entidad>Tab',
  components: { TableEditor },
  // <PK_FRONTEND>
  // NOTA: El campo PK de la entidad es <pk_field>.
  // Si <pk_field> NO es "id", reemplazar ".id" por ".<pk_field>"
  // en los metodos guardar, eliminar, etc.
  // Ejemplo: row.id → row.<pk_field>
  // </PK_FRONTEND>
  data() {
    return {
      selectedRow: null,
      editando: null,
      form: { <CAMPOS_FORM_DATA> },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      apiEntidad: {
        list: (params) => api.get(`/<entidades>/list`, { params }).then(r => r.data),
        create: (data) => api.post(`/<entidades>`, data).then(r => r.data),
        edit: (data) => api.put(`/<entidades>/${data.id}`, data).then(r => r.data),
        delete: (data) => api.delete(`/<entidades>/${data.id}`).then(r => r.data),
      },
    }
  },
  computed: {
    tabConfig() {
      return {
        lazy: true,
        selectionMode: 'single',
        elementName: { singular: '<Entidad>', gender: '<GENERO>' },
        buttons: {
          toolbar: [
            { key: 'create', icon: 'plus', severity: 'success', label: '<LABEL_CREAR>',
              onClick: () => this.abrirModal() },
            { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              isDisabled: () => !this.selectedRow, onClick: () => this.abrirModal(this.selectedRow) },
            { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              isDisabled: () => !this.selectedRow, onClick: () => this.eliminar(this.selectedRow) },
          ],
          rowActions: [
            { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              onClick: (r) => this.abrirModal(r) },
            { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              onClick: (r) => this.eliminar(r) },
          ],
        },
      }
    },
  },
  methods: {
    onRowSelected(row) { this.selectedRow = row },
    onRowDblClick(row) {
      if (row) this.abrirModal(row)
    },
    abrirModal(row) {
      this.errorModal = ''
      if (row) {
        this.editando = row
        this.form = { <CAMPOS_FORM_EDITAR> }
      } else {
        this.editando = null
        this.form = { <CAMPOS_FORM_VACIO> }
      }
      this.modalInstance.show()
    },
    cerrarModal() { this.modalInstance.hide() },
    async guardar() {
      this.errorModal = ''
      this.cargando = true
      try {
        const payload = { <CAMPOS_FORM_PAYLOAD> }
        if (this.editando) {
          await api.put(`/<entidades>/${this.editando.id}`, payload)
        } else {
          await api.post(`/<entidades>`, payload)
        }
        this.modalInstance.hide()
        this.$refs.table.refresh()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally { this.cargando = false }
    },
    async eliminar(row) {
      if (!row || !confirm(`Eliminar <entidad> "${row.<CAMPO_IDENTIFICADOR>}"?`)) return
      try {
        await api.delete(`/<entidades>/${row.id}`)
        this.$refs.table.refresh()
      } catch (err) { alert(err.response?.data?.error || 'Error al eliminar') }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
  },
}
</script>
```

---

## 15. Generar manifest frontend del módulo

Crear archivo `frontend/src/modules/<entidad>/index.js`:

```javascript
<SI_TAB>
import <Entidad>Tab from './components/<Entidad>Tab.vue'

export default {
  id: '<entidad>',
  name: '<Entidades>',
  tabs: {
    <tab_panel>: [
      { id: '<entidad>', label: '<tab_label>', component: () => import('./components/<Entidad>Tab.vue'), priority: <tab_priority> },
    ],
  },
  <SIN_TAB>
}
```

> Si no se eligió tab, el manifest se genera sin la propiedad `tabs`.

---

## 16. Preferencias de columnas (auto-gestionadas por TableEditor)

El TableEditor (de `vue-table-editor`) gestiona las preferencias de columnas automáticamente mediante el `:id` prop:
- **Persistencia por defecto:** localStorage (autónomo, sin servidor)
- **Datos guardados:** `{ columnOrder: string[], columnWidths: { [field]: string } }`
- **Cuándo se guarda:** Auto-save debounced (500ms) después de redimensionar, reordenar o cambiar visibilidad
- **Cuándo se carga:** Al montar el componente

Opcionalmente, para persistir en el backend vía el store de preferencias del host, pasar
`config.preferencesStore` (o registrar un adaptador global con `setGlobalPreferencesAdapter`),
exponiendo: `{ misValores, valor(key), guardarValores(data), fetchMisPreferencias() }`.

No es necesario registrar la preferencia en backend ni agregar código en la vista.

---

## 17. Verificación obligatoria

Después de generar el módulo CRUD, verificar:

| # | Comando | Resultado esperado |
|---|---------|-------------------|
| 1 | `cd backend && npm run migrate:latest` (si se creó migración) | Migración aplicada sin errores |
| 2 | `cd backend && node -e "import('./src/modules/<entidad>/index.js').then(m=>console.log(m.default.id))"` | Muestra `<entidad>` |
| 3 | `cd backend && npm run dev` (probar endpoint) | Servidor inicia sin errores |
| 4 | `curl -s http://localhost:<puerto>/api/<entidades>/list?page=1\&pageSize=10 | jq .status` | `true` (con token válido) |
| 5 | `cd frontend && npm run build` | Build exitoso sin errores |
| 6 | Navegar a la ruta `/<entidad>` en el navegador | Vista CRUD se renderiza |
| 7 | Verificar que el tab aparece en el panel correspondiente | Tab visible |
| 8 | Probar filtrado, ordenamiento y paginación en la tabla | Datos se cargan vía API |
| 9 | Verificar que cambiar visibilidad de columnas se guarda al recargar | Preferencia persistida |
| 10 | Redimensionar columna arrastrando el borde del header | Ancho cambia visualmente |
| 11 | Reordenar columna arrastrando el header | Columna cambia de posición |
| 12 | Verificar que ancho y orden se restauran al recargar | Preferencias persistentes funcionales |
| 13 | Probar crear, editar y eliminar registros | CRUD funcional |

---

## 18. Reglas obligatorias

1. **Seguir patrón de módulos:** Todos los archivos del CRUD deben ir dentro de `frontend/src/modules/<entidad>/` y `backend/src/modules/<entidad>/`. No modificar `main.js`, `backend/src/index.js` ni otros archivos de orquestación (excepto Sidebar.vue y router/index.js para el enlace de menú).
2. **Permisos obligatorios:** Cada operación CRUD debe tener su propio permiso con `authMiddleware`.
3. **Endpoints paginados:** El endpoint `GET /api/<entidades>/list` **siempre** debe aceptar y procesar `page`, `pageSize`, `sortField`, `sortDir`, `search`.
4. **TableEditor siempre lazy (server-side):** Toda tabla CRUD debe usar `config.lazy = true` y proporcionar `api.list` para carga de datos vía API.
5. **Preferencias de columnas automáticas:** El TableEditor persiste visibilidad, orden y ancho de columnas automáticamente mediante `:id`. No agregar código manual de preferencias en la vista.
6. **Columnas redimensionables y reordenables:** El TableEditor habilita por defecto `resizableColumns` y `reorderableColumns`. No desactivarlos a menos que el usuario lo solicite explícitamente.
7. **Validación en backend:** Todos los campos requeridos y únicos deben validarse en el controlador antes de insertar/actualizar.
8. **Respuesta consistente:** Todos los endpoints deben responder con `{status: true, data: ...}` en éxito y `{status: false, error: "..."}` en error, ambos con HTTP 200.
9. **No usar alert():** Usar `confirm()` solo para confirmación de eliminación. Para errores usar `errorModal` en el template.
10. **console.log para errores:** Todo `catch` debe registrar el error con `console.log` (backend) o `console.error` (frontend). Prohibido `catch {}` vacío.
11. **Rutas frontend sin prefijo /api:** En todas las llamadas `api.get()`, `api.post()`, `api.put()`, `api.delete()` de las vistas frontend, usar paths sin el prefijo `/api` (ej: `/<entidades>/list` en vez de `/api/<entidades>/list`). El `baseURL` de axios ya incluye `/api` (por Nginx o `VITE_API_URL`).
12. **Migraciones ALTER TABLE siempre .nullable():** Si la tabla ya existe, toda migración que agregue columnas debe usar `.nullable()`. Nunca usar `.notNullable()` ni `.unique()` en columnas nuevas sobre tablas existentes con datos.
13. **Detección de tipo de PK y slug como identificador:** Antes de generar el controlador, determinar `<pk_field>` según las reglas de la sección 3. Si existe un campo llamado `slug` y no hay campo `id`, el slug es el PK (string). Si hay campo tipo `uuid` indicado como ID, ese es el PK. El controlador, rutas y vistas deben usar `<pk_field>` en vez de `id` en todas las operaciones CRUD.
14. **Validar unicidad en actualización con .whereNot({ id }):** Al validar unicidad de un campo en el método `actualizar`, excluir el registro que se está editando usando `.whereNot({ id })`.
15. **api.list debe devolver `{ status, data: { rows, fields_def, totalRecords/total } }`:** El método `api.list` debe devolver las columnas en `fields_def` para que TableEditor pueda renderizar los headers y celdas correctamente. Cada field_def debe tener `{ field, headerName, type, sortable, form_type, css }`.
