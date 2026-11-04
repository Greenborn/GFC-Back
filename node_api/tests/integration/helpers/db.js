// Conexión directa a la DB de pruebas (independiente del server.js hijo),
// usada por los tests de integración para sembrar datos y limpiar tablas.

const path = require('path');
const fs = require('fs');
const knexLib = require('knex');

function loadEnvTest() {
    const envPath = path.join(__dirname, '..', '..', '..', '.env.test');
    const vars = {};
    if (fs.existsSync(envPath)) {
        for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
            const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
            if (m) vars[m[1]] = m[2];
        }
    }
    return vars;
}

let knexInstance = null;

function getTestKnex() {
    if (knexInstance) return knexInstance;
    const envTest = loadEnvTest();
    knexInstance = knexLib({
        client: 'mysql',
        connection: {
            host: envTest.TEST_DB_HOST || '127.0.0.1',
            port: Number(envTest.TEST_DB_PORT || 3306),
            user: envTest.TEST_DB_USER || 'gfc_test_user',
            password: envTest.TEST_DB_PASSWORD || 'gfc_test_password',
            database: envTest.TEST_DB_NAME || 'gfc_test'
        },
        pool: { min: 0, max: 5 }
    });
    return knexInstance;
}

// Vacía las tablas indicadas respetando FKs (deshabilita checks temporalmente en MariaDB).
async function truncateTables(tableNames) {
    const knex = getTestKnex();
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tableNames) {
        await knex(table).truncate();
    }
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
}

async function closeTestKnex() {
    if (knexInstance) {
        await knexInstance.destroy();
        knexInstance = null;
    }
}

module.exports = { getTestKnex, truncateTables, closeTestKnex };
