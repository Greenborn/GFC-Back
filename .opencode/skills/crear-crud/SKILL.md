---
name: crear-crud
description: Crear un módulo CRUD completo con TableEditor server-side, permisos, menú, preferencias de columnas y endpoints paginados
requires: [init-backend-nodejs, init-frontend-vuejs]
---

# Skill: Crear módulo CRUD genérico

Usar cuando el usuario pida **agregar un CRUD genérico** para una entidad nueva. Este skill genera un módulo auto-registrable con backend (controlador paginado, rutas con permisos, migración, seed) y frontend (tab en panel + menú lateral opcional, TableEditor con filtrado/ordenamiento/paginación vía API, preferencias de columnas guardadas por usuario).

**Requisitos previos:** El proyecto debe tener `init-backend-nodejs` e `init-frontend-vuejs` aplicados (middleware de auth, knex, stores, TableEditor, etc.).

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

## 6. Verificar/Agregar soporte server-side en TableEditor.vue

El TableEditor generado por `init-frontend-vuejs` ya incluye soporte server-side (props `serverSide`, `totalRecords`, `loading`, evento `@update:serverParams`). Si el proyecto fue creado antes de esa actualización, modificar `frontend/src/components/TableEditor.vue` para agregar las siguientes props, eventos, métodos y estilos:

**Props nuevas después de `scrollHeight`:**

```javascript
    serverSide: { type: Boolean, default: false },
    totalRecords: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
```

Modificar `emits` para agregar `'update:serverParams'`:

```javascript
  emits: ['rowSelected', 'rowDoubleClick', 'columnsChange', 'update:serverParams'],
```

Agregar watch para emitir serverParams cuando cambie `pageSize`:

Agregar en `data()`:

```javascript
      currentPage: 1,
```

Modificar el bloque de `computed`:

Reemplazar `totalRows()`:

```javascript
    totalRows() {
      return this.serverSide ? this.totalRecords : this.filtered.length
    },
```

Reemplazar `displayRows()`:

```javascript
    displayRows() {
      if (this.serverSide) return this.data
      const s = (this.page - 1) * this.pageSize
      return this.filtered.slice(s, s + this.pageSize)
    },
```

Modificar el método `toggleSort` para emitir server params:

```javascript
    toggleSort(field) {
      if (this.sortField === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortDir = 'asc'
      }
      this.page = 1
      this.$nextTick(() => this.emitServerParams())
    },
```

Modificar `debouncedSearch`:

```javascript
    debouncedSearch() {
      if (this.filterTimer) clearTimeout(this.filterTimer)
      this.filterTimer = setTimeout(() => {
        this.page = 1
        this.emitServerParams()
      }, 300)
    },
```

Modificar `goPage`:

```javascript
    goPage(p) {
      this.page = Math.max(1, Math.min(p, this.totalPages))
      this.emitServerParams()
    },
```

Agregar nuevo método `emitServerParams`:

```javascript
    emitServerParams() {
      if (!this.serverSide) return
      this.$emit('update:serverParams', {
        page: this.page,
        pageSize: this.pageSize,
        sortField: this.sortField,
        sortDir: this.sortDir,
        search: this.search,
      })
    },
```

Agregar watch en `pageSize`:

```javascript
  watch: {
    pageSize() {
      this.page = 1
      this.emitServerParams()
    },
  },
```

Agregar indicador de carga en el template, justo antes del `<table>` tag:

```html
    <div v-if="loading" class="te-loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
```

Agregar estilos para el overlay de carga:

```css
.te-loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 5;
}
```

Y en el wrapper padre `.te-scroll` necesita `position: relative`:

```css
.te-scroll { overflow: auto; border: 1px solid #dee2e6; border-top: 0; border-bottom: 0; background: #fff; position: relative; }
```

---

## 7. Generar migración de base de datos

Crear archivo `backend/src/modules/<entidad>/<timestamp>_create_<entidades>.js`:

```javascript
export function up(knex) {
  return knex.schema.createTable('<tabla_bd>', (table) => {
    table.increments('id').primary();
    // <CAMPO_ID> - autogenerado

    // <CAMPOS_MIGRATION>
    // Cada campo se genera según su tipo:
    // string: table.string('<nombre>', <maxLength>).nullable()
    // text: table.text('<nombre>').nullable()
    // integer: table.integer('<nombre>').nullable()
    // decimal: table.decimal('<nombre>', <precision>).nullable()
    // boolean: table.boolean('<nombre>').defaultTo(false)
    // date: table.date('<nombre>').nullable()
    // datetime: table.datetime('<nombre>').nullable()
    // enum: table.enu('<nombre>', [<opciones>]).nullable()
    //
    // Si requerido: .notNullable()
    // Si unico: .unique() (en string)
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

> Nota: El agente debe reemplazar `<CAMPOS_MIGRATION>` con las definiciones reales de cada campo según los tipos seleccionados.

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
import db from '../../config/db.js';

const TABLE = '<tabla_bd>';

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

// Obtener por ID
export async function obtener(req, res) {
  try {
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
    const { id } = req.params;
    const existente = await db(TABLE).where({ id }).first();
    if (!existente) {
      return res.status(200).json({ status: false, error: '<Entidad> no encontrado' });
    }

    const <CAMPOS_EDITAR_VALIDACION> = req.body;

    // Validar unicidad (excluyendo el registro actual)
    <VALIDAR_UNICIDAD_EDITAR>

    const payload = {};
    <CAMPOS_PAYLOAD_ACTUALIZAR>
    if (Object.keys(payload).length === 0) {
      return res.status(200).json({ status: false, error: 'No hay campos para actualizar' });
    }

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
```

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
      :columns="columnDefs"
      :data="rows"
      :config="tableConfig"
      :actions="rowActions"
      :serverSide="true"
      :totalRecords="totalRecords"
      :loading="loading"
      selectable
      @rowSelected="onRowSelected"
      @update:serverParams="onServerParams"
      @columnsChange="onColumnsChange"
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
import TableEditor from '../../components/TableEditor.vue'
import { usePreferenciasStore } from '../../stores/preferencias'

export default {
  name: '<Entidad>View',
  components: { TableEditor },
  data() {
    return {
      rows: [],
      totalRecords: 0,
      loading: false,
      selectedRow: null,
      editando: null,
      form: { <CAMPOS_FORM_DATA> },
      errorModal: '',
      cargando: false,
      modalInstance: null,

      // Server-side params
      serverParams: {
        page: 1,
        pageSize: 25,
        sortField: null,
        sortDir: 'asc',
        search: '',
      },

      // Preferencias de columnas
      prefStore: usePreferenciasStore(),
      columnPrefs: null,
    }
  },
  computed: {
    columnDefs() {
      const baseCols = [
        { field: 'id', headerName: 'ID', width: '70px', sortable: false },
        <COLUMNAS_TABLA>
        { field: 'created_at', headerName: 'Creado', type: 'date', sortable: true },
      ]

      // Aplicar preferencias de columnas si existen
      if (this.columnPrefs) {
        if (this.columnPrefs.columnWidths) {
          for (const col of baseCols) {
            if (this.columnPrefs.columnWidths[col.field]) {
              col.width = this.columnPrefs.columnWidths[col.field]
            }
          }
        }
        if (this.columnPrefs.visibleFields) {
          return baseCols.filter(col => this.columnPrefs.visibleFields.includes(col.field))
        }
      }

      return baseCols
    },
    tableConfig() {
      return {
        toolbar: [
          { key: 'refresh', label: '', icon: 'bi bi-arrow-clockwise', severity: 'btn-outline-info', action: () => this.fetchData() },
          { key: 'csv', label: 'CSV', icon: 'bi bi-download', severity: 'btn-outline-info', action: () => this.exportCsv() },
          { key: 'crear', label: 'Nuevo', icon: 'bi bi-plus-lg', severity: 'btn-success', action: () => this.abrirModal() },
          { key: 'editar', label: 'Editar', icon: 'bi bi-pencil', severity: 'btn-primary', disabled: () => !this.selectedRow, action: () => this.abrirModal(this.selectedRow) },
          { key: 'eliminar', label: 'Eliminar', icon: 'bi bi-trash', severity: 'btn-danger', disabled: () => !this.selectedRow, action: () => this.eliminar(this.selectedRow) },
        ],
      }
    },
    rowActions() {
      return [
        { key: 'edit', label: 'Editar', severity: 'btn-warning', icon: 'bi bi-pencil', action: (r) => this.abrirModal(r) },
        { key: 'delete', label: 'Eliminar', severity: 'btn-danger', icon: 'bi bi-trash', action: (r) => this.eliminar(r) },
      ]
    },
  },
  methods: {
    onRowSelected(rows) {
      this.selectedRow = Array.isArray(rows) ? rows[0] : rows
    },
    onServerParams(params) {
      this.serverParams = { ...params }
      this.fetchData()
    },
    onColumnsChange(visibleCols) {
      this.guardarPreferenciasColumnas({
        visibleFields: visibleCols.map(c => c.field),
        columnWidths: this.columnPrefs?.columnWidths || {},
      })
    },
    async fetchData() {
      this.loading = true
      try {
        const query = new URLSearchParams({
          page: this.serverParams.page,
          pageSize: this.serverParams.pageSize,
          sortField: this.serverParams.sortField || '',
          sortDir: this.serverParams.sortDir,
          search: this.serverParams.search,
        }).toString()
        const { data: body } = await api.get(`/api/<entidades>/list?${query}`)
        if (body.status) {
          this.rows = body.data.rows
          this.totalRecords = body.data.total
        }
      } catch (err) {
        console.error('Error al cargar datos:', err)
      } finally {
        this.loading = false
      }
    },
    async cargarPreferenciasColumnas() {
      if (!this.prefStore.misValores) {
        await this.prefStore.fetchMisPreferencias()
      }
      const prefs = this.prefStore.valor('<entidad>_table_cols')
      if (prefs) {
        try {
          this.columnPrefs = typeof prefs === 'string' ? JSON.parse(prefs) : prefs
        } catch { this.columnPrefs = null }
      }
    },
    async guardarPreferenciasColumnas(cols) {
      const payload = {}
      payload['<entidad>_table_cols'] = typeof cols === 'string' ? cols : JSON.stringify(cols)
      await this.prefStore.guardarMisPreferencias(payload)
      this.columnPrefs = cols
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
    cerrarModal() {
      this.modalInstance.hide()
    },
    async guardar() {
      this.errorModal = ''
      this.cargando = true
      try {
        const payload = { <CAMPOS_FORM_PAYLOAD> }
        if (this.editando) {
          await api.put(`/api/<entidades>/${this.editando.id}`, payload)
        } else {
          await api.post(`/api/<entidades>`, payload)
        }
        this.modalInstance.hide()
        await this.fetchData()
        this.$refs.table.clearSelection()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally {
        this.cargando = false
      }
    },
    async eliminar(row) {
      if (!row || !confirm(`Eliminar <entidad> "${row.<CAMPO_IDENTIFICADOR>}"?`)) return
      try {
        await api.delete(`/api/<entidades>/${row.id}`)
        await this.fetchData()
        this.$refs.table.clearSelection()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
    exportCsv() {
      if (!this.rows.length) return
      const cols = this.columnDefs
      let csv = cols.map(c => this.csvEsc(c.headerName)).join(',') + '\n'
      for (const r of this.rows) {
        csv += cols.map(c => this.csvEsc(r[c.field] != null ? String(r[c.field]) : '')).join(',') + '\n'
      }
      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv)
      a.download = '<entidades>.csv'
      a.click()
    },
    csvEsc(v) {
      v = String(v).replace(/"/g, '""')
      return v.includes(',') || v.includes('"') || v.includes('\n') ? '"' + v + '"' : v
    },
  },
  async mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    await this.cargarPreferenciasColumnas()
    await this.fetchData()
  },
}
</script>
```

> El agente debe reemplazar `<COLUMNAS_TABLA>`, `<CAMPOS_FORMULARIO>`, `<CAMPOS_FORM_DATA>`, `<CAMPOS_FORM_EDITAR>`, `<CAMPOS_FORM_VACIO>`, `<CAMPOS_FORM_PAYLOAD>`, `<CAMPOS_BUSCABLES>`, `<CAMPOS_SORTEABLES>`, `<CAMPO_IDENTIFICADOR>` con el código real según los campos definidos.

---

## 14. Generar componente tab para panel (opcional)

Si el usuario eligió agregar un tab en un panel, crear `frontend/src/modules/<entidad>/components/<Entidad>Tab.vue`:

```javascript
<template>
  <div class="p-2" style="height:100%;display:flex;flex-direction:column;">
    <h6 class="mb-2"><titulo_vista></h6>

    <TableEditor
      ref="table"
      :columns="columnDefs"
      :data="rows"
      :config="tabConfig"
      :actions="rowActions"
      :serverSide="true"
      :totalRecords="totalRecords"
      :loading="loading"
      selectable
      @rowSelected="onRowSelected"
      @update:serverParams="onServerParams"
      @columnsChange="onColumnsChange"
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
import TableEditor from '../../components/TableEditor.vue'
import { usePreferenciasStore } from '../../stores/preferencias'

export default {
  name: '<Entidad>Tab',
  components: { TableEditor },
  data() {
    return {
      rows: [],
      totalRecords: 0,
      loading: false,
      selectedRow: null,
      editando: null,
      form: { <CAMPOS_FORM_DATA> },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      serverParams: { page: 1, pageSize: 25, sortField: null, sortDir: 'asc', search: '' },
      prefStore: usePreferenciasStore(),
      columnPrefs: null,
    }
  },
  computed: {
    columnDefs() {
      const baseCols = [
        { field: 'id', headerName: 'ID', width: '60px', sortable: false },
        <COLUMNAS_TABLA>
      ]
      if (this.columnPrefs?.columnWidths) {
        for (const col of baseCols) {
          if (this.columnPrefs.columnWidths[col.field]) col.width = this.columnPrefs.columnWidths[col.field]
        }
      }
      if (this.columnPrefs?.visibleFields) {
        return baseCols.filter(col => this.columnPrefs.visibleFields.includes(col.field))
      }
      return baseCols
    },
    tabConfig() {
      return {
        toolbar: [
          { key: 'refresh', label: '', icon: 'bi bi-arrow-clockwise', severity: 'btn-outline-info', action: () => this.fetchData() },
          { key: 'crear', label: '', icon: 'bi bi-plus-lg', severity: 'btn-success', action: () => this.abrirModal() },
          { key: 'editar', label: '', icon: 'bi bi-pencil', severity: 'btn-primary', disabled: () => !this.selectedRow, action: () => this.abrirModal(this.selectedRow) },
          { key: 'eliminar', label: '', icon: 'bi bi-trash', severity: 'btn-danger', disabled: () => !this.selectedRow, action: () => this.eliminar(this.selectedRow) },
        ],
      }
    },
    rowActions() {
      return [
        { key: 'edit', label: 'Editar', severity: 'btn-warning', icon: 'bi bi-pencil', action: (r) => this.abrirModal(r) },
        { key: 'delete', label: 'Eliminar', severity: 'btn-danger', icon: 'bi bi-trash', action: (r) => this.eliminar(r) },
      ]
    },
  },
  methods: {
    onRowSelected(rows) {
      this.selectedRow = Array.isArray(rows) ? rows[0] : rows
    },
    onServerParams(params) {
      this.serverParams = { ...params }
      this.fetchData()
    },
    onColumnsChange(visibleCols) {
      this.guardarPreferenciasColumnas({
        visibleFields: visibleCols.map(c => c.field),
        columnWidths: this.columnPrefs?.columnWidths || {},
      })
    },
    async fetchData() {
      this.loading = true
      try {
        const query = new URLSearchParams({
          page: this.serverParams.page,
          pageSize: this.serverParams.pageSize,
          sortField: this.serverParams.sortField || '',
          sortDir: this.serverParams.sortDir,
          search: this.serverParams.search,
        }).toString()
        const { data: body } = await api.get(`/api/<entidades>/list?${query}`)
        if (body.status) {
          this.rows = body.data.rows
          this.totalRecords = body.data.total
        }
      } catch (err) {
        console.error('Error al cargar datos:', err)
      } finally {
        this.loading = false
      }
    },
    async cargarPreferenciasColumnas() {
      if (!this.prefStore.misValores) {
        await this.prefStore.fetchMisPreferencias()
      }
      const prefs = this.prefStore.valor('<entidad>_table_cols')
      if (prefs) {
        try { this.columnPrefs = typeof prefs === 'string' ? JSON.parse(prefs) : prefs } catch { this.columnPrefs = null }
      }
    },
    async guardarPreferenciasColumnas(cols) {
      const payload = {}
      payload['<entidad>_table_cols'] = typeof cols === 'string' ? cols : JSON.stringify(cols)
      await this.prefStore.guardarMisPreferencias(payload)
      this.columnPrefs = cols
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
          await api.put(`/api/<entidades>/${this.editando.id}`, payload)
        } else {
          await api.post(`/api/<entidades>`, payload)
        }
        this.modalInstance.hide()
        await this.fetchData()
        this.$refs.table.clearSelection()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally { this.cargando = false }
    },
    async eliminar(row) {
      if (!row || !confirm(`Eliminar <entidad> "${row.<CAMPO_IDENTIFICADOR>}"?`)) return
      try {
        await api.delete(`/api/<entidades>/${row.id}`)
        await this.fetchData()
        this.$refs.table.clearSelection()
      } catch (err) { alert(err.response?.data?.error || 'Error al eliminar') }
    },
  },
  async mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    await this.cargarPreferenciasColumnas()
    await this.fetchData()
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

## 16. Registrar preferencia de columnas en backend

Agregar la definición de preferencia para las columnas de la tabla en el seed de preferencias o mediante el API.

La preferencia debe tener:
- **clave:** `<entidad>_table_cols`
- **nombre:** `Columnas de <entidades>`
- **descripcion:** `Configuracion de columnas visibles, orden y ancho para la tabla de <entidades>`
- **tipo:** `json`
- **valor_defecto:** `{"visibleFields":["id",<CAMPOS_DEFAULT_VISIBLES>],"columnWidths":{}}`

> El agente debe insertar esta preferencia usando el endpoint POST `/api/preferencias` (requiere `preferencias.editar`) o agregarla al seed de preferencias.

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
| 10 | Probar crear, editar y eliminar registros | CRUD funcional |

---

## 18. Reglas obligatorias

1. **Seguir patrón de módulos:** Todos los archivos del CRUD deben ir dentro de `frontend/src/modules/<entidad>/` y `backend/src/modules/<entidad>/`. No modificar `main.js`, `backend/src/index.js` ni otros archivos de orquestación (excepto Sidebar.vue y router/index.js para el enlace de menú, y TableEditor.vue para server-side).
2. **Permisos obligatorios:** Cada operación CRUD debe tener su propio permiso con `authMiddleware`.
3. **Endpoints paginados:** El endpoint `GET /api/<entidades>/list` **siempre** debe aceptar y procesar `page`, `pageSize`, `sortField`, `sortDir`, `search`.
4. **TableEditor siempre server-side:** Toda tabla CRUD debe usar `serverSide={true}` y cargar datos vía API.
5. **Preferencias de columnas:** Toda vista CRUD debe cargar y guardar preferencias de columnas visibles y anchos usando la store `usePreferenciasStore`.
6. **Validación en backend:** Todos los campos requeridos y únicos deben validarse en el controlador antes de insertar/actualizar.
7. **Respuesta consistente:** Todos los endpoints deben responder con `{status: true, data: ...}` en éxito y `{status: false, error: "..."}` en error, ambos con HTTP 200.
8. **No usar alert():** Usar `confirm()` solo para confirmación de eliminación. Para errores usar `errorModal` en el template.
9. **console.log para errores:** Todo `catch` debe registrar el error con `console.log` (backend) o `console.error` (frontend). Prohibido `catch {}` vacío.
10. **Manejo de errores de preferencias:** Si no se pueden cargar las preferencias de columnas, la tabla debe funcionar con valores por defecto sin mostrar error al usuario.
