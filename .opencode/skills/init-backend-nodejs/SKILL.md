---
name: init-backend-nodejs
description: Inicializar un backend Node.js con Express, MariaDB vía Knex, CORS y migraciones automáticas
requires: []
---

# Skill: Inicializar backend Node.js con Express

Usar cuando el usuario pida **crear un backend Node.js desde cero** con Express, conexión a MariaDB vía Knex, CORS, y migraciones automáticas al inicio.

---

## 0. Preguntar nombre del proyecto

Usar la herramienta `question` para preguntar al usuario qué nombre desea para el paquete del backend. La respuesta se usará como `<nombre-proyecto>` en todos los pasos siguientes.

Ejemplo de pregunta:

```
<question>
Pregunta: ¿Qué nombre deseas para el paquete del backend?
Header: Nombre del backend
```

> El valor ingresado reemplaza `<nombre-proyecto>` en el resto de la receta (nombre del directorio, carpeta del proyecto, package.json, etc.).

## 1. Crear estructura del proyecto

```bash
mkdir -p src/{config,routes,controllers,middleware,scripts}
cd <nombre-proyecto>
npm init -y
```

Agregar `"type": "module"` en `package.json` para usar ESM.

Fijar la versión inicial del proyecto editando `package.json` para que quede:

```json
{
  "name": "<nombre-proyecto>",
  "version": "1.0.0",
  ...
}
```

## 2. Instalar dependencias

```bash
npm install express cors knex mysql2 dotenv bcryptjs jsonwebtoken
npm install -D nodemon eslint
```

## 3. Archivo `.env`

```
PORT=4000
CORS_ORIGIN=*
JWT_SECRET=mi_secreto_jwt_cambiar_en_produccion
JWT_EXPIRES_IN=8h

DB_HOST=localhost
DB_PORT=3306
DB_USER=mi_usuario
DB_PASSWORD=mi_password
DB_NAME=mi_app
```

Crear también `.env.example` con la misma estructura (valores de ejemplo, sin datos reales) y agregar `.env` al `.gitignore`.

## 4. Crear base de datos y usuario local

Agregar un script que cree la base de datos y el usuario definidos en `.env` usando el usuario root de MariaDB/MySQL.

### Variables extra en `.env`

Agregar al final del `.env` (opcional, solo para `setup-db`):

```
DB_ROOT_USER=root
DB_ROOT_PASSWORD=
```

### Script — `src/scripts/setup-db.js`

```javascript
import mysql from 'mysql2/promise';
import config from '../config/env.js';

async function setupDatabase() {
  const {
    db: { host, port, user, password, database },
    dbRoot,
  } = config;

  const connection = await mysql.createConnection({
    host,
    port,
    user: dbRoot.user,
    password: dbRoot.password,
  });

  try {
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[setup-db] Base de datos "${database}" lista.`);

    const [rows] = await connection.execute(
      `SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = ? AND host = ?) AS existe`,
      [user, '%']
    );
    const existe = rows[0].existe === 1 || rows[0].existe === '1';

    if (!existe) {
      await connection.execute(
        `CREATE USER ?@? IDENTIFIED BY ?`,
        [user, '%', password]
      );
      console.log(`[setup-db] Usuario "${user}" creado.`);
    } else {
      await connection.execute(
        `ALTER USER ?@? IDENTIFIED BY ?`,
        [user, '%', password]
      );
      console.log(`[setup-db] Contraseña de "${user}" actualizada.`);
    }

    await connection.execute(
      `GRANT ALL PRIVILEGES ON \`${database}\`.* TO ?@?`,
      [user, '%']
    );
    await connection.execute('FLUSH PRIVILEGES');
    console.log(`[setup-db] Privilegios otorgados a "${user}" sobre "${database}".`);
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((err) => {
  console.error('[setup-db] Error:', err.message);
  process.exit(1);
});
```

### Script npm en `package.json`

```json
{
  "scripts": {
    "setup-db": "node src/scripts/setup-db.js"
  }
}
```

El script `setup-db` se ejecuta **una sola vez** al iniciar el proyecto en entorno dev, antes de las migraciones.

## 5. Configuración de Knex — `knexfile.js`

Carga `.env` con `dotenv.config({ override: true })` para que el archivo `.env` siempre tenga prioridad sobre variables de entorno del sistema. La validación de variables requeridas se delega a `src/config/env.js`.

```javascript
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env'), override: true });

export default {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    directory: './src/migrations',
    extension: 'js',
  },
  seeds: {
    directory: './src/seeds',
    extension: 'js',
  },
};
```

## 6. Configuración de BD — `src/config/db.js`

```javascript
import knex from 'knex';
import config from '../../knexfile.js';

const db = knex(config);
export default db;
```

## 7. Configuración centralizada — `src/config/env.js`

Lee únicamente el archivo `.env` con `dotenv.parse()` + `fs.readFileSync()`. No accede a `process.env` del sistema, garantizando que ninguna variable de entorno del sistema se use como configuración.

```javascript
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../../.env');
let envRaw = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envRaw = dotenv.parse(envContent);
} catch {
  console.error('[env] No se encuentra el archivo .env');
  console.error('[env] Copia .env.example a .env y completa las variables');
  process.exit(1);
}

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = required.filter(key => !envRaw[key]);
if (missing.length > 0) {
  console.error(`[env] Faltan variables en .env: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  port: parseInt(envRaw.PORT, 10) || 4000,
  corsOrigin: envRaw.CORS_ORIGIN || '*',
  jwtSecret: envRaw.JWT_SECRET,
  jwtExpiresIn: envRaw.JWT_EXPIRES_IN || '8h',
  db: {
    host: envRaw.DB_HOST,
    port: parseInt(envRaw.DB_PORT, 10),
    user: envRaw.DB_USER,
    password: envRaw.DB_PASSWORD,
    database: envRaw.DB_NAME,
  },
  dbRoot: {
    user: envRaw.DB_ROOT_USER || 'root',
    password: envRaw.DB_ROOT_PASSWORD || '',
  },
};

export default config;
```

## 8. Configuración de CORS — `src/config/cors.js`

```javascript
import cors from 'cors';
import config from './env.js';

const corsOptions = {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export default cors(corsOptions);
```

## 9. Servidor con migraciones automáticas — `src/index.js`

```javascript
import express from 'express';
import config from './config/env.js';
import corsMiddleware from './config/cors.js';
import db from './config/db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import preferenciasRoutes from './routes/preferencias.js';
import { seedAdmin } from './seeds/admin.js';
import { seedRbac } from './seeds/rbac.js';
import { seedPreferencias } from './seeds/preferencias.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/preferencias', preferenciasRoutes);

async function start() {
  try {
    console.log('[migrate] Ejecutando migraciones pendientes...');
    await db.migrate.latest();
    console.log('[migrate] Migraciones ejecutadas correctamente.');
  } catch (err) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  }
  // Las migraciones se ejecutan SIEMPRE automaticamente en cada inicio del servidor, no solo en setup-dev.
  // Esto garantiza que al desplegar en produccion las tablas esten actualizadas sin pasos manuales.

  try {
    await seedRbac();
    await seedAdmin();
    await seedPreferencias();
  } catch (err) {
    console.error('[seed] Error al crear datos iniciales:', err.message);
  }

  app.get('/health', (req, res) => {
    res.json({ status: true, data: { timestamp: new Date().toISOString() } });
  });

  app.listen(config.port, () => {
    console.log(`Servidor corriendo en puerto ${config.port}`);
  });
}

start();
```

## 10. Migración de ejemplo — `src/migrations/XXXXXXXXXXXXXX_init.js`

```javascript
export function up(knex) {
  return knex.schema
    .createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('username', 50).unique().notNullable();
      table.string('password', 255).notNullable();
      table.timestamps(true, true);
    })
    .createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('nombre', 50).unique().notNullable();
      table.string('descripcion', 255);
      table.timestamps(true, true);
    })
    .createTable('permisos', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).unique().notNullable();
      table.string('descripcion', 255);
      table.timestamps(true, true);
    })
    .createTable('usuarios_roles', (table) => {
      table.integer('usuario_id').unsigned().references('id').inTable('usuarios').onDelete('CASCADE');
      table.integer('rol_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['usuario_id', 'rol_id']);
    })
    .createTable('roles_permisos', (table) => {
      table.integer('rol_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permiso_id').unsigned().references('id').inTable('permisos').onDelete('CASCADE');
      table.primary(['rol_id', 'permiso_id']);
    })
    .createTable('preferencias_permitidas', (table) => {
      table.increments('id').primary();
      table.string('clave', 100).unique().notNullable();
      table.string('nombre', 200).notNullable();
      table.text('descripcion');
      table.string('tipo', 50).notNullable();
      table.json('opciones');
      table.text('valor_defecto');
      table.timestamps(true, true);
    })
    .createTable('preferencias_usuario', (table) => {
      table.increments('id').primary();
      table.integer('usuario_id').unsigned().references('id').inTable('usuarios').onDelete('CASCADE');
      table.integer('preferencia_id').unsigned().references('id').inTable('preferencias_permitidas').onDelete('CASCADE');
      table.text('valor');
      table.timestamps(true, true);
      table.unique(['usuario_id', 'preferencia_id']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('preferencias_usuario')
    .dropTableIfExists('preferencias_permitidas')
    .dropTableIfExists('roles_permisos')
    .dropTableIfExists('usuarios_roles')
    .dropTableIfExists('permisos')
    .dropTableIfExists('roles')
    .dropTableIfExists('usuarios');
}
```

Para generar el archivo automáticamente:

```bash
npx knex migrate:make init
```

## 11. Semilla de usuario admin — `src/seeds/admin.js`

```javascript
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

export async function seedAdmin() {
  const [adminRol] = await db('roles').where({ nombre: 'ADMIN' });
  if (!adminRol) {
    console.log('[seed] Rol ADMIN no encontrado, ejecuta seedRbac primero.');
    return;
  }

  let [usuario] = await db('usuarios').where({ username: 'admin' });
  if (!usuario) {
    const hash = await bcrypt.hash('admin123', 10);
    const [id] = await db('usuarios').insert({
      username: 'admin',
      password: hash,
    });
    usuario = { id };
    console.log('[seed] Usuario admin creado (admin / admin123).');
  } else {
    console.log('[seed] Usuario admin ya existe.');
  }

  const [relacion] = await db('usuarios_roles').where({ usuario_id: usuario.id, rol_id: adminRol.id });
  if (!relacion) {
    await db('usuarios_roles').insert({ usuario_id: usuario.id, rol_id: adminRol.id });
    console.log('[seed] Rol ADMIN asignado a admin.');
  }

  const [usuarioRol] = await db('roles').where({ nombre: 'USUARIO' });
  if (!usuarioRol) {
    console.log('[seed] Rol USUARIO no encontrado.');
    return;
  }

  let [user] = await db('usuarios').where({ username: 'usuario' });
  if (!user) {
    const hash = await bcrypt.hash('usuario123', 10);
    const [id] = await db('usuarios').insert({
      username: 'usuario',
      password: hash,
    });
    user = { id };
    console.log('[seed] Usuario usuario creado (usuario / usuario123).');
  }

  const [relUser] = await db('usuarios_roles').where({ usuario_id: user.id, rol_id: usuarioRol.id });
  if (!relUser) {
    await db('usuarios_roles').insert({ usuario_id: user.id, rol_id: usuarioRol.id });
    console.log('[seed] Rol USUARIO asignado a usuario.');
  }
}
```

> Seed ejecutado automaticamente al iniciar el servidor (en \`src/index.js\`). Usuarios por defecto: \`admin\` / \`admin123\` (rol ADMIN) y \`usuario\` / \`usuario123\` (rol USUARIO).

## 12. Semilla de roles y permisos — `src/seeds/rbac.js`

```javascript
import db from '../config/db.js';

export async function seedRbac() {
  const roles = [
    { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' },
    { nombre: 'USUARIO', descripcion: 'Acceso basico al sistema' },
  ];

  for (const rol of roles) {
    const [existente] = await db('roles').where({ nombre: rol.nombre });
    if (!existente) {
      await db('roles').insert(rol);
      console.log(`[seed] Rol ${rol.nombre} creado.`);
    }
  }

  const permisos = [
    { nombre: 'usuarios.ver', descripcion: 'Ver listado de usuarios' },
    { nombre: 'usuarios.editar', descripcion: 'Editar usuarios' },
    { nombre: 'usuarios.eliminar', descripcion: 'Eliminar usuarios' },
    { nombre: 'perfil.ver', descripcion: 'Ver propio perfil' },
    { nombre: 'perfil.editar', descripcion: 'Editar propio perfil' },
    { nombre: 'usuarios.crear', descripcion: 'Crear usuarios' },
    { nombre: 'roles.ver', descripcion: 'Ver listado de roles' },
    { nombre: 'roles.crear', descripcion: 'Crear roles' },
    { nombre: 'roles.editar', descripcion: 'Editar roles' },
    { nombre: 'roles.eliminar', descripcion: 'Eliminar roles' },
    { nombre: 'permisos.ver', descripcion: 'Ver listado de permisos' },
    { nombre: 'preferencias.ver', descripcion: 'Ver preferencias del sistema' },
    { nombre: 'preferencias.editar', descripcion: 'Editar preferencias del sistema' },
  ];

  for (const perm of permisos) {
    const [existente] = await db('permisos').where({ nombre: perm.nombre });
    if (!existente) {
      await db('permisos').insert(perm);
      console.log(`[seed] Permiso ${perm.nombre} creado.`);
    }
  }

  const [adminRol] = await db('roles').where({ nombre: 'ADMIN' });
  const [usuarioRol] = await db('roles').where({ nombre: 'USUARIO' });

  const todosPermisos = await db('permisos');

  for (const perm of todosPermisos) {
    const [existeAdmin] = await db('roles_permisos').where({ rol_id: adminRol.id, permiso_id: perm.id });
    if (!existeAdmin) {
      await db('roles_permisos').insert({ rol_id: adminRol.id, permiso_id: perm.id });
    }
  }

  const permisosUsuario = ['perfil.ver', 'perfil.editar', 'preferencias.ver', 'preferencias.editar'];
  for (const nombrePerm of permisosUsuario) {
    const perm = await db('permisos').where({ nombre: nombrePerm }).first();
    if (perm) {
      const [existe] = await db('roles_permisos').where({ rol_id: usuarioRol.id, permiso_id: perm.id });
      if (!existe) {
        await db('roles_permisos').insert({ rol_id: usuarioRol.id, permiso_id: perm.id });
      }
    }
  }

  console.log('[seed] Roles y permisos inicializados.');
}
```

## 12B. Semilla de preferencias por defecto — `src/seeds/preferencias.js`

```javascript
import db from '../config/db.js';

export async function seedPreferencias() {
  const preferencias = [
    { clave: 'theme', nombre: 'Tema visual', tipo: 'select', opciones: JSON.stringify(['light', 'dark']), valor_defecto: 'light' },
    { clave: 'language', nombre: 'Idioma', tipo: 'select', opciones: JSON.stringify(['es', 'en']), valor_defecto: 'es' },
    { clave: 'notifications_enabled', nombre: 'Notificaciones', tipo: 'boolean', valor_defecto: 'true' },
    { clave: 'items_per_page', nombre: 'Items por pagina', tipo: 'number', valor_defecto: '25' },
  ];

  for (const pref of preferencias) {
    const [existente] = await db('preferencias_permitidas').where({ clave: pref.clave });
    if (!existente) {
      await db('preferencias_permitidas').insert(pref);
      console.log(`[seed] Preferencia "${pref.clave}" creada.`);
    }
  }
  console.log('[seed] Preferencias por defecto inicializadas.');
}
```

> Seed ejecutado automaticamente al iniciar el servidor (en \`src/index.js\`). Define las preferencias disponibles para todos los usuarios del sistema.

## 13. Middleware de autenticación — `src/middleware/auth.js`

```javascript
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import config from '../config/env.js';

export default function authMiddleware(...permisosRequeridos) {
  return async function (req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(200).json({ status: false, error: 'Token requerido' });
    }

    try {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      req.usuario = decoded;

      if (permisosRequeridos.length === 0) {
        return next();
      }

      const roles = await db('usuarios_roles')
        .join('roles', 'usuarios_roles.rol_id', 'roles.id')
        .where('usuarios_roles.usuario_id', decoded.id)
        .select('roles.id', 'roles.nombre');

      const rolIds = roles.map((r) => r.id);

      if (rolIds.length === 0) {
        return res.status(200).json({ status: false, error: 'Acceso denegado: sin roles asignados' });
      }

      const permisos = await db('roles_permisos')
        .join('permisos', 'roles_permisos.permiso_id', 'permisos.id')
        .whereIn('roles_permisos.rol_id', rolIds)
        .whereIn('permisos.nombre', permisosRequeridos)
        .select('permisos.nombre');

      const tienePermiso = permisosRequeridos.every((p) =>
        permisos.some((perm) => perm.nombre === p)
      );

      if (!tienePermiso) {
        return res.status(200).json({ status: false, error: 'Acceso denegado: permisos insuficientes' });
      }

      next();
    } catch (err) {
      return res.status(200).json({ status: false, error: 'Token invalido o expirado' });
    }
  };
}
```

## 14. Controlador de autenticación — `src/controllers/authController.js`

```javascript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import config from '../config/env.js';

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(200).json({ status: false, error: 'Usuario y contrasena requeridos' });
  }

  const usuario = await db('usuarios').where({ username }).first();
  if (!usuario) {
    return res.status(200).json({ status: false, error: 'Credenciales invalidas' });
  }

  const valida = await bcrypt.compare(password, usuario.password);
  if (!valida) {
    return res.status(200).json({ status: false, error: 'Credenciales invalidas' });
  }

  const roles = await db('usuarios_roles')
    .join('roles', 'usuarios_roles.rol_id', 'roles.id')
    .where('usuarios_roles.usuario_id', usuario.id)
    .select('roles.nombre');

  const permisos = await db('usuarios_roles')
    .join('roles_permisos', 'usuarios_roles.rol_id', 'roles_permisos.rol_id')
    .join('permisos', 'roles_permisos.permiso_id', 'permisos.id')
    .where('usuarios_roles.usuario_id', usuario.id)
    .select('permisos.nombre')
    .distinct();

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(200).json({
    status: true,
    data: {
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        roles: roles.map((r) => r.nombre),
        permisos: permisos.map((p) => p.nombre),
      },
    },
  });
}

export async function perfil(req, res) {
  const usuario = await db('usuarios')
    .where({ id: req.usuario.id })
    .select('id', 'username', 'created_at', 'updated_at')
    .first();

  if (!usuario) {
    return res.status(200).json({ status: false, error: 'Usuario no encontrado' });
  }

  const roles = await db('usuarios_roles')
    .join('roles', 'usuarios_roles.rol_id', 'roles.id')
    .where('usuarios_roles.usuario_id', usuario.id)
    .select('roles.nombre');

  const permisos = await db('usuarios_roles')
    .join('roles_permisos', 'usuarios_roles.rol_id', 'roles_permisos.rol_id')
    .join('permisos', 'roles_permisos.permiso_id', 'permisos.id')
    .where('usuarios_roles.usuario_id', usuario.id)
    .select('permisos.nombre')
    .distinct();

  res.status(200).json({
    status: true,
    data: {
      ...usuario,
      roles: roles.map((r) => r.nombre),
      permisos: permisos.map((p) => p.nombre),
    },
  });
}

export async function actualizarPerfil(req, res) {
  const { username, passwordActual, passwordNuevo } = req.body;

  const usuario = await db('usuarios').where({ id: req.usuario.id }).first();
  if (!usuario) {
    return res.status(200).json({ status: false, error: 'Usuario no encontrado' });
  }

  if (username && username !== usuario.username) {
    const existe = await db('usuarios').where({ username }).first();
    if (existe) {
      return res.status(200).json({ status: false, error: 'El nombre de usuario ya esta en uso' });
    }
  }

  if (passwordNuevo) {
    if (!passwordActual) {
      return res.status(200).json({ status: false, error: 'Debes proporcionar la contrasena actual para cambiarla' });
    }
    const valida = await bcrypt.compare(passwordActual, usuario.password);
    if (!valida) {
      return res.status(200).json({ status: false, error: 'Contrasena actual incorrecta' });
    }
  }

  const actualizar = {};
  if (username) actualizar.username = username;
  if (passwordNuevo) actualizar.password = await bcrypt.hash(passwordNuevo, 10);

  if (Object.keys(actualizar).length === 0) {
    return res.status(200).json({ status: false, error: 'No hay datos para actualizar' });
  }

  await db('usuarios').where({ id: req.usuario.id }).update(actualizar);

  res.status(200).json({ status: true, data: { message: 'Perfil actualizado correctamente' } });
}
```

## 15. Rutas de autenticación — `src/routes/auth.js`

```javascript
import { Router } from 'express';
import { login, perfil, actualizarPerfil } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/perfil', authMiddleware('perfil.ver'), perfil);
router.put('/perfil', authMiddleware('perfil.editar'), actualizarPerfil);

export default router;
```

## 16. Controlador de administracion — `src/controllers/adminController.js`

```javascript
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

export async function listarUsuarios(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 25;
  const sortField = req.query.sortField || 'id';
  const sortDir = req.query.sortDir === 'desc' ? 'desc' : 'asc';
  const search = req.query.search || '';

  let query = db('usuarios').select('id', 'username', 'created_at', 'updated_at');
  let countQuery = db('usuarios');

  if (search) {
    query = query.where('username', 'like', `%${search}%`);
    countQuery = countQuery.where('username', 'like', `%${search}%`);
  }

  const [{ count }] = await countQuery.count('* as count');
  const total = parseInt(count);

  const allowedSort = ['id', 'username', 'created_at'];
  const safeField = allowedSort.includes(sortField) ? sortField : 'id';
  const offset = (page - 1) * pageSize;
  const usuarios = await query.orderBy(safeField, sortDir).offset(offset).limit(pageSize);

  for (const u of usuarios) {
    u.roles = await db('usuarios_roles')
      .join('roles', 'usuarios_roles.rol_id', 'roles.id')
      .where('usuarios_roles.usuario_id', u.id)
      .select('roles.id', 'roles.nombre');
  }

  res.status(200).json({ status: true, data: { rows: usuarios, total, page, pageSize } });
}

export async function crearUsuario(req, res) {
  const { username, password, rolIds } = req.body;
  if (!username || !password) {
    return res.status(200).json({ status: false, error: 'Usuario y contrasena requeridos' });
  }

  const existe = await db('usuarios').where({ username }).first();
  if (existe) {
    return res.status(200).json({ status: false, error: 'El nombre de usuario ya existe' });
  }

  const hash = await bcrypt.hash(password, 10);
  const [id] = await db('usuarios').insert({ username, password: hash });

  if (rolIds && rolIds.length > 0) {
    const inserts = rolIds.map((rolId) => ({ usuario_id: id, rol_id: rolId }));
    await db('usuarios_roles').insert(inserts);
  }

  res.status(200).json({ status: true, data: { id, username } });
}

export async function actualizarUsuario(req, res) {
  const { id } = req.params;
  const { username, password, rolIds } = req.body;

  const usuario = await db('usuarios').where({ id }).first();
  if (!usuario) {
    return res.status(200).json({ status: false, error: 'Usuario no encontrado' });
  }

  if (username && username !== usuario.username) {
    const existe = await db('usuarios').where({ username }).first();
    if (existe) {
      return res.status(200).json({ status: false, error: 'El nombre de usuario ya existe' });
    }
  }

  const actualizar = {};
  if (username) actualizar.username = username;
  if (password) actualizar.password = await bcrypt.hash(password, 10);

  if (Object.keys(actualizar).length > 0) {
    await db('usuarios').where({ id }).update(actualizar);
  }

  if (rolIds !== undefined) {
    await db('usuarios_roles').where({ usuario_id: id }).del();
    if (rolIds.length > 0) {
      const inserts = rolIds.map((rolId) => ({ usuario_id: id, rol_id: rolId }));
      await db('usuarios_roles').insert(inserts);
    }
  }

  res.status(200).json({ status: true, data: { message: 'Usuario actualizado correctamente' } });
}

export async function eliminarUsuario(req, res) {
  const { id } = req.params;
  const usuario = await db('usuarios').where({ id }).first();
  if (!usuario) {
    return res.status(200).json({ status: false, error: 'Usuario no encontrado' });
  }

  await db('usuarios').where({ id }).del();
  res.status(200).json({ status: true, data: { message: 'Usuario eliminado correctamente' } });
}

export async function listarRoles(req, res) {
  const page = parseInt(req.query.page);
  if (!page) {
    const roles = await db('roles').select('*');
    for (const rol of roles) {
      rol.permisos = await db('roles_permisos')
        .join('permisos', 'roles_permisos.permiso_id', 'permisos.id')
        .where('roles_permisos.rol_id', rol.id)
        .select('permisos.id', 'permisos.nombre');
    }
    return res.status(200).json({ status: true, data: roles });
  }
  const pageSize = parseInt(req.query.pageSize) || 25;
  const sortField = req.query.sortField || 'id';
  const sortDir = req.query.sortDir === 'desc' ? 'desc' : 'asc';
  const search = req.query.search || '';

  let query = db('roles');
  let countQuery = db('roles');

  if (search) {
    query = query.where(function () {
      this.where('nombre', 'like', `%${search}%`)
          .orWhere('descripcion', 'like', `%${search}%`);
    });
    countQuery = countQuery.where(function () {
      this.where('nombre', 'like', `%${search}%`)
          .orWhere('descripcion', 'like', `%${search}%`);
    });
  }

  const [{ count }] = await countQuery.count('* as count');
  const total = parseInt(count);

  const allowedSort = ['id', 'nombre', 'descripcion'];
  const safeField = allowedSort.includes(sortField) ? sortField : 'id';
  const offset = (page - 1) * pageSize;
  const roles = await query.orderBy(safeField, sortDir).offset(offset).limit(pageSize);

  for (const rol of roles) {
    rol.permisos = await db('roles_permisos')
      .join('permisos', 'roles_permisos.permiso_id', 'permisos.id')
      .where('roles_permisos.rol_id', rol.id)
      .select('permisos.id', 'permisos.nombre');
  }

  res.status(200).json({ status: true, data: { rows: roles, total, page, pageSize } });
}

export async function crearRol(req, res) {
  const { nombre, descripcion, permisoIds } = req.body;
  if (!nombre) {
    return res.status(200).json({ status: false, error: 'Nombre del rol requerido' });
  }

  const existe = await db('roles').where({ nombre }).first();
  if (existe) {
    return res.status(200).json({ status: false, error: 'El rol ya existe' });
  }

  const [id] = await db('roles').insert({ nombre, descripcion });

  if (permisoIds && permisoIds.length > 0) {
    const inserts = permisoIds.map((permisoId) => ({ rol_id: id, permiso_id: permisoId }));
    await db('roles_permisos').insert(inserts);
  }

  res.status(200).json({ status: true, data: { id, nombre } });
}

export async function actualizarRol(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, permisoIds } = req.body;

  const rol = await db('roles').where({ id }).first();
  if (!rol) {
    return res.status(200).json({ status: false, error: 'Rol no encontrado' });
  }

  const actualizar = {};
  if (nombre) actualizar.nombre = nombre;
  if (descripcion !== undefined) actualizar.descripcion = descripcion;

  if (Object.keys(actualizar).length > 0) {
    await db('roles').where({ id }).update(actualizar);
  }

  if (permisoIds !== undefined) {
    await db('roles_permisos').where({ rol_id: id }).del();
    if (permisoIds.length > 0) {
      const inserts = permisoIds.map((permisoId) => ({ rol_id: id, permiso_id: permisoId }));
      await db('roles_permisos').insert(inserts);
    }
  }

  res.status(200).json({ status: true, data: { message: 'Rol actualizado correctamente' } });
}

export async function eliminarRol(req, res) {
  const { id } = req.params;
  const rol = await db('roles').where({ id }).first();
  if (!rol) {
    return res.status(200).json({ status: false, error: 'Rol no encontrado' });
  }

  await db('roles').where({ id }).del();
  res.status(200).json({ status: true, data: { message: 'Rol eliminado correctamente' } });
}

export async function listarPermisos(req, res) {
  const page = parseInt(req.query.page);
  if (!page) {
    const permisos = await db('permisos').select('*');
    return res.status(200).json({ status: true, data: permisos });
  }
  const pageSize = parseInt(req.query.pageSize) || 50;
  const search = req.query.search || '';

  let query = db('permisos');
  let countQuery = db('permisos');

  if (search) {
    query = query.where(function () {
      this.where('nombre', 'like', `%${search}%`)
          .orWhere('descripcion', 'like', `%${search}%`);
    });
    countQuery = countQuery.where(function () {
      this.where('nombre', 'like', `%${search}%`)
          .orWhere('descripcion', 'like', `%${search}%`);
    });
  }

  const [{ count }] = await countQuery.count('* as count');
  const total = parseInt(count);
  const offset = (page - 1) * pageSize;
  const permisos = await query.orderBy('nombre', 'asc').offset(offset).limit(pageSize);

  res.status(200).json({ status: true, data: { rows: permisos, total, page, pageSize } });
}
```

## 17. Rutas de administracion — `src/routes/admin.js`

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
  listarRoles, crearRol, actualizarRol, eliminarRol,
  listarPermisos,
} from '../controllers/adminController.js';

const router = Router();

router.get('/usuarios', authMiddleware('usuarios.ver'), listarUsuarios);
router.post('/usuarios', authMiddleware('usuarios.crear'), crearUsuario);
router.put('/usuarios/:id', authMiddleware('usuarios.editar'), actualizarUsuario);
router.delete('/usuarios/:id', authMiddleware('usuarios.eliminar'), eliminarUsuario);

router.get('/roles', authMiddleware('roles.ver'), listarRoles);
router.post('/roles', authMiddleware('roles.crear'), crearRol);
router.put('/roles/:id', authMiddleware('roles.editar'), actualizarRol);
router.delete('/roles/:id', authMiddleware('roles.eliminar'), eliminarRol);

router.get('/permisos', authMiddleware('permisos.ver'), listarPermisos);

export default router;
```

## 17B. Controlador de preferencias — `src/controllers/preferenciasController.js`

```javascript
import db from '../config/db.js';

export async function listarDefiniciones(req, res) {
  const page = parseInt(req.query.page);
  if (!page) {
    const definiciones = await db('preferencias_permitidas').select('*');
    return res.status(200).json({ status: true, data: definiciones });
  }
  const pageSize = parseInt(req.query.pageSize) || 25;
  const search = req.query.search || '';
  let query = db('preferencias_permitidas');
  let countQuery = db('preferencias_permitidas');
  if (search) {
    query = query.where(function () {
      this.where('clave', 'like', `%${search}%`)
          .orWhere('nombre', 'like', `%${search}%`);
    });
    countQuery = countQuery.where(function () {
      this.where('clave', 'like', `%${search}%`)
          .orWhere('nombre', 'like', `%${search}%`);
    });
  }
  const [{ count }] = await countQuery.count('* as count');
  const total = parseInt(count);
  const offset = (page - 1) * pageSize;
  const definiciones = await query.orderBy('clave', 'asc').offset(offset).limit(pageSize);
  res.status(200).json({ status: true, data: { rows: definiciones, total, page, pageSize } });
}

export async function crearDefinicion(req, res) {
  const { clave, nombre, descripcion, tipo, opciones, valor_defecto } = req.body;
  if (!clave || !nombre || !tipo) {
    return res.status(200).json({ status: false, error: 'clave, nombre y tipo son requeridos' });
  }

  const existe = await db('preferencias_permitidas').where({ clave }).first();
  if (existe) {
    return res.status(200).json({ status: false, error: 'La clave ya existe' });
  }

  const [id] = await db('preferencias_permitidas').insert({
    clave, nombre, descripcion, tipo,
    opciones: opciones ? JSON.stringify(opciones) : null,
    valor_defecto,
  });

  res.status(200).json({ status: true, data: { id, clave, nombre } });
}

export async function actualizarDefinicion(req, res) {
  const { id } = req.params;
  const { clave, nombre, descripcion, tipo, opciones, valor_defecto } = req.body;

  const existente = await db('preferencias_permitidas').where({ id }).first();
  if (!existente) {
    return res.status(200).json({ status: false, error: 'Preferencia no encontrada' });
  }

  if (clave && clave !== existente.clave) {
    const duplicado = await db('preferencias_permitidas').where({ clave }).first();
    if (duplicado) {
      return res.status(200).json({ status: false, error: 'La clave ya existe' });
    }
  }

  const actualizar = {};
  if (clave !== undefined) actualizar.clave = clave;
  if (nombre !== undefined) actualizar.nombre = nombre;
  if (descripcion !== undefined) actualizar.descripcion = descripcion;
  if (tipo !== undefined) actualizar.tipo = tipo;
  if (opciones !== undefined) actualizar.opciones = JSON.stringify(opciones);
  if (valor_defecto !== undefined) actualizar.valor_defecto = valor_defecto;

  if (Object.keys(actualizar).length > 0) {
    await db('preferencias_permitidas').where({ id }).update(actualizar);
  }

  res.status(200).json({ status: true, data: { message: 'Preferencia actualizada correctamente' } });
}

export async function eliminarDefinicion(req, res) {
  const { id } = req.params;
  const existente = await db('preferencias_permitidas').where({ id }).first();
  if (!existente) {
    return res.status(200).json({ status: false, error: 'Preferencia no encontrada' });
  }

  await db('preferencias_permitidas').where({ id }).del();
  res.status(200).json({ status: true, data: { message: 'Preferencia eliminada correctamente' } });
}

export async function misPreferencias(req, res) {
  const usuarioId = req.usuario.id;
  const definiciones = await db('preferencias_permitidas').select('*');
  const valores = await db('preferencias_usuario')
    .where({ usuario_id: usuarioId })
    .select('*');

  const resultado = {};
  for (const def of definiciones) {
    const valorUsuario = valores.find(v => v.preferencia_id === def.id);
    resultado[def.clave] = valorUsuario ? valorUsuario.valor : def.valor_defecto;
  }

  res.status(200).json({ status: true, data: { definiciones, valores: resultado } });
}

export async function actualizarMisPreferencias(req, res) {
  const usuarioId = req.usuario.id;
  const preferencias = req.body;

  const definiciones = await db('preferencias_permitidas').select('*');

  for (const [clave, valor] of Object.entries(preferencias)) {
    const def = definiciones.find(d => d.clave === clave);
    if (!def) continue;

    if (def.tipo === 'select' && def.opciones) {
      const opciones = JSON.parse(def.opciones);
      if (!opciones.includes(valor)) continue;
    }

    const existente = await db('preferencias_usuario')
      .where({ usuario_id: usuarioId, preferencia_id: def.id })
      .first();

    if (existente) {
      await db('preferencias_usuario')
        .where({ usuario_id: usuarioId, preferencia_id: def.id })
        .update({ valor: String(valor) });
    } else {
      await db('preferencias_usuario').insert({
        usuario_id: usuarioId,
        preferencia_id: def.id,
        valor: String(valor),
      });
    }
  }

  res.status(200).json({ status: true, data: { message: 'Preferencias actualizadas correctamente' } });
}

export async function preferenciasDeUsuario(req, res) {
  const { id } = req.params;
  const definiciones = await db('preferencias_permitidas').select('*');
  const valores = await db('preferencias_usuario')
    .where({ usuario_id: id })
    .select('*');

  const resultado = {};
  for (const def of definiciones) {
    const valorUsuario = valores.find(v => v.preferencia_id === def.id);
    resultado[def.clave] = valorUsuario ? valorUsuario.valor : def.valor_defecto;
  }

  res.status(200).json({ status: true, data: { definiciones, valores: resultado } });
}

export async function actualizarPreferenciasUsuario(req, res) {
  const { id } = req.params;
  const preferencias = req.body;

  const definiciones = await db('preferencias_permitidas').select('*');

  for (const [clave, valor] of Object.entries(preferencias)) {
    const def = definiciones.find(d => d.clave === clave);
    if (!def) continue;

    const existente = await db('preferencias_usuario')
      .where({ usuario_id: id, preferencia_id: def.id })
      .first();

    if (existente) {
      await db('preferencias_usuario')
        .where({ usuario_id: id, preferencia_id: def.id })
        .update({ valor: String(valor) });
    } else {
      await db('preferencias_usuario').insert({
        usuario_id: id,
        preferencia_id: def.id,
        valor: String(valor),
      });
    }
  }

  res.status(200).json({ status: true, data: { message: 'Preferencias del usuario actualizadas correctamente' } });
}
```

## 17C. Rutas de preferencias — `src/routes/preferencias.js`

```javascript
import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  listarDefiniciones, crearDefinicion, actualizarDefinicion, eliminarDefinicion,
  misPreferencias, actualizarMisPreferencias,
  preferenciasDeUsuario, actualizarPreferenciasUsuario,
} from '../controllers/preferenciasController.js';

const router = Router();

router.get('/', authMiddleware('preferencias.ver'), listarDefiniciones);
router.post('/', authMiddleware('preferencias.editar'), crearDefinicion);
router.put('/:id', authMiddleware('preferencias.editar'), actualizarDefinicion);
router.delete('/:id', authMiddleware('preferencias.editar'), eliminarDefinicion);
router.get('/usuario', authMiddleware(), misPreferencias);
router.put('/usuario', authMiddleware(), actualizarMisPreferencias);
router.get('/usuario/:id', authMiddleware('preferencias.ver'), preferenciasDeUsuario);
router.put('/usuario/:id', authMiddleware('preferencias.editar'), actualizarPreferenciasUsuario);

export default router;
```

## 18. Scripts en `package.json`

> Las migraciones se ejecutan **automáticamente** al iniciar el servidor (`npm run dev` / `npm start`) vía `db.migrate.latest()` en `src/index.js`.  
> Los scripts `migrate` y `migrate:rollback` son solo para uso manual de emergencia; no es necesario ejecutarlos en el flujo normal.

```json
{
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "setup-db": "node src/scripts/setup-db.js",
    "setup-dev": "node src/scripts/setup-db.js && node src/index.js",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "seed": "knex seed:run",
    "lint": "eslint src/"
  }
}
```

## 19. `.gitignore`

```
node_modules/
.env
```

## 20. ESLint — `eslint.config.js`

```javascript
import globals from 'globals';
import js from '@eslint/js';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
];
```

Instalar dependencias adicionales de ESLint:

```bash
npm install -D globals @eslint/js
```

## 21. Estructura final

```
<proyecto>/
├── .env
├── .env.example
├── .gitignore
├── eslint.config.js
├── knexfile.js
├── package.json
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── cors.js
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   └── preferenciasController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   └── XXXX_init.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── preferencias.js
│   ├── scripts/
│   │   └── setup-db.js
│       └── seeds/
│       ├── admin.js
│       ├── preferencias.js
│       └── rbac.js
└── node_modules/
documentacion/
    └── DOCUMENTACION.md
```

## 22. Verificación obligatoria

Ejecutar los siguientes comandos en orden y **confirmar que cada uno devuelva el resultado esperado**. Si algún comando falla, abortar y notificar el error.

```bash
cd <nombre-proyecto>
```

| # | Comando | Resultado esperado |
|---|---------|-------------------|
| 1 | `node src/index.js` (dejar correr 3s, luego Ctrl+C) | En consola: `[migrate] Migraciones ejecutadas correctamente.` y `Servidor corriendo en puerto 4000` |
| 2 | `npx knex seed:run` | Seeds ejecutadas sin errores. Tabla `knex_seeds` registrada |
| 3 | `npm run lint` | `0 errors`, `0 warnings` o solo advertencias menores |
| 4 | Verificar archivo `.env.example` | Existe en raíz, contiene todas las variables con valores ejemplo (sin datos reales) |
| 5 | Verificar `.gitignore` | Contiene `node_modules/` y `.env` |
| 6 | Leer `documentacion/DOCUMENTACION.md` | Existe con todas las secciones completas (tablas, endpoints, scripts) |
| 7 | Verificar `src/config/env.js` | Lee solo de `.env` vía `dotenv.parse()` + `fs.readFileSync()`. No usa `process.env` |
| 8 | Verificar `src/index.js` | `db.migrate.latest()` se ejecuta dentro de `async function start()` antes de `app.listen()` |

**Validación de endpoints (servidor corriendo):**

```bash
# Iniciar servidor en segundo plano
node src/index.js &
SERVER_PID=$!
sleep 2

# Health check
curl -s http://localhost:4000/health
# → {"status":true,"data":{"timestamp":"..."}}

# Login
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
# → {"status":true,"data":{"token":"...","usuario":{...}}}

# Detener servidor
kill $SERVER_PID 2>/dev/null
```

> Nota: Las seeds se ejecutan automáticamente al iniciar el servidor vía `seedRbac()` y `seedAdmin()` en `src/index.js`, pero la ejecución manual con `npx knex seed:run` garantiza que queden registradas en la tabla `knex_seeds` y no se re-ejecuten en futuros arranques. La ejecución automática en `start()` funciona como respaldo.

## 23. Documentación básica — `documentacion/DOCUMENTACION.md`

Generar o actualizar el archivo `documentacion/DOCUMENTACION.md` en el directorio `documentacion/` en la raíz del proyecto con la siguiente estructura. Este documento debe ser legible por humanos y fácilmente parseable por IA, usando secciones claras, metadatos estructurados y tablas consistentes.

```markdown
---
title: <nombre-proyecto>
type: backend
framework: Express + Knex + MariaDB
language: Node.js (ESM)
created: <fecha-actual>
---

# <nombre-proyecto>

Backend Node.js con Express, Knex y MariaDB.

---

## REQUISITOS

- Node.js >= 18
- MariaDB >= 10.6 / MySQL >= 8.0
- npm >= 9

## CONFIGURACION

| Paso | Accion |
|------|--------|
| 1 | `git clone <repo>` |
| 2 | `npm install` |
| 3 | Copiar `.env.example` a `.env` y completar variables |
| 4 | `npm run setup-db` (entorno dev, crea BD y usuario) |
| 5 | `npm run seed` (opcional) |
| 6 | `npm run dev` |
|   | *Las migraciones se ejecutan automaticamente al iniciar el servidor* |

## VARIABLES DE ENTORNO

| Variable | Descripcion | Valor ejemplo |
|----------|-------------|---------------|
| `PORT` | Puerto del servidor | `4000` |
| `CORS_ORIGIN` | Origenes permitidos CORS | `*` |
| `DB_HOST` | Host de base de datos | `localhost` |
| `DB_PORT` | Puerto de base de datos | `3306` |
| `DB_USER` | Usuario de base de datos | `root` |
| `DB_PASSWORD` | Contrasena de base de datos | |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `mi_secreto_jwt` |
| `JWT_EXPIRES_IN` | Tiempo de expiracion del token JWT | `8h` |
| `DB_NAME` | Nombre de base de datos | `mi_app` |
| `DB_ROOT_USER` | Usuario root de BD (solo setup-db) | `root` |
| `DB_ROOT_PASSWORD` | Contrasena root de BD (solo setup-db) | |

Ver archivo `.env.example` para referencia.

## SCRIPTS

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia servidor con recarga automatica |
| `npm start` | Inicia servidor en produccion |
| `npm run setup-db` | Crea base de datos y usuario en entorno dev |
| `npm run setup-dev` | Crea BD e inicia servidor (migraciones automaticas al arrancar) |
| `npm run migrate` | Ejecuta migraciones manualmente (solo emergencia, se auto-ejecutan al iniciar) |
| `npm run migrate:rollback` | Revierte ultima migracion |
| `npm run seed` | Ejecuta seeders |
| `npm run lint` | Analiza el codigo con ESLint |

## ENDPOINTS

### Sistema

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health check del servidor | No |

### Auth

| Metodo | Ruta | Descripcion | Auth | Permisos |
|--------|------|-------------|------|----------|
| POST | `/api/auth/login` | Iniciar sesion | No | - |
| GET | `/api/auth/perfil` | Obtener perfil del usuario autenticado (incluye roles y permisos) | Si | `perfil.ver` |
| PUT | `/api/auth/perfil` | Actualizar username y/o password | Si | `perfil.editar` |

### Admin

| Metodo | Ruta | Descripcion | Auth | Permisos |
|--------|------|-------------|------|----------|
| GET | `/api/admin/usuarios` | Listar todos los usuarios | Si | `usuarios.ver` |
| POST | `/api/admin/usuarios` | Crear un nuevo usuario | Si | `usuarios.crear` |
| PUT | `/api/admin/usuarios/:id` | Actualizar usuario (username, password, roles) | Si | `usuarios.editar` |
| DELETE | `/api/admin/usuarios/:id` | Eliminar un usuario | Si | `usuarios.eliminar` |
| GET | `/api/admin/roles` | Listar todos los roles con sus permisos | Si | `roles.ver` |
| POST | `/api/admin/roles` | Crear un nuevo rol | Si | `roles.crear` |
| PUT | `/api/admin/roles/:id` | Actualizar rol (nombre, descripcion, permisos) | Si | `roles.editar` |
| DELETE | `/api/admin/roles/:id` | Eliminar un rol | Si | `roles.eliminar` |
| GET | `/api/admin/permisos` | Listar todos los permisos | Si | `permisos.ver` |

### Preferencias

| Metodo | Ruta | Descripcion | Auth | Permisos |
|--------|------|-------------|------|----------|
| GET | `/api/preferencias` | Listar definiciones de preferencias permitidas | Si | `preferencias.ver` |
| POST | `/api/preferencias` | Crear nueva definicion de preferencia | Si | `preferencias.editar` |
| PUT | `/api/preferencias/:id` | Actualizar definicion de preferencia | Si | `preferencias.editar` |
| DELETE | `/api/preferencias/:id` | Eliminar definicion de preferencia | Si | `preferencias.editar` |
| GET | `/api/preferencias/usuario` | Obtener preferencias del usuario autenticado | Si | - |
| PUT | `/api/preferencias/usuario` | Actualizar preferencias del usuario autenticado | Si | - |
| GET | `/api/preferencias/usuario/:id` | Obtener preferencias de un usuario (admin) | Si | `preferencias.ver` |
| PUT | `/api/preferencias/usuario/:id` | Actualizar preferencias de un usuario (admin) | Si | `preferencias.editar` |

### API

<!-- Listar aqui los endpoints de la API a medida que se agreguen rutas en src/routes/ -->

## BASE DE DATOS

### Diagrama de tablas

```
+------------------+       +------------------+       +------------------+
|    usuarios      |       |    roles         |       |   permisos       |
+------------------+       +------------------+       +------------------+
| id (PK, incr)    |       | id (PK, incr)    |       | id (PK, incr)    |
| username (UQ)    |       | nombre (UQ)      |       | nombre (UQ)      |
| password         |       | descripcion      |       | descripcion      |
| created_at       |       | created_at       |       | created_at       |
| updated_at       |       | updated_at       |       | updated_at       |
+------------------+       +------------------+       +------------------+
         |                          |                          |
         |  usuarios_roles          |  roles_permisos          |
         |  (usuario_id FK) --------+  (rol_id FK)            |
         +-- (rol_id FK)               +-- (permiso_id FK)    |

+----------------------------+       +----------------------------------+
| preferencias_permitidas    |       | preferencias_usuario             |
+----------------------------+       +----------------------------------+
| id (PK, incr)              |       | id (PK, incr)                    |
| clave (UQ)                 |       | usuario_id (FK -> usuarios)      |
| nombre                     |       | preferencia_id (FK -> pref_per)  |
| descripcion                |       | valor                            |
| tipo                       |       | created_at                       |
| opciones (json)            |       | updated_at                       |
| valor_defecto              |       | UNIQUE (usuario_id,preferencia_id)|
| created_at                 |       +----------------------------------+
| updated_at                 |                    |
+----------------------------+                    |
         +----------------------------------------+
```

### Tablas

**usuarios**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| id | integer | PK, auto-increment | Identificador unico |
| username | varchar(50) | UNIQUE, NOT NULL | Nombre de usuario |
| password | varchar(255) | NOT NULL | Hash bcrypt de la contrasena |
| created_at | timestamp | NOT NULL, DEFAULT now() | Fecha de creacion |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Fecha de actualizacion |

**roles**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| id | integer | PK, auto-increment | Identificador unico |
| nombre | varchar(50) | UNIQUE, NOT NULL | Nombre del rol (ADMIN, USUARIO, etc.) |
| descripcion | varchar(255) | NULL | Descripcion del rol |
| created_at | timestamp | NOT NULL, DEFAULT now() | Fecha de creacion |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Fecha de actualizacion |

**permisos**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| id | integer | PK, auto-increment | Identificador unico |
| nombre | varchar(100) | UNIQUE, NOT NULL | Nombre del permiso (ej: usuarios.ver) |
| descripcion | varchar(255) | NULL | Descripcion del permiso |
| created_at | timestamp | NOT NULL, DEFAULT now() | Fecha de creacion |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Fecha de actualizacion |

**usuarios_roles**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| usuario_id | integer | PK, FK -> usuarios(id) ON DELETE CASCADE | Referencia al usuario |
| rol_id | integer | PK, FK -> roles(id) ON DELETE CASCADE | Referencia al rol |

**roles_permisos**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| rol_id | integer | PK, FK -> roles(id) ON DELETE CASCADE | Referencia al rol |
| permiso_id | integer | PK, FK -> permisos(id) ON DELETE CASCADE | Referencia al permiso |

**preferencias_permitidas**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| id | integer | PK, auto-increment | Identificador unico |
| clave | varchar(100) | UNIQUE, NOT NULL | Clave unica de la preferencia (ej: theme) |
| nombre | varchar(200) | NOT NULL | Nombre legible de la preferencia |
| descripcion | text | NULL | Descripcion de la preferencia |
| tipo | varchar(50) | NOT NULL | Tipo de valor (string, boolean, number, select, json) |
| opciones | json | NULL | Opciones validas para tipo select |
| valor_defecto | text | NULL | Valor por defecto global |
| created_at | timestamp | NOT NULL, DEFAULT now() | Fecha de creacion |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Fecha de actualizacion |

**preferencias_usuario**
| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| id | integer | PK, auto-increment | Identificador unico |
| usuario_id | integer | FK -> usuarios(id) ON DELETE CASCADE | Referencia al usuario |
| preferencia_id | integer | FK -> preferencias_permitidas(id) ON DELETE CASCADE | Referencia a la definicion de preferencia |
| valor | text | NULL | Valor concreto del usuario para esta preferencia |
| created_at | timestamp | NOT NULL, DEFAULT now() | Fecha de creacion |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Fecha de actualizacion |

Restricciones: UNIQUE(usuario_id, preferencia_id)

### Datos iniciales (seeds)

Los siguientes roles y permisos se crean automaticamente al iniciar el servidor o via `npx knex seed:run`:

| Rol | Permisos asignados |
|-----|-------------------|
| ADMIN | Todos los permisos del sistema |
| USUARIO | `perfil.ver`, `perfil.editar`, `preferencias.ver`, `preferencias.editar` |

Usuarios por defecto:
| Usuario | Contrasena | Rol |
|---------|------------|-----|
| admin | admin123 | ADMIN |
| usuario | usuario123 | USUARIO |

> Al agregar nuevas migraciones, actualizar esta seccion reflejando las nuevas tablas, columnas y relaciones.

## ESTRUCTURA

```
<proyecto>/
├── .env
├── .env.example
├── .gitignore
├── documentacion/
│   └── DOCUMENTACION.md
├── eslint.config.js
├── knexfile.js
├── package.json
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── cors.js
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   └── preferenciasController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   └── <timestamp>_init.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── preferencias.js
│   ├── scripts/
│   │   └── setup-db.js
│   └── seeds/
│       ├── admin.js
│       ├── preferencias.js
│       └── rbac.js
└── node_modules/
```

## DEPENDENCIAS

| Paquete | Version | Uso |
|---------|---------|-----|
| express | - | Framework web |
| cors | - | Middleware CORS |
| knex | - | Query builder / migraciones |
| mysql2 | - | Driver MariaDB/MySQL |
| dotenv | - | Variables de entorno |
| bcryptjs | - | Hashing de contrasenas |
| jsonwebtoken | - | Tokens JWT |
| nodemon | - (dev) | Recarga automatica |
| eslint | - (dev) | Analisis de codigo |
```

Reglas para la documentación:
- El archivo `documentacion/DOCUMENTACION.md` debe crearse **siempre** al generar el proyecto desde cero.
- Al agregar nuevas rutas/controladores, **insertar** los nuevos endpoints en la tabla `### API` manteniendo el formato uniforme.
- Mantener la sección `ESTRUCTURA` sincronizada con los directorios reales del proyecto. Toda la documentacion debe estar siempre en `documentacion/` en la raiz del proyecto, nunca dentro de subproyectos.
- Mantener la sección `BASE DE DATOS` actualizada con cada nueva migracion: agregar tablas, columnas, tipos, restricciones y relaciones.
- No eliminar secciones ni contenido agregado manualmente por el usuario.
- No usar acentos ni caracteres especiales en los titulos de seccion para facilitar el parseo automatico.

## Reglas obligatorias

- **Usar ESM** (`import`/`export`) con `"type": "module"` en package.json.
- **Validar variables .env** requeridas al arrancar — fallar con mensaje claro si falta alguna.
- **Solo .env:** toda configuración debe leerse únicamente del archivo `.env` mediante `dotenv.parse()` + `fs.readFileSync()` en `src/config/env.js`. Nunca usar `process.env` directamente ni depender de variables de entorno del sistema.
- **Migraciones automaticas obligatorias:** `db.migrate.latest()` debe ejecutarse SIEMPRE dentro de `async function start()` antes de levantar el servidor. No debe haber un paso manual de migraciones para arrancar la aplicacion en ningun entorno (dev, staging, produccion).
- **CORS configurable** por variable `CORS_ORIGIN` en `.env`.
- **Driver MariaDB:** usar `mysql2` como cliente de Knex.
- **No hardcodear configuraciones:** todo debe ir en `.env` y centralizarse en `src/config/env.js`.
- **Separar responsabilidades:** rutas en `routes/`, lógica en `controllers/`, middlewares en `middleware/`, config en `config/`.
