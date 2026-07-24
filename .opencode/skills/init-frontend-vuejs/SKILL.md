---
name: init-frontend-vuejs
description: Inicializar un frontend Vue.js 3 con Vite, Bootstrap, Pinia, Axios y layout responsive
requires: [init-backend-nodejs]
---

# Skill: Inicializar frontend Vue.js con Vite, Bootstrap y Pinia

Usar cuando el usuario pida **crear un frontend desde cero** con Vue.js 3, Vite, Bootstrap, Pinia, Axios, barra superior y menú lateral (hamburguesa en móvil). **Prohibido usar TypeScript** — todo el código debe ser JavaScript con Options API.

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

1. Crear o actualizar `AGENTS.md` en la raiz del proyecto agregando esta regla bajo la seccion `## Convenciones`:

   ```markdown
   - **Patron de colores para botones:** usar estas clases Bootstrap de forma consistente en todo el sitio:
     - `btn-danger` (rojo) — Eliminar, deshabilitar, acciones destructivas
     - `btn-success` (verde) — Agregar, confirmar, habilitar, crear
     - `btn-warning` (amarillo) — Editar, modificar
     - `btn-secondary` (gris) — Cancelar, volver atras, cerrar
     - `btn-info` (azul) — Informacion, detalles, ver
   ```

2. Aplicar el mismo criterio en todos los botones del frontend:
   - En toolbar de `TableEditor.vue`: `severity: 'btn-success'` para crear, `severity: 'btn-danger'` para eliminar, etc.
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

## 13D. Componente de tabla reutilizable — `src/components/TableEditor.vue`

Componente de tabla Bootstrap con toolbar, ordenamiento, busqueda global, paginacion, seleccion de filas y acciones por fila.

```javascript
<template>
  <div class="te-wrapper">
    <!-- Toolbar -->
    <div v-if="!config?.hideToolbar" class="te-toolbar">
      <div class="te-toolbar-start">
        <button v-for="btn in toolbarBtns" :key="btn.key" :class="['btn', 'btn-sm', btn.severity, btn.class]"
          :disabled="btn.disabled" @click="btn.action" :title="btn.label">
          <i v-if="btn.icon" :class="btn.icon" class="me-1"></i>{{ btn.label }}
        </button>
      </div>
      <div class="te-toolbar-end">
        <div class="dropdown d-inline-block me-2">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Columnas
          </button>
          <div class="dropdown-menu p-2" style="min-width:200px">
            <div v-for="col in allColumns" :key="col.field" class="form-check">
              <input type="checkbox" :id="'tc-'+col.field" :value="col" v-model="visibleCols"
                class="form-check-input" @change="emitCols" />
              <label :for="'tc-'+col.field" class="form-check-label">{{ col.headerName }}</label>
            </div>
          </div>
        </div>
        <div class="input-group input-group-sm" style="width:200px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" v-model="search" @input="debouncedSearch" placeholder="Buscar..." />
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="te-scroll" :style="scrollHeight ? { maxHeight: scrollHeight } : {}">
      <div v-if="loading" class="te-loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
      <table class="table te-table" :class="{ 'table-striped': striped }">
        <colgroup>
          <col v-if="selectable" style="width:40px" />
          <col v-if="actions?.length" style="width:1%" />
          <col v-for="col in columns" :key="col.field" :style="col.width ? { width: col.width } : {}" />
        </colgroup>
        <thead class="table-light">
          <tr>
            <th v-if="selectable" class="te-th">
              <input type="checkbox" class="form-check-input" :checked="allSelected" @change="toggleAll" />
            </th>
            <th v-if="actions?.length" class="te-th">Acciones</th>
            <th v-for="col in columns" :key="col.field" class="te-th" :class="{ 'te-sortable': col.sortable !== false }"
              @click="col.sortable !== false && toggleSort(col.field)">
              {{ col.headerName }}
              <span v-if="col.sortable !== false" class="te-sort-icon">
                {{ sortField === col.field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in displayRows" :key="ri"
            :class="{ 'table-active': isSelected(row), 'te-row-click': selectable }"
            @click="selectable && selectRow(row)">
            <td v-if="selectable" class="te-td" @click.stop>
              <input type="checkbox" class="form-check-input" :checked="isSelected(row)" @change="toggleRow(row)" />
            </td>
            <td v-if="actions?.length" class="te-td te-actions">
              <button v-for="act in actions" :key="act.key" :class="['btn', 'btn-sm', act.severity || 'btn-outline-primary', 'me-1']"
                :disabled="act.disabled?.(row)" @click.stop="act.action(row)" :title="act.label">
                <i v-if="act.icon" :class="act.icon"></i> {{ act.label }}
              </button>
            </td>
            <td v-for="col in columns" :key="col.field" class="te-td" :class="col.css">
              <template v-if="col.formatter">
                <span v-html="col.formatter(row, col.field)"></span>
              </template>
              <template v-else-if="col.field === 'roles' && row.roles">
                <span v-for="r in row.roles" :key="r.id || r" class="badge bg-secondary me-1">{{ r.nombre || r }}</span>
              </template>
              <template v-else-if="col.type === 'color' && row[col.field]">
                <span class="te-color-badge" :style="{ background: '#'+row[col.field], color: invertColor('#'+row[col.field]) }">
                  {{ row[col.field] }}
                </span>
              </template>
              <template v-else>
                {{ formatVal(row[col.field], col) }}
              </template>
            </td>
          </tr>
          <tr v-if="!displayRows.length">
            <td :colspan="colspan" class="text-center text-muted py-4">Sin registros</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginador -->
    <div v-if="showPaginator" class="te-paginator">
      <span class="text-muted small">
        Mostrando {{ pageStart }}-{{ pageEnd }} de {{ totalRows }}
      </span>
      <div class="te-page-controls">
        <button class="btn btn-sm btn-outline-secondary" :disabled="page<=1" @click="goPage(1)">««</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page<=1" @click="goPage(page-1)">«</button>
        <span class="mx-2 small">{{ page }}/{{ totalPages }}</span>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page>=totalPages" @click="goPage(page+1)">»</button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page>=totalPages" @click="goPage(totalPages)">»»</button>
      </div>
      <select class="form-select form-select-sm" style="width:auto" v-model="pageSize" @change="page=1">
        <option :value="25">25</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableEditor',
  props: {
    columns: { type: Array, required: true },
    data: { type: Array, default: () => [] },
    config: { type: Object, default: () => ({}) },
    actions: { type: Array, default: () => [] },
    selectable: { type: Boolean, default: false },
    striped: { type: Boolean, default: true },
    showPaginator: { type: Boolean, default: true },
    scrollHeight: { type: String, default: null },
    serverSide: { type: Boolean, default: false },
    totalRecords: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
  },
  emits: ['rowSelected', 'rowDoubleClick', 'columnsChange', 'update:serverParams'],
  data() {
    return {
      visibleCols: [...this.columns],
      allColumns: [...this.columns],
      search: '',
      sortField: null,
      sortDir: 'asc',
      page: 1,
      pageSize: 25,
      selected: [],
      filterTimer: null,
    }
  },
  computed: {
    columns() {
      return this.visibleCols
    },
    filtered() {
      if (this.serverSide) return this.data
      let r = [...this.data]
      const q = this.search.toLowerCase().trim()
      if (q) {
        r = r.filter(row => this.columns.some(c => {
          const v = row[c.field]
          return v != null && String(v).toLowerCase().includes(q)
        }))
      }
      if (this.sortField) {
        r.sort((a, b) => {
          let va = a[this.sortField], vb = b[this.sortField]
          if (va == null) va = ''
          if (vb == null) vb = ''
          if (typeof va === 'number' && typeof vb === 'number')
            return this.sortDir === 'asc' ? va - vb : vb - va
          va = String(va).toLowerCase()
          vb = String(vb).toLowerCase()
          return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        })
      }
      return r
    },
    totalRows() { return this.serverSide ? this.totalRecords : this.filtered.length },
    totalPages() { return Math.max(1, Math.ceil(this.totalRows / this.pageSize)) },
    displayRows() {
      if (this.serverSide) return this.data
      const s = (this.page - 1) * this.pageSize
      return this.filtered.slice(s, s + this.pageSize)
    },
    pageStart() { return (this.page - 1) * this.pageSize + 1 },
    pageEnd() { return Math.min(this.page * this.pageSize, this.totalRows) },
    colspan() {
      let n = this.columns.length
      if (this.selectable) n++
      if (this.actions?.length) n++
      return n
    },
    allSelected() {
      return this.displayRows.length > 0 && this.displayRows.every(r => this.isSelected(r))
    },
    toolbarBtns() {
      const cfg = this.config.toolbar || []
      const btns = []
      for (const b of cfg) {
        btns.push({
          key: b.key,
          label: b.label,
          icon: b.icon || null,
          severity: b.severity || 'btn-outline-primary',
          class: b.class || '',
          disabled: b.disabled?.(this) || false,
          action: () => b.action(this),
        })
      }
      return btns
    },
  },
  watch: {
    pageSize() {
      this.page = 1
      this.emitServerParams()
    },
  },
  methods: {
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
    debouncedSearch() {
      if (this.filterTimer) clearTimeout(this.filterTimer)
      this.filterTimer = setTimeout(() => { this.page = 1; this.emitServerParams() }, 300)
    },
    goPage(p) {
      this.page = Math.max(1, Math.min(p, this.totalPages))
      this.emitServerParams()
    },
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
    isSelected(row) { return this.selected.includes(row) },
    selectRow(row) {
      if (!this.selectable) return
      if (this.config.singleSelect) {
        this.selected = [row]
      } else {
        const i = this.selected.indexOf(row)
        if (i >= 0) this.selected.splice(i, 1)
        else this.selected.push(row)
      }
      this.$emit('rowSelected', this.config.singleSelect ? this.selected[0] : [...this.selected])
    },
    toggleRow(row) { this.selectRow(row) },
    toggleAll() {
      if (this.allSelected) {
        this.selected = this.selected.filter(r => !this.displayRows.includes(r))
      } else {
        for (const r of this.displayRows) {
          if (!this.selected.includes(r)) this.selected.push(r)
        }
      }
      this.$emit('rowSelected', [...this.selected])
    },
    clearSelection() { this.selected = []; this.$emit('rowSelected', []) },
    emitCols() { this.$emit('columnsChange', this.visibleCols) },
    formatVal(val, col) {
      if (val == null || val === '') return '-'
      if (col.type === 'date' || col.field?.endsWith('_at') || col.field?.endsWith('At')) {
        try { return new Date(val).toLocaleDateString() } catch { return val }
      }
      if (col.type === 'datetime') {
        try { return new Date(val).toLocaleString() } catch { return val }
      }
      if (col.type === 'boolean' || col.type === 'bool') return val ? 'Si' : 'No'
      return val
    },
    invertColor(hex) {
      if (!hex || hex.length < 7) return '#fff'
      const r = 255 - parseInt(hex.slice(1, 3), 16)
      const g = 255 - parseInt(hex.slice(3, 5), 16)
      const b = 255 - parseInt(hex.slice(5, 7), 16)
      return `rgb(${r},${g},${b})`
    },
  },
}
</script>

<style scoped>
.te-wrapper { display: flex; flex-direction: column; height: 100%; font-size: 0.875rem; }
.te-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: #fff; border: 1px solid #dee2e6; border-radius: 0.375rem 0.375rem 0 0; padding: 0.5rem 0.75rem; flex-wrap: wrap; }
.te-toolbar-start { display: flex; align-items: center; gap: 0.25rem; }
.te-toolbar-end { display: flex; align-items: center; }
.te-scroll { overflow: auto; border: 1px solid #dee2e6; border-top: 0; border-bottom: 0; background: #fff; position: relative; min-height: 100px; }
.te-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.te-scroll::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 4px; }
.te-loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 5; }
.te-table { margin-bottom: 0; width: 100%; }
.te-table > :not(caption) > * > * { padding: 0.4rem 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.te-th { position: sticky; top: 0; background: #f0f2f5; z-index: 1; user-select: none; font-weight: 600; }
.te-sortable { cursor: pointer; }
.te-sortable:hover { color: #0d6efd; }
.te-sort-icon { font-size: 0.65rem; margin-left: 0.25rem; color: #adb5bd; }
.te-td { max-width: 300px; overflow: hidden; text-overflow: ellipsis; }
.te-actions { white-space: nowrap; }
.te-row-click { cursor: pointer; }
.te-paginator { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0 0 0.375rem 0.375rem; padding: 0.35rem 0.75rem; flex-wrap: wrap; }
.te-page-controls { display: flex; align-items: center; }
.te-color-badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(0,0,0,0.1); }
</style>
```

## 13E. Vista Usuarios — `src/views/UsuariosView.vue`

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Usuarios</h1>
    <TableEditor ref="table" :columns="columnDefs" :data="usuarios" :config="tableConfig" selectable
      :actions="rowActions" :serverSide="true" :totalRecords="totalRecords" :loading="loading"
      @rowSelected="onRowSelected" @update:serverParams="onServerParams" />

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
import TableEditor from '../components/TableEditor.vue'

export default {
  name: 'UsuariosView',
  components: { TableEditor },
  data() {
    return {
      usuarios: [],
      totalRecords: 0,
      loading: false,
      rolesDisponibles: [],
      selectedRow: null,
      editando: null,
      form: { username: '', password: '', rolIds: [] },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      serverParams: { page: 1, pageSize: 25, sortField: null, sortDir: 'asc', search: '' },
    }
  },
  computed: {
    columnDefs() {
      return [
        { field: 'id', headerName: 'ID', width: '70px', sortable: false },
        { field: 'username', headerName: 'Username' },
        { field: 'roles', headerName: 'Roles' },
        { field: 'created_at', headerName: 'Creado', type: 'date' },
      ]
    },
    tableConfig() {
      return {
        toolbar: [
          { key: 'refresh', label: '', icon: 'bi bi-arrow-clockwise', severity: 'btn-outline-info', action: () => this.fetchUsuarios() },
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
      this.fetchUsuarios()
    },
    async fetchUsuarios() {
      this.loading = true
      try {
        const query = new URLSearchParams({
          page: this.serverParams.page,
          pageSize: this.serverParams.pageSize,
          sortField: this.serverParams.sortField || '',
          sortDir: this.serverParams.sortDir,
          search: this.serverParams.search,
        }).toString()
        const { data: body } = await api.get(`/admin/usuarios?${query}`)
        if (body.status) {
          this.usuarios = body.data.rows
          this.totalRecords = body.data.total
        }
      } catch (err) {
        console.error('Error al cargar usuarios:', err)
      } finally {
        this.loading = false
      }
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
          rolIds: usuario.roles.map((r) => r.id),
        }
      } else {
        this.editando = null
        this.form = { username: '', password: '', rolIds: [] }
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
        if (this.editando) {
          const payload = { username: this.form.username, rolIds: this.form.rolIds }
          if (this.form.password) payload.password = this.form.password
          await api.put(`/admin/usuarios/${this.editando.id}`, payload)
        } else {
          await api.post('/admin/usuarios', this.form)
        }
        this.modalInstance.hide()
        await this.fetchUsuarios()
        this.$refs.table.clearSelection()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally {
        this.cargando = false
      }
    },
    async eliminar(usuario) {
      if (!usuario || !confirm(`Eliminar usuario "${usuario.username}"?`)) return
      try {
        await api.delete(`/admin/usuarios/${usuario.id}`)
        await this.fetchUsuarios()
        this.$refs.table.clearSelection()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
    exportCsv() {
      if (!this.usuarios.length) return
      const cols = this.columnDefs
      let csv = cols.map(c => this.csvEsc(c.headerName)).join(',') + '\n'
      for (const r of this.usuarios) {
        csv += cols.map(c => this.csvEsc(r[c.field] != null ? String(r[c.field]) : '')).join(',') + '\n'
      }
      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv)
      a.download = 'usuarios_pagina_actual.csv'
      a.click()
    },
    csvEsc(v) {
      v = String(v).replace(/"/g, '""')
      return v.includes(',') || v.includes('"') || v.includes('\n') ? '"' + v + '"' : v
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    this.fetchUsuarios()
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
    <TableEditor ref="table" :columns="columnDefs" :data="roles" :config="tableConfig" selectable
      :actions="rowActions" :serverSide="true" :totalRecords="totalRecords" :loading="loading"
      @rowSelected="onRowSelected" @update:serverParams="onServerParams" />

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
import TableEditor from '../components/TableEditor.vue'

export default {
  name: 'RolesView',
  components: { TableEditor },
  data() {
    return {
      roles: [],
      totalRecords: 0,
      loading: false,
      permisosDisponibles: [],
      selectedRow: null,
      editando: null,
      form: { nombre: '', descripcion: '', permisoIds: [] },
      errorModal: '',
      cargando: false,
      modalInstance: null,
      serverParams: { page: 1, pageSize: 25, sortField: null, sortDir: 'asc', search: '' },
    }
  },
  computed: {
    columnDefs() {
      return [
        { field: 'id', headerName: 'ID', width: '70px', sortable: false },
        { field: 'nombre', headerName: 'Nombre' },
        { field: 'descripcion', headerName: 'Descripcion' },
        { field: 'permisos', headerName: 'Permisos' },
      ]
    },
    tableConfig() {
      return {
        toolbar: [
          { key: 'refresh', label: '', icon: 'bi bi-arrow-clockwise', severity: 'btn-outline-info', action: () => this.fetchRoles() },
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
      this.fetchRoles()
    },
    async fetchRoles() {
      this.loading = true
      try {
        const query = new URLSearchParams({
          page: this.serverParams.page,
          pageSize: this.serverParams.pageSize,
          sortField: this.serverParams.sortField || '',
          sortDir: this.serverParams.sortDir,
          search: this.serverParams.search,
        }).toString()
        const { data: body } = await api.get(`/admin/roles?${query}`)
        if (body.status) {
          this.roles = body.data.rows
          this.totalRecords = body.data.total
        }
      } catch (err) {
        console.error('Error al cargar roles:', err)
      } finally {
        this.loading = false
      }
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
          permisoIds: rol.permisos.map((p) => p.id),
        }
      } else {
        this.editando = null
        this.form = { nombre: '', descripcion: '', permisoIds: [] }
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
        if (this.editando) {
          await api.put(`/admin/roles/${this.editando.id}`, this.form)
        } else {
          await api.post('/admin/roles', this.form)
        }
        this.modalInstance.hide()
        await this.fetchRoles()
        this.$refs.table.clearSelection()
      } catch (err) {
        this.errorModal = err.response?.data?.error || 'Error al guardar'
      } finally {
        this.cargando = false
      }
    },
    async eliminar(rol) {
      if (!rol || !confirm(`Eliminar rol "${rol.nombre}"?`)) return
      try {
        await api.delete(`/admin/roles/${rol.id}`)
        await this.fetchRoles()
        this.$refs.table.clearSelection()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    this.fetchRoles()
    this.fetchPermisos()
  },
}
</script>
```

## 13G. Vista Admin Preferencias — `src/views/AdminPreferenciasView.vue`

Vista de administracion del catalogo de preferencias permitidas. Usa `TableEditor` para CRUD completo.

```javascript
<template>
  <div class="container py-4">
    <h1 class="mb-4">Administrar Preferencias</h1>
    <TableEditor ref="table" :columns="columnDefs" :data="definiciones" :config="tableConfig" selectable
      :actions="rowActions" :serverSide="true" :totalRecords="totalRecords" :loading="loading"
      @rowSelected="onRowSelected" @update:serverParams="onServerParams" />

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
import TableEditor from '../components/TableEditor.vue'
import { usePreferenciasStore } from '../stores/preferencias'

export default {
  name: 'AdminPreferenciasView',
  components: { TableEditor },
  data() {
    return {
      store: usePreferenciasStore(),
      definiciones: [],
      totalRecords: 0,
      loading: false,
      selectedRow: null,
      editando: null,
      form: { clave: '', nombre: '', descripcion: '', tipo: 'string', valor_defecto: '' },
      opcionesStr: '',
      errorModal: '',
      cargando: false,
      modalInstance: null,
      serverParams: { page: 1, pageSize: 25, sortField: null, sortDir: 'asc', search: '' },
    }
  },
  computed: {
    columnDefs() {
      return [
        { field: 'id', headerName: 'ID', width: '70px', sortable: false },
        { field: 'clave', headerName: 'Clave' },
        { field: 'nombre', headerName: 'Nombre' },
        { field: 'tipo', headerName: 'Tipo', width: '100px' },
        { field: 'valor_defecto', headerName: 'Valor defecto' },
      ]
    },
    tableConfig() {
      return {
        toolbar: [
          { key: 'refresh', label: '', icon: 'bi bi-arrow-clockwise', severity: 'btn-outline-info', action: () => this.fetchData() },
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
        const { data: body } = await api.get(`/preferencias?${query}`)
        if (body.status) {
          this.definiciones = body.data.rows
          this.totalRecords = body.data.total
        }
      } catch (err) {
        console.error('Error al cargar definiciones:', err)
      } finally {
        this.loading = false
      }
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
        await this.fetchData()
        this.$refs.table.clearSelection()
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
        await this.fetchData()
        this.$refs.table.clearSelection()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    },
  },
  mounted() {
    this.modalInstance = new Modal(this.$refs.modal)
    this.fetchData()
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
│   │   ├── ModalDialog.vue
│   │   └── TableEditor.vue
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
| 3 | Verificar `AGENTS.md` en raíz del proyecto | Existe con la sección `## Convenciones` que incluye el patrón de colores para botones |
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
│   │   ├── ModalDialog.vue
│   │   └── TableEditor.vue
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
