// Test de integración: login contra la API real + DB de pruebas MariaDB.
const axios = require('axios');
const { startTestServer } = require('./helpers/server');
const { createAdminUser, resetTables } = require('./helpers/seed');
const { closeTestKnex } = require('./helpers/db');

describe('auth', () => {
    let server;
    let admin;

    before(async () => {
        await resetTables(['user_tokens', 'user', 'profile']);
        admin = await createAdminUser({ username: 'auth_test_admin', password: 'Sup3rSecret!' });
        server = await startTestServer();
    });

    after(async () => {
        server.stop();
        await closeTestKnex();
    });

    it('rechaza login con contraseña incorrecta', async () => {
        try {
            await axios.post(`${server.baseUrl}/api/auth/login`, {
                username: admin.username,
                password: 'contraseña-incorrecta'
            });
            throw new Error('Debía rechazar el login');
        } catch (err) {
            expect(err.response.status).toBe(401);
            expect(err.response.data.r).toBe(false);
        }
    });

    it('permite login con credenciales correctas y devuelve token', async () => {
        const res = await axios.post(`${server.baseUrl}/api/auth/login`, {
            username: admin.username,
            password: admin.password
        });
        expect(res.status).toBe(200);
        expect(res.data.r).toBe(true);
        expect(res.data.username).toBe(admin.username);
        expect(typeof res.data.token).toBe('string');
    });

    it('rechaza login de usuario inexistente', async () => {
        try {
            await axios.post(`${server.baseUrl}/api/auth/login`, {
                username: 'no_existe_' + Date.now(),
                password: 'cualquiera'
            });
            throw new Error('Debía rechazar el login');
        } catch (err) {
            expect(err.response.status).toBe(401);
        }
    });
});
