---
name: init-frontend-vuejs
description: Inicializar un frontend Vue.js 3 con Vite, Bootstrap, Pinia, Axios y layout responsive
requires: [init-backend-nodejs]
---

# Skill: Inicializar frontend Vue.js con Vite, Bootstrap y Pinia

Usar cuando el usuario pida **crear un frontend desde cero** con Vue.js 3, Vite, Bootstrap, Pinia, Axios, barra superior y menú lateral (hamburguesa en móvil). **Prohibido usar TypeScript** — todo el código debe ser JavaScript. El TableEditor se consume desde la librería `vue-table-editor` (no se copia su código al proyecto); el resto de componentes puede usar Options API.

---

## 0. Preguntar nombre del proyecto

Usar la herramienta `question` para preguntar al usuario qué nombre desea para el paquete del frontend. La respuesta se usará como `<nombre-proyecto>` en todos los pasos siguientes.

Ejemplo de pregunta:

```
<question>
Pregunta: ¿Qué nombre deseas para el paquete del frontend?
Header: Nombre del frontend
```

> El valor ingresado reemplaza `<nombre-proyecto>` en el resto de la receta (nombre del directorio, carpeta del proyecto, package.json, etc.).

### Preguntar si habilita PWA

Usar la herramienta `question` para preguntar al usuario si desea habilitar soporte PWA (Progressive Web App). La respuesta determina si se usa `<pwa-habilitado>` como `true` o `false` en los pasos siguientes.

Ejemplo de pregunta:

```
<question>
Pregunta: ¿Deseas habilitar soporte PWA (Progressive Web App) para que la app sea descargable e instalable?
Header: Habilitar PWA
Options:
  - Si (Recommended)
  - No
```

> Si se habilita PWA, se agregara `vite-plugin-pwa`, se configurara el service worker, y se generaran los iconos necesarios. En caso contrario se omite todo lo relacionado a PWA.

## Componentes UI obligatorios

- **Modals**: Usar siempre el sistema de modals genérico (`ModalDialog.vue` + `useModalStore`) para cualquier ventana modal. El contenido del modal debe estar en un componente separado (ej. `*Modal.vue`) que se pasa por referencia al gestor via `modal.open({ component, props, title, size })`. No crear modals con HTML directo, no usar `v-if` para mostrar modals inline, y no definir el contenido del modal dentro del mismo archivo de la vista.
   - **Tablas**: Usar siempre el componente `TableEditor` de la librería `vue-table-editor` para listar datos en vistas de tabla. No crear tablas HTML manualmente. El TableEditor soporta columnas redimensionables, reordenables, selección de visibilidad, edición inline, ordenamiento server-side, paginación, scroll infinito, y preferencias persistentes de columna (orden/ancho/visibilidad). Pasar `:id` para habilitar persistencia y `:api` para carga server-side. Usar `@rowDoubleClick` para acciones al hacer doble clic. **No copiar ni crear `TableEditor.vue` en el proyecto**: se instala con `npm i vue-table-editor` y se importa desde el paquete.

### Patron de colores para botones — regla general del sitio

Este patron debe agregarse como regla general en `AGENTS.md` (raiz del proyecto) y aplicarse en todo el frontend:

| Accion | Clase Bootstrap | Color |
|---|---|---|
| Eliminar / Deshabilitar | `btn-danger` | Rojo |
| Agregar / Confirmar / Habilitar | `btn-success` | Verde |
| Editar / Modificar | `btn-warning` | Amarillo |
| Cancelar / Volver atras | `btn-secondary` | Gris |
| Informacion / Detalles | `btn-info` | Azul |

**Pasos obligatorios:**

1. Crear o actualizar `AGENTS.md` en la raiz del proyecto agregando estas reglas bajo la seccion `## Convenciones`:

   ```markdown
   ### Componentes UI obligatorios
   - **Modals**: Usar siempre el sistema de modals genérico (`ModalDialog.vue` + `useModalStore`) para cualquier ventana modal. El contenido del modal debe estar en un componente separado (ej. `*Modal.vue`) que se pasa por referencia al gestor via `modal.open({ component, props, title, size })`. No crear modals con HTML directo, no usar `v-if` para mostrar modals inline, y no definir el contenido del modal dentro del mismo archivo de la vista.
- **Tablas**: Usar siempre el componente `TableEditor` de la librería `vue-table-editor` para listar datos en vistas de tabla. No crear tablas HTML manualmente. El TableEditor soporta columnas redimensionables, reordenables, selección de visibilidad, edición inline, ordenamiento server-side, paginación, scroll infinito, y preferencias persistentes de columna (orden/ancho/visibilidad). Pasar `:id` para habilitar persistencia y `:api` para carga server-side. Usar `@rowDoubleClick` para acciones al hacer doble clic. **No copiar ni crear `TableEditor.vue` en el proyecto**: se instala con `npm i vue-table-editor` y se importa desde el paquete.
   ### Patron de colores para botones
   - **Patron de colores para botones:** usar estas clases Bootstrap de forma consistente en todo el sitio:
     - `btn-danger` (rojo) — Eliminar, deshabilitar, acciones destructivas
     - `btn-success` (verde) — Agregar, confirmar, habilitar, crear
     - `btn-warning` (amarillo) — Editar, modificar
     - `btn-secondary` (gris) — Cancelar, volver atras, cerrar
     - `btn-info` (azul) — Informacion, detalles, ver
   ```

2. Aplicar el mismo criterio en todos los botones y componentes del frontend:
   - En el toolbar de `TableEditor` (de `vue-table-editor`): `severity: 'btn-success'` para crear, `severity: 'btn-danger'` para eliminar, etc. (acepta clases legacy `btn-*` y las normaliza).
   - En `rowActions`: mismo criterio por accion
   - En cualquier otro boton del sitio: mantener consistencia

## 1. Crear el proyecto con Vite

```bash
npm create vite@latest <nombre-proyecto> -- --template vue
cd <nombre-proyecto>
npm install
```

Fijar la versión inicial en `package.json` a `1.0.0`:

```json
{
  "name": "<nombre-proyecto>",
  "version": "1.0.0",
  ...
}
```

## 2. Instalar dependencias

```bash
npm install bootstrap @popperjs/core bootstrap-icons pinia axios vue-router
npm install vue-table-editor
```

Si `<pwa-habilitado>` es `true`, instalar ademas:

```bash
npm install -D vite-plugin-pwa
```

## 3. Configurar Bootstrap global — `src/main.js`

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'
import { usePwaStore } from './stores/pwa'

// --- PWA install prompt listener ---
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  usePwaStore().capturarPrompt(e)
})

window.addEventListener('appinstalled', () => {
  usePwaStore().isInstalled = true
})
// -----------------------------------

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

## 3B. Configurar PWA (solo si habilitado) — `vite.config.js`

Si `<pwa-habilitado>` es `true`, modificar `vite.config.js` para incluir el plugin PWA:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '<nombre-proyecto>',
        short_name: '<nombre-proyecto>',
        description: 'Aplicacion instalable',
        theme_color: '#212529',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
```

Generar los iconos PWA manualmente o descargarlos desde https://favicon.io. Colocarlos en `public/`:
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/mask-icon.svg`

> El service worker se registra automaticamente gracias a `registerType: 'autoUpdate'` de `vite-plugin-pwa`. No es necesario agregar codigo manual en `main.js`.

### Store PWA — `src/stores/pwa.js`

Crear el store que captura el evento `beforeinstallprompt` y expone el metodo `install()`:

```javascript
import { defineStore } from 'pinia'

export const usePwaStore = defineStore('pwa', {
  state: () => ({
    installPrompt: null,
    isInstalled: false,
  }),
  getters: {
    puedeInstalar(state) {
      return state.installPrompt !== null && !state.isInstalled
    },
  },
  actions: {
    capturarPrompt(event) {
      event.preventDefault()
      this.installPrompt = event
    },
    async install() {
      if (!this.installPrompt) return
      this.installPrompt.prompt()
      const { outcome } = await this.installPrompt.userChoice
      if (outcome === 'accepted') {
        this.isInstalled = true
      }
      this.installPrompt = null
    },
  },
})
```

En `src/main.js`, agregar el listener global antes de montar la app:

```javascript
import { usePwaStore } from './stores/pwa'

window.addEventListener('beforeinstallprompt', (e) => {
  const pwa = usePwaStore()
  pwa.capturarPrompt(e)
})

window.addEventListener('appinstalled', () => {
  const pwa = usePwaStore()
  pwa.isInstalled = true
})
```

## 4. Router con vista por defecto — `src/router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import RolesView from '../views/RolesView.vue'
import PreferenciasView from '../views/PreferenciasView.vue'
import AdminPreferenciasView from '../views/AdminPreferenciasView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiereAuth: false },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiereAuth: true },
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: ProfileView,
    meta: { requiereAuth: true },
  },
  {
    path: '/preferencias',
    name: 'preferencias',
    component: PreferenciasView,
    meta: { requiereAuth: true },
  },
  {
    path: '/admin/usuarios',
    name: 'usuarios',
    component: UsuariosView,
    meta: { requiereAuth: true, permisos: ['usuarios.ver'] },
  },
  {
    path: '/admin/roles',
    name: 'roles',
    component: RolesView,
    meta: { requiereAuth: true, permisos: ['roles.ver'] },
  },
  {
    path: '/admin/preferencias',
    name: 'admin-preferencias',
    component: AdminPreferenciasView,
    meta: { requiereAuth: true, permisos: ['preferencias.ver'] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  
  if (to.meta.requiereAuth !== false && !auth.token) {
    return next({ name: 'login' })
  }
  
  if (to.name === 'login' && auth.token) {
    return next({ name: 'dashboard' })
  }

  if (to.meta.permisos) {
    const permisosRequeridos = to.meta.permisos
    const tienePermisos = permisosRequeridos.every((p) => auth.tienePermiso(p))
    if (!tienePermisos) {
      return next({ name: 'dashboard' })
    }
  }

  next()
})

export default router
```

## 5. Layout principal — `src/App.vue`

```javascript
<template>
  <div id="app">
    <template v-if="logueado">
      <Topbar @toggle-sidebar="toggleSidebar" />
      <div class="d-flex" style="margin-top: 56px; min-height: calc(100vh - 56px);">
        <Sidebar :visible="sidebarVisible" @close="sidebarVisible = false" />
        <main class="flex-grow-1 p-3" style="padding-top: 56px;">
          <router-view />
        </main>
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
    <ModalDialog />
  </div>
</template>

<script>
import Topbar from './components/layout/Topbar.vue'
import Sidebar from './components/layout/Sidebar.vue'
import ModalDialog from './components/ModalDialog.vue'
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  components: { Topbar, Sidebar, ModalDialog },
  data() {
    return {
      sidebarVisible: window.innerWidth >= 768,
    }
  },
  computed: {
    logueado() {
      return useAuthStore().token
    },
  },
  methods: {
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
    },
    handleResize() {
      if (window.innerWidth >= 768) {
        this.sidebarVisible = true
      }
    },
  },
  mounted() {
    const auth = useAuthStore()
    if (auth.token) {
      auth.fetchPerfil()
    }
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
```

## 6. Topbar — `src/components/layout/Topbar.vue`

```javascript
<template>
  <nav class="navbar navbar-dark bg-dark fixed-top px-3">
    <div class="d-flex align-items-center w-100">
      <button class="navbar-toggler border-0" type="button" @click="$emit('toggle-sidebar')" aria-label="Toggle sidebar">
        <span class="navbar-toggler-icon"></span>
      </button>
      <span class="navbar-brand mb-0 ms-2">Mi App</span>
      <div class="ms-auto d-flex align-items-center gap-2">
        <span class="text-light small">{{ auth.usuario?.username }}</span>
        <button class="btn btn-outline-light btn-sm" @click="logout">Salir</button>
      </div>
    </div>
  </nav>
</template>
```

## 7. Sidebar — `src/components/layout/Sidebar.vue`

Usa **Offcanvas** de Bootstrap 5 para móvil (overlay con backdrop) y sidebar estático en desktop dentro del flujo flex. Los items se renderizan con `v-for` desde un array, con iconos Bootstrap y resaltado de ruta activa.

```javascript
<template>
  <div>
    <!-- Offcanvas para móvil (se oculta en desktop con d-md-none) -->
    <div class="offcanvas offcanvas-start bg-dark text-white d-md-none"
      :class="{ show: visible && isMobile }"
      tabindex="-1"
      aria-labelledby="sidebarLabel">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title text-white" id="sidebarLabel">Menú</h5>
        <button type="button" class="btn-close btn-close-white" @click="close" aria-label="Cerrar"></button>
      </div>
      <div class="offcanvas-body p-0">
        <ul class="nav flex-column">
          <li class="nav-item" v-for="item in navItems" :key="item.to">
            <router-link :to="item.to" class="nav-link text-white nav-link-sidebar"
              :class="{ active: rutaActiva(item.to) }"
              @click="closeOnMobile">
              <i :class="['bi', item.icon, 'me-2']"></i>{{ item.label }}
            </router-link>
          </li>
          <li class="nav-item" v-if="pwa.puedeInstalar">
            <a href="#" class="nav-link text-white nav-link-sidebar" @click.prevent="instalarPwa">
              <i class="bi bi-download me-2"></i>Instalar App
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Sidebar estático para desktop -->
    <div class="d-none d-md-block bg-dark text-white sidebar-desktop">
      <div class="p-3">
        <h5 class="text-center mb-4">Menú</h5>
        <ul class="nav flex-column">
          <li class="nav-item" v-for="item in navItems" :key="item.to">
            <router-link :to="item.to" class="nav-link text-white nav-link-sidebar"
              :class="{ active: rutaActiva(item.to) }">
              <i :class="['bi', item.icon, 'me-2']"></i>{{ item.label }}
            </router-link>
          </li>
          <li class="nav-item" v-if="pwa.puedeInstalar">
            <a href="#" class="nav-link text-white nav-link-sidebar" @click.prevent="instalarPwa">
              <i class="bi bi-download me-2"></i>Instalar App
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Backdrop estilo Bootstrap para móvil -->
    <div v-if="visible && isMobile" class="offcanvas-backdrop fade show" @click="close"></div>
  </div>
</template>

<script>
import { useAuthStore } from '../../stores/auth'
import { usePwaStore } from '../../stores/pwa'

export default {
  name: 'Sidebar',
  props: {
    visible: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      auth: useAuthStore(),
      pwa: usePwaStore(),
    }
  },
  computed: {
    isMobile() {
      return window.innerWidth < 768
    },
    navItems() {
      const items = [
        { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', permiso: null },
        { to: '/perfil', label: 'Mi Perfil', icon: 'bi-person', permiso: null },
        { to: '/preferencias', label: 'Preferencias', icon: 'bi-gear', permiso: null },
        { to: '/admin/usuarios', label: 'Usuarios', icon: 'bi-people', permiso: 'usuarios.ver' },
        { to: '/admin/roles', label: 'Roles', icon: 'bi-shield', permiso: 'roles.ver' },
        { to: '/admin/preferencias', label: 'Admin Preferencias', icon: 'bi-sliders', permiso: 'preferencias.ver' },
      ]
      return items.filter(item => !item.permiso || this.auth.tienePermiso(item.permiso))
    },
  },
  methods: {
    rutaActiva(path) {
      return this.$route.path === path
    },
    close() {
      this.$emit('close')
    },
    closeOnMobile() {
      if (this.isMobile) this.close()
    },
    async instalarPwa() {
      await this.pwa.install()
      this.closeOnMobile()
    },
  },
}
</script>

<style scoped>
.sidebar-desktop {
  width: 250px;
  flex-shrink: 0;
  overflow-y: auto;
}
.nav-link-sidebar {
  border-radius: 0;
  padding: 0.65rem 1rem;
  border-left: 3px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.nav-link-sidebar:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
.nav-link-sidebar.active {
  background-color: rgba(13, 110, 253, 0.15);
  border-left-color: #0d6efd;
}
</style>
```

## 8. Store de autenticación — `src/stores/auth.js`

```javascript
import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  }),
  getters: {
    roles() {
      return this.usuario?.roles || []
    },
    permisos() {
      return this.usuario?.permisos || []
    },
    esAdmin() {
      return this.roles.includes('ADMIN')
    },
    tienePermiso() {
      return (permiso) => this.permisos.includes(permiso)
    },
  },
  actions: {
    async login(username, password) {
      const { data: body } = await api.post('/auth/login', { username, password })
      if (!body.status) throw new Error(body.error)
      this.token = body.data.token
      this.usuario = body.data.usuario
      localStorage.setItem('token', body.data.token)
      localStorage.setItem('usuario', JSON.stringify(body.data.usuario))
    },
    logout() {
      this.token = null
      this.usuario = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    },
    async fetchPerfil() {
      const { data: body } = await api.get('/auth/perfil')
      if (!body.status) throw new Error(body.error)
      this.usuario = body.data
      localStorage.setItem('usuario', JSON.stringify(body.data))
    },
    async actualizarPerfil(datos) {
      const { data: body } = await api.put('/auth/perfil', datos)
      if (!body.status) throw new Error(body.error)
      if (datos.username) {
        this.usuario = { ...this.usuario, username: datos.username }
        localStorage.setItem('usuario', JSON.stringify(this.usuario))
      }
    },
  },
})
```

## 9. Store Pinia de ejemplo — `src/stores/ejemplo.js`

```javascript
import { defineStore } from 'pinia'
import api from '../api/axios'

export const useEjemploStore = defineStore('ejemplo', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/items')
        this.items = data
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
  },
})
```

## 9B. Store de preferencias — `src/stores/preferencias.js`

```javascript
import { defineStore } from 'pinia'
import api from '../api/axios'

export const usePreferenciasStore = defineStore('preferencias', {
  state: () => ({
    definiciones: [],
    misValores: {},
    loading: false,
    error: null,
  }),
  getters: {
    valor(state) {
      return (clave) => state.misValores[clave] || null
    },
  },
  actions: {
    async fetchDefiniciones() {
      this.loading = true
      this.error = null
      try {
        const { data: body } = await api.get('/preferencias')
        if (body.status) this.definiciones = body.data
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    async fetchMisPreferencias() {
      this.loading = true
      this.error = null
      try {
        const { data: body } = await api.get('/preferencias/usuario')
        if (body.status) {
          this.definiciones = body.data.definiciones
          this.misValores = body.data.valores
        }
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    async guardarMisPreferencias(valores) {
      this.error = null
      try {
        const { data: body } = await api.put('/preferencias/usuario', valores)
        if (body.status) {
          this.misValores = { ...this.misValores, ...valores }
        }
        return body
      } catch (err) {
        this.error = err.message
        throw err
      }
    },
    async crearDefinicion(data) {
      const { data: body } = await api.post('/preferencias', data)
      if (body.status) await this.fetchDefiniciones()
      return body
    },
    async actualizarDefinicion(id, data) {
      const { data: body } = await api.put(`/preferencias/${id}`, data)
      if (body.status) await this.fetchDefiniciones()
      return body
    },
    async eliminarDefinicion(id) {
      const { data: body } = await api.delete(`/preferencias/${id}`)
      if (body.status) await this.fetchDefiniciones()
      return body
    },
  },
})
```

## 10. Instancia de Axios — `src/api/axios.js`

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const body = error.response.data
      if (body && body.status === false && (body.error === 'Token requerido' || body.error === 'Token invalido o expirado')) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
    }
    console.error('[API Error]', error.message)
    return Promise.reject(error)
  }
)

export default api
```

## 11. Vista de Login — `src/views/LoginView.vue`

```javascript
<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height: 100vh; background: #f5f5f5;">
    <div class="card shadow-sm" style="width: 100%; max-width: 400px;">
      <div class="card-body p-4">
        <h3 class="text-center mb-4">Iniciar Sesión</h3>

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label class="form-label">Usuario</label>
            <input v-model="username" type="text" class="form-control" required autocomplete="username" />
          </div>
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
            <input v-model="password" type="password" class="form-control" required autocomplete="current-password" />
          </div>
          <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
          <button type="submit" class="btn btn-dark w-100" :disabled="cargando">
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      cargando: false,
    }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      this.cargando = true
      try {
        await useAuthStore().login(this.username, this.password)
        await useAuthStore().fetchPerfil()
        this.$router.push({ name: 'dashboard' })
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al iniciar sesión'
      } finally {
        this.cargando = false
      }
    },
  },
}
</script>
```

## 12. Vista Dashboard — `src/views/DashboardView.vue`

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Dashboard</h1>
    <div class="alert alert-info">
      Bienvenido, <strong>{{ auth.usuario?.username }}</strong>.
      <span class="ms-2 badge bg-secondary">{{ roles.join(', ') }}</span>
    </div>
    <p class="text-muted">Hoy es {{ new Date().toLocaleDateString() }}.</p>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'DashboardView',
  data() {
    return { auth: useAuthStore() }
  },
  computed: {
    roles() {
      return this.auth.roles || []
    },
  },
}
</script>
```

## 13. Vista de Perfil — `src/views/ProfileView.vue`

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Mi Perfil</h1>

    <form @submit.prevent="guardar" class="row g-3" style="max-width: 500px;">
      <div class="col-12">
        <label class="form-label">Nombre de usuario</label>
        <input v-model="form.username" type="text" class="form-control" required />
      </div>

      <hr class="my-2" />
      <p class="text-muted small mb-0">Cambiar contraseña (dejar en blanco para mantenerla)</p>

      <div class="col-12">
        <label class="form-label">Contraseña actual</label>
        <input v-model="form.passwordActual" type="password" class="form-control" autocomplete="current-password" />
      </div>
      <div class="col-12">
        <label class="form-label">Nueva contraseña</label>
        <input v-model="form.passwordNuevo" type="password" class="form-control" autocomplete="new-password" />
      </div>
      <div class="col-12">
        <label class="form-label">Confirmar nueva contraseña</label>
        <input v-model="form.confirmarPassword" type="password" class="form-control" autocomplete="new-password" />
      </div>

      <div v-if="mensaje" class="alert" :class="mensajeTipo" role="alert">{{ mensaje }}</div>

      <div class="col-12">
        <button type="submit" class="btn btn-primary" :disabled="cargando">
          {{ cargando ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'ProfileView',
  data() {
    const auth = useAuthStore()
    return {
      auth,
      form: {
        username: auth.usuario?.username || '',
        passwordActual: '',
        passwordNuevo: '',
        confirmarPassword: '',
      },
      mensaje: '',
      mensajeTipo: '',
      cargando: false,
    }
  },
  methods: {
    async guardar() {
      this.mensaje = ''
      if (this.form.passwordNuevo && this.form.passwordNuevo !== this.form.confirmarPassword) {
        this.mensaje = 'Las contrasenas no coinciden'
        this.mensajeTipo = 'alert-danger'
        this.cargando = false
        return
      }
      this.cargando = true
      try {
        await this.auth.actualizarPerfil({
          username: this.form.username,
          passwordActual: this.form.passwordActual || undefined,
          passwordNuevo: this.form.passwordNuevo || undefined,
        })
        this.form.passwordActual = ''
        this.form.passwordNuevo = ''
        this.form.confirmarPassword = ''
        this.mensaje = 'Perfil actualizado correctamente'
        this.mensajeTipo = 'alert-success'
      } catch (err) {
        this.mensaje = err.response?.data?.error || 'Error al actualizar'
        this.mensajeTipo = 'alert-danger'
      } finally {
        this.cargando = false
      }
    },
  },
}
</script>
```

## 13B. Vista 404 — `src/views/NotFoundView.vue`

```javascript
<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height: 100vh; background: #f5f5f5;">
    <div class="text-center">
      <h1 class="display-1 fw-bold text-muted">404</h1>
      <p class="fs-4">Pagina no encontrada</p>
      <router-link to="/" class="btn btn-dark">Volver al inicio</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
}
</script>
```

## 13C. Vista Preferencias de Usuario — `src/views/PreferenciasView.vue`

Vista donde cada usuario configura sus propias preferencias. Renderiza un formulario dinámico basado en las definiciones de `preferencias_permitidas`.

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Mis Preferencias</h1>

    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>
    </div>

    <form v-else @submit.prevent="guardar" style="max-width: 600px;">
      <div v-for="def in store.definiciones" :key="def.id" class="mb-3">
        <label class="form-label fw-medium">{{ def.nombre }}</label>
        <p v-if="def.descripcion" class="text-muted small mb-1">{{ def.descripcion }}</p>

        <!-- Boolean -->
        <div v-if="def.tipo === 'boolean'" class="form-check form-switch">
          <input type="checkbox" class="form-check-input" :id="'pref-' + def.id"
            v-model="form[def.clave]" :true-value="'true'" :false-value="'false'" />
          <label class="form-check-label" :for="'pref-' + def.id">{{ form[def.clave] === 'true' ? 'Activado' : 'Desactivado' }}</label>
        </div>

        <!-- Select -->
        <select v-else-if="def.tipo === 'select' && def.opciones" class="form-select" v-model="form[def.clave]">
          <option v-for="opt in parseOpciones(def.opciones)" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Number -->
        <input v-else-if="def.tipo === 'number'" type="number" class="form-control" v-model.number="form[def.clave]" />

        <!-- JSON -->
        <textarea v-else-if="def.tipo === 'json'" class="form-control" rows="3" v-model="form[def.clave]"></textarea>

        <!-- String (default) -->
        <input v-else type="text" class="form-control" v-model="form[def.clave]" />
      </div>

      <div v-if="mensaje" class="alert" :class="mensajeTipo" role="alert">{{ mensaje }}</div>

      <button type="submit" class="btn btn-success" :disabled="guardando">
        {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </form>
  </div>
</template>

<script>
import { usePreferenciasStore } from '../stores/preferencias'

export default {
  name: 'PreferenciasView',
  data() {
    return {
      store: usePreferenciasStore(),
      form: {},
      mensaje: '',
      mensajeTipo: '',
      guardando: false,
    }
  },
  computed: {
    loading() {
      return this.store.loading
    },
  },
  methods: {
    parseOpciones(json) {
      try { return JSON.parse(json) } catch { return [] }
    },
    async guardar() {
      this.mensaje = ''
      this.guardando = true
      try {
        await this.store.guardarMisPreferencias(this.form)
        this.mensaje = 'Preferencias guardadas correctamente'
        this.mensajeTipo = 'alert-success'
      } catch (err) {
        this.mensaje = err.response?.data?.error || 'Error al guardar preferencias'
        this.mensajeTipo = 'alert-danger'
      } finally {
        this.guardando = false
      }
    },
  },
  async mounted() {
    await this.store.fetchMisPreferencias()
    this.form = {}
    for (const def of this.store.definiciones) {
      this.form[def.clave] = this.store.misValores[def.clave] ?? def.valor_defecto
    }
  },
}
</script>
```

## 13D. Tabla reutilizable — librería `vue-table-editor`

El frontend NO define el componente de tabla. Se consume la librería publicada `vue-table-editor`
(ya instalada en el paso 2). **No crear ni copiar `src/components/TableEditor.vue`.**

### Instalación
Ya se instaló en el paso 2. Verificar en `package.json`:
```bash
npm install vue-table-editor
```

### Importar y registrar el componente
En cada vista que use una tabla:
```javascript
import { TableEditor } from 'vue-table-editor'
import 'vue-table-editor/style.css'

export default {
  components: { TableEditor },
  // ...
}
```
> El CSS de la tabla es autocontenido (clases `te-*`). Importar `vue-table-editor/style.css`
> en cada vista (o una sola vez en `main.js`).

### Uso en template
```html
<TableEditor
  ref="table"
  id="mi-entidad"
  :api="apiEntidad"
  :config="tableConfig"
  @rowSelected="onRowSelected"
  @rowDoubleClick="onRowDblClick"
/>
```

### API (carga server-side / lazy)
```javascript
import { TableEditor, BtnConfig } from 'vue-table-editor'

apiEntidad: {
  list: (params) => api.get('/entidades/list', { params }).then(r => r.data),
  create: (data) => api.post('/entidades', data).then(r => r.data),
  edit: (data) => api.put('/entidades/' + data.id, data).then(r => r.data),
  delete: (data) => api.delete('/entidades/' + data.id).then(r => r.data),
}

tableConfig() {
  return {
    lazy: true,
    selectionMode: 'single',
    elementName: { singular: 'Entidad', gender: 'M' },
    buttons: {
      toolbar: [
        { key: 'create', icon: 'plus', severity: 'success', label: 'Nuevo',
          onClick: () => this.abrirModal() },
        { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
          isDisabled: () => !this.selectedRow, onClick: () => this.abrirModal(this.selectedRow) },
        { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
          isDisabled: () => !this.selectedRow, onClick: () => this.eliminar(this.selectedRow) },
      ],
      rowActions: [
        new BtnConfig({ key: 'ver', icon: 'eye', severity: 'info', label: 'Ver',
          onClick: (row) => alert('Detalle: ' + row.id) }),
      ],
    },
  }
}
```

`api.list` debe devolver:
```javascript
{ status: true, data: { rows, totalRecords, fields_def } }
```
donde cada `fields_def` define una columna: `{ field, headerName, type, sortable, form_type, css }`.

### Cliente-side (sin backend)
```html
<TableEditor :data="{ rows, fields_def }" :config="{ selectionMode: 'multiple' }" />
```

### Props
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `api` | Object | `null` | `{ list, create, edit, delete }` |
| `permisos` | Object | `{}` | `{ ver, crear, editar, eliminar }` |
| `config` | Object | `{}` | Configuración (ver abajo) |
| `data` | Object | `null` | `{ rows, fields_def }` para modo cliente-side |
| `id` | String | `null` | Clave de persistencia de preferencias |

### Config (`config`)
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `lazy` | Boolean | `false` | Carga server-side vía `api.list` |
| `selectionMode` | String | `'single'` | `'single'`, `'multiple'` o `null` |
| `infiniteScroll` | Boolean | `false` | Scroll infinito (por defecto `true` si lazy) |
| `elementName` | Object | — | `{ singular, gender }` para etiquetas |
| `columnGroups` | Array | — | `[{ headerName, fields }]` |
| `inlineEditing` | Object | — | `{ campos: { [field]: cfg }, api, debounce_ms, onSave }` |
| `valueFormatters` | Object | — | `{ [field]: (row) => html }` |
| `showFilterRow` | Boolean | `false` | Fila de filtros por columna |
| `scrollHeight` | String | `null` | Altura de scroll |
| `pageSize` | Number | `25` | Filas por página |
| `pageSizeOptions` | Array | `[25,50,100,200]` | Opciones del selector |
| `hideToolbar` / `hideRefresh` / `hideCsvExport` | Boolean | `false` | Oculta elementos |
| `showPaginator` | Boolean | `true` | Muestra paginador |
| `defaultColumnProps` | Object | — | Props por defecto a todas las columnas |
| `columnOrder` | Array | — | Orden inicial de columnas |
| `buttons` | Object | — | `{ toolbar: BtnConfig[], rowActions: BtnConfig[] }` |

### Eventos
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `loaded` | `Boolean` | Datos cargados |
| `rowSelected` | `Object \| null \| Array` | Fila(s) seleccionada(s) |
| `rowDoubleClick` | `Object` | Fila con doble click |

### Métodos (vía `ref`)
| Método | Descripción |
|--------|-------------|
| `loadData(data?)` | Recarga datos |
| `applyConfig()` | Re-aplica configuración |
| `refresh()` | Recarga y resetea selección |

### Iconos
Botones aceptan `icon` por nombre: `search`, `download`, `plus`, `pencil`, `trash`, `columns`, `eye`, `refresh`.
También acepta nombres legacy Bootstrap (`bi bi-plus-lg`, etc.) y los mapea automáticamente a los SVG incluidos.

### Severity de botones
Usa variantes propias (`te-btn-*`): `primary`, `secondary`, `success`, `info`, `warning`, `danger` y sus variantes `outline-*`.
También acepta valores legacy con prefijo `btn-` (p. ej. `btn-primary`) y los normaliza.

### Preferencias de columnas
Orden, ancho y visibilidad se persisten automáticamente con debounce. Por defecto usa
**localStorage** (autónomo, sin servidor). Para inyectar el store de preferencias del host
(por ejemplo `usePreferenciasStore`), pasar `config.preferencesStore` con:
```javascript
{ misValores: object, valor(key), guardarValores(data), fetchMisPreferencias() }
```
O registrar un adaptador global:
```javascript
import { setGlobalPreferencesAdapter } from 'vue-table-editor'
setGlobalPreferencesAdapter(miAdaptador)
```

## 13E. Vista Usuarios — `src/views/UsuariosView.vue`

Vista que utiliza `TableEditor` con server-side (lazy) y modal propio para crear/editar usuarios. Se pasa `:api` con el método `list` para carga de datos, y botones personalizados en `config.buttons` para crear/editar/eliminar.

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Usuarios</h1>
    <TableEditor
      ref="table"
      id="usuarios"
      :api="apiUsuarios"
      :config="tableConfig"
      @rowSelected="onRowSelected"
      @rowDoubleClick="onRowDblClick"
    />

    <!-- Modal -->
    <div class="modal fade" tabindex="-1" ref="modal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardar">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input v-model="form.username" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">{{ editando ? 'Nueva contrasena (dejar vacio para mantener)' : 'Contrasena' }}</label>
                <input v-model="form.password" type="password" class="form-control" :required="!editando" />
              </div>
              <div class="mb-3">
                <label class="form-label">Roles</label>
                <div v-for="rol in rolesDisponibles" :key="rol.id" class="form-check">
                  <input type="checkbox" :value="rol.id" v-model="form.rolIds" class="form-check-input" :id="'rol-' + rol.id" />
                  <label class="form-check-label" :for="'rol-' + rol.id">{{ rol.nombre }}</label>
                </div>
              </div>
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
import api from '../api/axios'
import { TableEditor } from 'vue-table-editor'
import 'vue-table-editor/style.css'

export default {
  name: 'UsuariosView',
  components: { TableEditor },
  data() {
    return {
      rolesDisponibles: [],
      selectedRow: null,
      editando: null,
      form: { username: '', password: '', rolIds: [] },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      apiUsuarios: {
        list: (params) => api.get('/admin/usuarios', { params }).then(r => r.data),
        create: (data) => api.post('/admin/usuarios', data).then(r => r.data),
        edit: (data) => api.put(`/admin/usuarios/${data.id}`, data).then(r => r.data),
        delete: (data) => api.delete(`/admin/usuarios/${data.id}`).then(r => r.data),
      },
    }
  },
  computed: {
    tableConfig() {
      return {
        lazy: true,
        selectionMode: 'single',
        elementName: { singular: 'Usuario', gender: 'M' },
        buttons: {
          toolbar: [
            { key: 'create', icon: 'plus', severity: 'success', label: 'Nuevo',
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
    async fetchRoles() {
      const { data: body } = await api.get('/admin/roles')
      if (body.status) this.rolesDisponibles = body.data
    },
    abrirModal(usuario) {
      this.errorModal = ''
      if (usuario) {
        this.editando = usuario
        this.form = {
          username: usuario.username,
          password: '',
          rolIds: usuario.roles?.map((r) => r.id) || [],
        }
      } else {
        this.editando = null
        this.form = { username: '', password: '', rolIds: [] }
      }
      this.modalInstance.show()
    },
    cerrarModal() { this.modalInstance.hide() },
    async guardar() {
      this.errorModal = ''
      this.cargando = true
      try {
        if (this.editando) {
          const payload = { username: this.form.username, rolIds: this.form.rolIds }
          if (this.form.password) payload.password = this.form.password
          await api.put(`/admin/usuarios/${this.editando.id}`, payload)
        } else {
          await api.post('/admin/usuarios', this.form)
        }
        this.modalInstance.hide()
        this.$refs.table.refresh()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally { this.cargando = false }
    },
    async eliminar(usuario) {
      if (!usuario || !confirm(`Eliminar usuario "${usuario.username}"?`)) return
      try {
        await api.delete(`/admin/usuarios/${usuario.id}`)
        this.$refs.table.refresh()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    this.fetchRoles()
  },
}
</script>
```

## 13F. Vista Roles — `src/views/RolesView.vue`

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Roles</h1>
    <TableEditor
      ref="table"
      id="roles"
      :api="apiRoles"
      :config="tableConfig"
      @rowSelected="onRowSelected"
      @rowDoubleClick="onRowDblClick"
    />

    <!-- Modal -->
    <div class="modal fade" tabindex="-1" ref="modal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar Rol' : 'Nuevo Rol' }}</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardar">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input v-model="form.nombre" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Descripcion</label>
                <input v-model="form.descripcion" type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Permisos</label>
                <div v-for="perm in permisosDisponibles" :key="perm.id" class="form-check">
                  <input type="checkbox" :value="perm.id" v-model="form.permisoIds" class="form-check-input" :id="'perm-' + perm.id" />
                  <label class="form-check-label" :for="'perm-' + perm.id">{{ perm.nombre }}</label>
                </div>
              </div>
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
import api from '../api/axios'
import { TableEditor } from 'vue-table-editor'
import 'vue-table-editor/style.css'

export default {
  name: 'RolesView',
  components: { TableEditor },
  data() {
    return {
      permisosDisponibles: [],
      selectedRow: null,
      editando: null,
      form: { nombre: '', descripcion: '', permisoIds: [] },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      apiRoles: {
        list: (params) => api.get('/admin/roles', { params }).then(r => r.data),
        create: (data) => api.post('/admin/roles', data).then(r => r.data),
        edit: (data) => api.put(`/admin/roles/${data.id}`, data).then(r => r.data),
        delete: (data) => api.delete(`/admin/roles/${data.id}`).then(r => r.data),
      },
    }
  },
  computed: {
    tableConfig() {
      return {
        lazy: true,
        selectionMode: 'single',
        elementName: { singular: 'Rol', gender: 'M' },
        buttons: {
          toolbar: [
            { key: 'create', icon: 'plus', severity: 'success', label: 'Nuevo',
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
    async fetchPermisos() {
      const { data: body } = await api.get('/admin/permisos')
      if (body.status) this.permisosDisponibles = body.data
    },
    abrirModal(rol) {
      this.errorModal = ''
      if (rol) {
        this.editando = rol
        this.form = {
          nombre: rol.nombre,
          descripcion: rol.descripcion || '',
          permisoIds: rol.permisos?.map((p) => p.id) || [],
        }
      } else {
        this.editando = null
        this.form = { nombre: '', descripcion: '', permisoIds: [] }
      }
      this.modalInstance.show()
    },
    cerrarModal() { this.modalInstance.hide() },
    async guardar() {
      this.errorModal = ''
      this.cargando = true
      try {
        const payload = { nombre: this.form.nombre, descripcion: this.form.descripcion, permisoIds: this.form.permisoIds }
        if (this.editando) {
          await api.put(`/admin/roles/${this.editando.id}`, payload)
        } else {
          await api.post('/admin/roles', payload)
        }
        this.modalInstance.hide()
        this.$refs.table.refresh()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally { this.cargando = false }
    },
    async eliminar(rol) {
      if (!rol || !confirm(`Eliminar rol "${rol.nombre}"?`)) return
      try {
        await api.delete(`/admin/roles/${rol.id}`)
        this.$refs.table.refresh()
      } catch (err) { alert(err.response?.data?.error || 'Error al eliminar') }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    this.fetchPermisos()
  },
}
</script>
```


## 13G. Vista Admin Preferencias — `src/views/AdminPreferenciasView.vue`

Vista de administracion del catalogo de preferencias permitidas. Usa `TableEditor` (de `vue-table-editor`)
con carga server-side vía `:api`.

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Administrar Preferencias</h1>
    <TableEditor
      ref="table"
      id="admin-preferencias"
      :api="apiPreferencias"
      :config="tableConfig"
      @rowSelected="onRowSelected"
      @rowDoubleClick="onRowDblClick"
    />

    <div class="modal fade" tabindex="-1" ref="modal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editando ? 'Editar Preferencia' : 'Nueva Preferencia' }}</h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardar">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Clave</label>
                <input v-model="form.clave" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input v-model="form.nombre" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Descripcion</label>
                <input v-model="form.descripcion" type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Tipo</label>
                <select v-model="form.tipo" class="form-select" required>
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div class="mb-3" v-if="form.tipo === 'select'">
                <label class="form-label">Opciones (separadas por coma)</label>
                <input v-model="opcionesStr" type="text" class="form-control" placeholder="opcion1,opcion2,opcion3" />
              </div>
              <div class="mb-3">
                <label class="form-label">Valor por defecto</label>
                <input v-model="form.valor_defecto" type="text" class="form-control" />
              </div>
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
import api from '../api/axios'
import { TableEditor, BtnConfig } from 'vue-table-editor'
import 'vue-table-editor/style.css'
import { usePreferenciasStore } from '../stores/preferencias'

export default {
  name: 'AdminPreferenciasView',
  components: { TableEditor },
  data() {
    return {
      store: usePreferenciasStore(),
      selectedRow: null,
      editando: null,
      form: { clave: '', nombre: '', descripcion: '', tipo: 'string', valor_defecto: '' },
      opcionesStr: '',
      errorModal: '',
      cargando: false,
      modalInstance: null,
      apiPreferencias: {
        list: (params) => api.get('/preferencias', { params }).then(r => r.data),
        create: (data) => api.post('/preferencias', data).then(r => r.data),
        edit: (data) => api.put('/preferencias/' + data.id, data).then(r => r.data),
        delete: (data) => api.delete('/preferencias/' + data.id).then(r => r.data),
      },
    }
  },
  computed: {
    tableConfig() {
      return {
        lazy: true,
        selectionMode: 'single',
        elementName: { singular: 'Preferencia', gender: 'F' },
        buttons: {
          toolbar: [
            { key: 'create', icon: 'plus', severity: 'success', label: 'Nuevo',
              onClick: () => this.abrirModal() },
            { key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              isDisabled: () => !this.selectedRow, onClick: () => this.abrirModal(this.selectedRow) },
            { key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              isDisabled: () => !this.selectedRow, onClick: () => this.eliminar(this.selectedRow) },
          ],
          rowActions: [
            new BtnConfig({ key: 'edit', icon: 'pencil', severity: 'warning', label: 'Editar',
              onClick: (r) => this.abrirModal(r) }),
            new BtnConfig({ key: 'delete', icon: 'trash', severity: 'danger', label: 'Eliminar',
              onClick: (r) => this.eliminar(r) }),
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
    abrirModal(def) {
      this.errorModal = ''
      if (def) {
        this.editando = def
        this.form = {
          clave: def.clave,
          nombre: def.nombre,
          descripcion: def.descripcion || '',
          tipo: def.tipo,
          valor_defecto: def.valor_defecto || '',
        }
        if (def.tipo === 'select' && def.opciones) {
          try { this.opcionesStr = JSON.parse(def.opciones).join(',') } catch { this.opcionesStr = '' }
        } else {
          this.opcionesStr = ''
        }
      } else {
        this.editando = null
        this.form = { clave: '', nombre: '', descripcion: '', tipo: 'string', valor_defecto: '' }
        this.opcionesStr = ''
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
        const payload = { ...this.form }
        if (payload.tipo === 'select' && this.opcionesStr) {
          payload.opciones = this.opcionesStr.split(',').map(s => s.trim()).filter(Boolean)
        }
        if (this.editando) {
          await this.store.actualizarDefinicion(this.editando.id, payload)
        } else {
          await this.store.crearDefinicion(payload)
        }
        this.modalInstance.hide()
        this.$refs.table.refresh()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally {
        this.cargando = false
      }
    },
    async eliminar(def) {
      if (!def || !confirm(`Eliminar preferencia "${def.clave}"?`)) return
      try {
        await this.store.eliminarDefinicion(def.id)
        this.$refs.table.refresh()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
  },
}
</script>
```

## 13H. Store de modals anidados — `src/stores/modal.js`

Store Pinia que maneja una pila de modals (`stack`). Cada modal guarda:
- `component` — componente a renderizar en el cuerpo (marcado con `markRaw`)
- `props` — parámetros a pasarle al componente
- `title` — título del header
- `size` — clase Bootstrap opcional (`sm`, `lg`, `xl`)
- `closable` — si muestra el botón de cerrar
- `position` — coordenadas `{x, y}` para arrastrar
- `zIndex` — calculado automáticamente para superposición

```javascript
import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import AlertDialog from '../components/AlertDialog.vue'

export const useModalStore = defineStore('modal', {
  state: () => ({
    stack: [],
    zIndexBase: 1050,
  }),
  getters: {
    topModal(state) {
      return state.stack.length > 0 ? state.stack[state.stack.length - 1] : null
    },
    hasModals(state) {
      return state.stack.length > 0
    },
    modalCount(state) {
      return state.stack.length
    },
  },
  actions: {
    open({ component, props = {}, title = '', size = '', closable = true }) {
      const id = Date.now() + Math.random()
      this.stack.push({
        id,
        component: markRaw(component),
        props,
        title,
        size,
        closable,
        zIndex: this.zIndexBase + this.stack.length * 10,
        position: { x: 20 + this.stack.length * 20, y: 20 + this.stack.length * 20 },
      })
      return id
    },
    close(id) {
      if (id) {
        const idx = this.stack.findIndex(m => m.id === id)
        if (idx >= 0) this.stack.splice(idx, 1)
      } else {
        this.stack.pop()
      }
    },
    closeAll() {
      this.stack = []
    },
    confirm({ text, confirmColor = 'btn-primary', confirmText = 'Confirmar', title = 'Confirmar' } = {}) {
      return new Promise((resolve) => {
        this.open({ component: ConfirmDialog, props: { text, confirmColor, confirmText, resolve }, title, size: 'sm', closable: false })
      })
    },
    alert({ message, severity = 'info', title = 'Atención' } = {}) {
      return new Promise((resolve) => {
        this.open({ component: AlertDialog, props: { message, severity, resolve }, title, size: 'sm', closable: false })
      })
    },
    updatePosition(id, x, y) {
      const modal = this.stack.find(m => m.id === id)
      if (modal) {
        modal.position.x = x
        modal.position.y = y
      }
    },
  },
})
```

## 13I. Componente Modal arrastrable — `src/components/ModalDialog.vue`

Renderiza la pila completa del store `useModalStore`. Cada modal:
- Se posiciona con `position: fixed` y coordenadas del store
- El header funciona como asa de arrastre (`@mousedown` + `mousemove`)
- Al hacer clic en un modal detrás del tope, lo trae al frente (`bringToFront`)
- Renderiza el componente dinámico con `<component :is="..." v-bind="..." />`
- Usa clases Bootstrap (`modal-header`, `modal-body`, `modal-content`, `shadow`)

```javascript
<template>
  <div v-for="(modal, index) in modalStore.stack" :key="modal.id"
    class="modal-dialog-overlay"
    :style="{ zIndex: modal.zIndex }"
    @mousedown="bringToFront(modal.id)">

    <div v-if="index === modalStore.stack.length - 1" class="modal-backdrop fade show"></div>

    <div class="modal-dialog modal-dialog-custom"
      :class="[modal.size ? 'modal-' + modal.size : '', 'show', 'd-block']"
      :style="{
        position: 'fixed',
        left: modal.position.x + 'px',
        top: modal.position.y + 'px',
        margin: 0,
        zIndex: modal.zIndex + 1,
      }">
      <div class="modal-content shadow">
        <div class="modal-header modal-header-drag"
          @mousedown.prevent="startDrag($event, modal)">
          <h5 class="modal-title">{{ modal.title }}</h5>
          <button v-if="modal.closable" type="button" class="btn-close" @click="modalStore.close(modal.id)"></button>
        </div>
        <div class="modal-body">
          <component :is="modal.component" v-bind="modal.props" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useModalStore } from '../stores/modal'

export default {
  name: 'ModalDialog',
  setup() {
    return { modalStore: useModalStore() }
  },
  data() {
    return {
      dragging: null,
      dragOffset: { x: 0, y: 0 },
    }
  },
  methods: {
    startDrag(event, modal) {
      this.dragging = modal.id
      this.dragOffset.x = event.clientX - modal.position.x
      this.dragOffset.y = event.clientY - modal.position.y
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },
    onDrag(event) {
      if (!this.dragging) return
      const modal = this.modalStore.stack.find(m => m.id === this.dragging)
      if (modal) {
        const x = event.clientX - this.dragOffset.x
        const y = event.clientY - this.dragOffset.y
        this.modalStore.updatePosition(this.dragging, Math.max(0, x), Math.max(0, y))
      }
    },
    stopDrag() {
      this.dragging = null
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },
    bringToFront(id) {
      const idx = this.modalStore.stack.findIndex(m => m.id === id)
      if (idx >= 0 && idx < this.modalStore.stack.length - 1) {
        const modal = this.modalStore.stack.splice(idx, 1)[0]
        modal.zIndex = this.modalStore.zIndexBase + this.modalStore.stack.length * 10
        modal.position.x = 20 + this.modalStore.stack.length * 20
        modal.position.y = 20 + this.modalStore.stack.length * 20
        this.modalStore.stack.push(modal)
      }
    },
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.onDrag)
    document.removeEventListener('mouseup', this.stopDrag)
  },
}
</script>

<style scoped>
.modal-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.modal-dialog-overlay > * {
  pointer-events: auto;
}
.modal-dialog-custom {
  min-width: 320px;
  max-width: 80vw;
  transition: none;
}
.modal-header-drag {
  cursor: move;
  user-select: none;
}
.modal-backdrop {
  pointer-events: auto;
}
</style>
```

## 13J. Confirmación genérica — `src/components/ConfirmDialog.vue`

Componente de confirmación reutilizable que usa el store `useModalStore`. Se invoca mediante `modalStore.confirm()` que retorna una Promise que resuelve a `true` o `false`.

```javascript
<template>
  <div>
    <p class="mb-3">{{ text }}</p>
    <div class="d-flex justify-content-end gap-2">
      <button class="btn btn-secondary" @click="cancel">Cancelar</button>
      <button :class="['btn', confirmColor]" @click="confirm">{{ confirmText }}</button>
    </div>
  </div>
</template>

<script>
import { useModalStore } from '../stores/modal'

export default {
  name: 'ConfirmDialog',
  props: {
    text: { type: String, required: true },
    confirmColor: { type: String, default: 'btn-primary' },
    confirmText: { type: String, default: 'Confirmar' },
    resolve: { type: Function, required: true },
  },
  data() {
    return { modalId: null }
  },
  mounted() {
    this.modalId = useModalStore().topModal?.id
  },
  methods: {
    confirm() {
      this.resolve(true)
      useModalStore().close(this.modalId)
    },
    cancel() {
      this.resolve(false)
      useModalStore().close(this.modalId)
    },
  },
}
</script>
```

## 13K. Alerta genérica — `src/components/AlertDialog.vue`

Componente de alerta reutilizable que usa el store `useModalStore`. Se invoca mediante `modalStore.alert()` que retorna una Promise.

```javascript
<template>
  <div>
    <div class="d-flex align-items-center mb-3">
      <i :class="iconClass" class="fs-4 me-2"></i>
      <span>{{ message }}</span>
    </div>
    <div class="d-flex justify-content-end">
      <button class="btn btn-primary" @click="close">Aceptar</button>
    </div>
  </div>
</template>

<script>
import { useModalStore } from '../stores/modal'

export default {
  name: 'AlertDialog',
  props: {
    message: { type: String, required: true },
    severity: { type: String, default: 'info' },
    resolve: { type: Function, default: () => {} },
  },
  data() {
    return { modalId: null }
  },
  computed: {
    iconClass() {
      const map = {
        error: 'bi bi-exclamation-triangle text-danger',
        atencion: 'bi bi-exclamation-circle text-warning',
        info: 'bi bi-info-circle text-primary',
      }
      return map[this.severity] || map.info
    },
  },
  mounted() {
    this.modalId = useModalStore().topModal?.id
  },
  methods: {
    close() {
      this.resolve()
      useModalStore().close(this.modalId)
    },
  },
}
</script>
```

## 14. Archivo `.env` y `.env.example`

```
VITE_API_URL=http://localhost:4000
```

Crear `.env.example` con el mismo contenido y agregar `.env` al `.gitignore`.

## 15. Scripts en `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 16. `.gitignore`

```
node_modules/
.env
dist/
```

## 17. Estructura final

```
<proyecto>/
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── public/                         (si PWA habilitado)
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── mask-icon.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── api/
│   │   └── axios.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.vue
│   │   │   └── Sidebar.vue
│   │   └── ModalDialog.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── auth.js
│   │   ├── ejemplo.js
│   │   ├── modal.js
│   │   ├── preferencias.js
│   │   └── pwa.js                     (si PWA habilitado)
│   └── views/
│       ├── AdminPreferenciasView.vue
│       ├── DashboardView.vue
│       ├── LoginView.vue
│       ├── NotFoundView.vue
│       ├── PreferenciasView.vue
│       ├── ProfileView.vue
│       ├── RolesView.vue
│       └── UsuariosView.vue
└── node_modules/
```

## 18. Verificación obligatoria

Ejecutar los siguientes comandos en orden y **confirmar que cada uno devuelva el resultado esperado**. Si algún comando falla, abortar y notificar el error.

| # | Comando | Resultado esperado |
|---|---------|-------------------|
| 1 | `npm run dev` (dejar correr 3s, luego Ctrl+C) | Vite imprime `http://localhost:5173` sin errores de compilación |
| 2 | `npm run build` | `✓ built in Xs` sin errores. Se genera `dist/` con `index.html` y assets |
| 3 | Verificar `AGENTS.md` en raíz del proyecto | Existe con la sección `## Convenciones` que incluye las reglas de componentes UI obligatorios y el patrón de colores para botones |
| 4 | Verificar `.env` | Contiene `VITE_API_URL=<url>` |
| 5 | Verificar `.gitignore` | Contiene `node_modules/`, `.env`, `dist/` |
| 6 | Verificar estructura de directorios | Existen: `src/views/`, `src/components/layout/`, `src/stores/`, `src/api/`, `src/router/` |
| 7 | Verificar vistas de preferencias | Existen: `src/views/PreferenciasView.vue`, `src/views/AdminPreferenciasView.vue`, `src/stores/preferencias.js` |
| 8 | Leer `DOCUMENTACION.md` | Existe con todas las secciones completas (rutas, estructura, dependencias) |

**Validación cruzada con backend (si el backend ya está operativo):**

```bash
# Iniciar frontend
npm run dev &
FRONTEND_PID=$!

# Iniciar backend (desde el directorio del backend)
cd ../<backend-directorio> && node src/index.js &
BACKEND_PID=$!

sleep 2

# Verificar que frontend y backend responden
curl -s -o /dev/null -w '%{http_code}' http://localhost:5173
# → 200

curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/health
# → 200

# Detener procesos
kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
```

> Nota: La verificación del paso 1 confirma que el proyecto compila y el servidor de desarrollo arranca. La validación cruzada con backend (pasos adicionales) es opcional pero recomendada si el backend ya existe.

## 19. Documentación básica — `DOCUMENTACION.md`

Generar o actualizar el archivo `DOCUMENTACION.md` en la raíz del proyecto con la siguiente estructura. Este documento debe ser legible por humanos y fácilmente parseable por IA, usando secciones claras, metadatos estructurados y tablas consistentes.

```markdown
---
title: <nombre-proyecto>
type: frontend
framework: Vue 3 + Vite + Bootstrap + Pinia
language: JavaScript (Options API)
created: <fecha-actual>
---

# <nombre-proyecto>

Frontend Vue 3 con Vite, Bootstrap, Pinia y Axios.

---

## REQUISITOS

- Node.js >= 18
- npm >= 9

## CONFIGURACION

| Paso | Accion |
|------|--------|
| 1 | `git clone <repo>` |
| 2 | `npm install` |
| 3 | Copiar `.env.example` a `.env` y completar variables |
| 4 | `npm run dev` |

## VARIABLES DE ENTORNO

| Variable | Descripcion | Valor ejemplo |
|----------|-------------|---------------|
| `VITE_API_URL` | URL base de la API | `http://localhost:4000` |

Ver archivo `.env.example` para referencia.

## SCRIPTS

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para produccion |
| `npm run preview` | Previsualiza build de produccion |

## PWA (si habilitado)

La aplicacion es instalable como PWA en dispositivos moviles y desktop (Chrome, Edge, etc.). Para instalar:

1. Abrir la app en el navegador.
2. Hacer clic en **Instalar App** en el menu lateral.
3. Seguir las instrucciones del dialogo de instalacion del navegador.

> El service worker se actualiza automaticamente (`autoUpdate`). Los iconos PWA estan en `public/`.

## RUTAS

| Ruta | Vista | Descripcion | Requiere Auth |
|------|-------|-------------|-------------|
| `/login` | `LoginView` | Inicio de sesion | No |
| `/` | `DashboardView` | Panel principal | Si |
| `/perfil` | `ProfileView` | Configuracion de perfil (username / password) | Si |
| `/preferencias` | `PreferenciasView` | Configuracion de preferencias personales | Si |
| `/admin/usuarios` | `UsuariosView` | Gestion de usuarios (solo ADMIN) | Si |
| `/admin/roles` | `RolesView` | Gestion de roles y permisos (solo ADMIN) | Si |
| `/admin/preferencias` | `AdminPreferenciasView` | Gestion de definiciones de preferencias (solo ADMIN) | Si |
| `/:pathMatch(.*)*` | `NotFoundView` | Pagina 404 | No |

## ESTRUCTURA

```
<proyecto>/
├── .env
├── .env.example
├── .gitignore
├── DOCUMENTACION.md
├── index.html
├── package.json
├── vite.config.js
├── public/                         (si PWA habilitado)
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── mask-icon.svg
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── api/
│   │   └── axios.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Topbar.vue
│   │   │   └── Sidebar.vue
│   │   └── ModalDialog.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── auth.js
│   │   ├── ejemplo.js
│   │   ├── modal.js
│   │   ├── preferencias.js
│   │   └── pwa.js                     (si PWA habilitado)
│   └── views/
│       ├── AdminPreferenciasView.vue
│       ├── DashboardView.vue
│       ├── LoginView.vue
│       ├── NotFoundView.vue
│       ├── PreferenciasView.vue
│       ├── ProfileView.vue
│       ├── RolesView.vue
│       └── UsuariosView.vue
└── node_modules/
```

## DEPENDENCIAS

| Paquete | Version | Uso |
|---------|---------|-----|
| vue | ^3 | Framework frontend |
| vite | ^5 | Bundler / dev server |
| bootstrap | ^5 | UI components / estilos |
| bootstrap-icons | ^1 | Iconos para la interfaz |
| @popperjs/core | ^2 | Tooltips / popovers de Bootstrap |
| pinia | ^2 | Estado global |
| vue-router | ^4 | Enrutamiento SPA |
| axios | ^1 | HTTP client |
| vue-table-editor | ^1 | Tabla genérica reutilizable (TableEditor) |
| vite-plugin-pwa | - (dev) | Service worker y manifest PWA (si habilitado) |
```

Reglas para la documentación:
- El archivo `DOCUMENTACION.md` debe crearse **siempre** al generar el proyecto desde cero.
- Al agregar nuevas rutas/vistas, **insertar** las nuevas rutas en la tabla `### RUTAS` manteniendo el formato uniforme.
- Mantener la sección `ESTRUCTURA` sincronizada con los directorios reales del proyecto.
- No eliminar secciones ni contenido agregado manualmente por el usuario.
- No usar acentos ni caracteres especiales en los titulos de seccion para facilitar el parseo automatico.

## Reglas obligatorias

- **Sin TypeScript:** todo en JavaScript plano, usando Options API (no Composition API ni `<script setup>`).
- **Sin Composition API:** usar exclusivamente `data()`, `methods`, `computed`, `watch`, `props`, `emits`.
- **Bootstrap importado globalmente** en `main.js` (CSS + JS).
- **Pinia como store global** — cada feature con su propio store en `src/stores/`.
- **Axios como única capa HTTP** — todas las peticiones al backend pasan por `src/api/axios.js`.
- **Topbar fija + Sidebar lateral** con toggle en móvil (hamburguesa) y siempre visible en desktop.
- **Variables de entorno** con prefijo `VITE_` según convención de Vite.
- **Separar responsabilidades:** vistas en `views/`, componentes en `components/`, stores en `stores/`, router en `router/`, API en `api/`.
