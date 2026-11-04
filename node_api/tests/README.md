# Suite de testing automatizado — node_api

Sin dependencias nuevas: runner propio (`tests/runner.js`) con `describe`/`it`/`before`/`after`
y asserts sobre el módulo nativo `assert` de Node, expuestos como `expect(...)`.

## Setup inicial (una vez)

1. Copiar `.env.test.example` a `.env.test` y completar credenciales de un usuario
   admin de MariaDB con permisos para crear bases/usuarios (`TEST_DB_ROOT_USER`/`TEST_DB_ROOT_PASSWORD`).
2. Nada más: el resto (crear DB/usuario de test, aplicar esquema base, correr migraciones)
   lo hace `scripts/test-db-setup.sh`, invocado automáticamente por `npm test`.

## Comandos

```bash
npm test              # setup de DB + unitarios + integración (el comando "todo en uno")
npm run test:unit        # solo unitarios (no requiere DB)
npm run test:integration # setup de DB + integración
npm run test:e2e          # e2e contra un ambiente real ya levantado (NODE_API_BASE_URL)
npm run test:all          # setup de DB + las tres suites
npm run test:db:teardown  # borra la DB/usuario de test (opcional, útil en CI)
```

## Estructura

- `tests/unit/` — funciones puras / middlewares sin DB, mocks hechos a mano.
- `tests/integration/` — levanta `server.js` como proceso hijo contra la DB de
  pruebas MariaDB y pega HTTP real con `axios`. Usa:
  - `helpers/server.js`: spawn/stop del server de test (mata el PID exacto spawneado).
  - `helpers/db.js`: conexión knex directa a la DB de test para truncar tablas.
  - `helpers/seed.js`: crea usuarios de prueba (ej. admin) directo en la DB.
  - `helpers/base-schema.sql`: **importante** — las tablas `user`, `role`, `profile`,
    `fotoclub` las crea normalmente la API PHP/Yii2 (fuera de este repo). Este
    archivo define un esquema mínimo equivalente solo con las columnas que
    tocan los tests actuales. Si se agregan tests de integración que usan otras
    tablas base (contest, category, section, etc.), hay que extender este SQL.
- `tests/e2e/` — pega contra una URL real (`NODE_API_BASE_URL`) con datos que ya
  existan en ese ambiente. No se ejecuta en `npm test` por defecto porque requiere
  un server externo ya corriendo con datos propios.

## Agregar un test nuevo

- Unitario: crear `tests/unit/<algo>.test.js`, `require` del módulo real, sin tocar DB.
- Integración: crear `tests/integration/<algo>.test.js`, usar `startTestServer()` +
  `createAdminUser()`/`resetTables()` de los helpers. Si la tabla que usás no está en
  `base-schema.sql` ni en una migración de knex, agregala a `base-schema.sql`.
- e2e: crear `tests/e2e/<algo>.test.js` en el mismo formato `describe/it`, apuntando
  a `NODE_API_BASE_URL`.
