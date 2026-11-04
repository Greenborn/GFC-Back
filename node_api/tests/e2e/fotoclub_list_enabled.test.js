// Test e2e: pega contra una instancia real ya levantada (dev/staging),
// configurable por NODE_API_BASE_URL. No requiere la DB de pruebas MariaDB:
// usa los datos que ya existan en el ambiente apuntado.
//
// No corre por defecto con `npm test` (ver tests/runner.js / package.json):
// se ejecuta explícitamente con `npm run test:e2e` contra un ambiente levantado.
const axios = require('axios');

const BASE_URL = process.env.NODE_API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api/fotoclub/get_all`;

describe('e2e: fotoclub get_all - filtro enabled', () => {
    it('por defecto retorna solo fotoclubes habilitados', async () => {
        const res = await axios.get(API_URL);
        const items = res.data.items || res.data;
        expect(items.every(item => item.enabled === true || item.enabled === 1)).toBe(true);
    });

    it('con inc_disabled=true retorna igual o más fotoclubes que por defecto', async () => {
        const resDefault = await axios.get(API_URL);
        const itemsDefault = resDefault.data.items || resDefault.data;

        const resAll = await axios.get(`${API_URL}?inc_disabled=true`);
        const itemsAll = resAll.data.items || resAll.data;

        expect(itemsAll.length >= itemsDefault.length).toBe(true);
    });
});
