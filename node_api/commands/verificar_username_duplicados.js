// Script CLI para listar usernames duplicados (solo lectura, no modifica datos)
// Uso: node node_api/commands/verificar_username_duplicados.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('../knexfile.js');

(async () => {
  try {
    await global.knex.raw('SELECT 1');

    // Duplicados exactos y case-insensitive
    const duplicados = await global.knex('user')
      .select(
        'username',
        global.knex.raw('LOWER(username) as username_lower'),
        global.knex.raw('COUNT(*) as total')
      )
      .groupBy('username_lower')
      .havingRaw('COUNT(*) > 1')
      .orderBy('username_lower');

    if (duplicados.length === 0) {
      console.log('No se encontraron usernames duplicados.');
      return;
    }

    console.log(`Se encontraron ${duplicados.length} username(s) duplicado(s):`);
    for (const d of duplicados) {
      const usuarios = await global.knex('user')
        .whereRaw('LOWER(username) = ?', [d.username_lower])
        .select('id', 'username', 'email', 'status');
      console.log(`\nUsername: "${d.username}" (lower: ${d.username_lower}) — total: ${d.total}`);
      for (const u of usuarios) {
        console.log(`  id=${u.id} | username="${u.username}" | email=${u.email} | status=${u.status}`);
      }
    }
  } catch (error) {
    console.error('Error al verificar usernames duplicados:', error);
    process.exit(1);
  } finally {
    if (global.knex && typeof global.knex.destroy === 'function') {
      await global.knex.destroy();
    }
  }
})();
