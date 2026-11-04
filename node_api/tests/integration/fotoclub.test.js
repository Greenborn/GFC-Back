// Test de integración: creación de fotoclub vía API real + DB de pruebas MariaDB.
const axios = require('axios');
const { startTestServer } = require('./helpers/server');
const { createAdminUser, resetTables } = require('./helpers/seed');
const { closeTestKnex } = require('./helpers/db');

describe('fotoclub', () => {
    let server;
    let token;

    before(async () => {
        await resetTables(['user_tokens', 'fotoclub', 'user', 'profile']);
        const admin = await createAdminUser({ username: 'fotoclub_test_admin', password: 'Sup3rSecret!' });
        server = await startTestServer();

        const loginRes = await axios.post(`${server.baseUrl}/api/auth/login`, {
            username: admin.username,
            password: admin.password
        });
        token = loginRes.data.token;
    });

    after(async () => {
        server.stop();
        await closeTestKnex();
    });

    it('crea un fotoclub con mostrar_en_ranking y organization_type', async () => {
        const nombre = `Fotoclub Test ${Date.now()}`;
        const createRes = await axios.post(`${server.baseUrl}/api/fotoclub/create`, {
            name: nombre,
            description: 'Fotoclub de prueba de integración',
            mostrar_en_ranking: 1,
            organization_type: 'INTERNO'
        }, { headers: { Authorization: `Bearer ${token}` } });

        expect(createRes.data.stat).toBe(true);

        const listRes = await axios.get(`${server.baseUrl}/api/fotoclub/get_all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const items = listRes.data.items || listRes.data;
        const created = items.find(f => f.name === nombre);

        expect(!!created).toBe(true);
        expect(created.mostrar_en_ranking).toBe(1);
        expect(created.organization_type).toBe('INTERNO');
    });

    it('rechaza la creación sin token de autenticación', async () => {
        try {
            await axios.post(`${server.baseUrl}/api/fotoclub/create`, { name: 'Sin auth' });
            throw new Error('Debía rechazar la creación sin auth');
        } catch (err) {
            expect(err.response.status).toBe(401);
        }
    });
});
