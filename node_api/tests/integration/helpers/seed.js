// Helpers de seed para tests de integración: crear un admin de prueba y limpiar
// las tablas que los tests van tocando, usando la conexión directa a la DB (db.js).

const bcrypt = require('bcryptjs');
const { getTestKnex } = require('./db');

async function createAdminUser({ username = 'test_admin', password = 'test_admin_pass' } = {}) {
    const knex = getTestKnex();
    let hashed = bcrypt.hashSync(password, 13).replace(/^\$2[abxy]\$/, '$2y$');

    const profileId = await knex('profile').insert({ name: 'Admin', last_name: 'Test' });
    const [userId] = await knex('user').insert({
        username,
        email: `${username}@example.com`,
        password_hash: hashed,
        role_id: 1,
        profile_id: Array.isArray(profileId) ? profileId[0] : profileId,
        status: 1,
        profile_completed: true
    });

    return { id: userId, username, password };
}

async function resetTables(tableNames) {
    const knex = getTestKnex();
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tableNames) {
        await knex(t).truncate();
    }
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
}

module.exports = { createAdminUser, resetTables };
