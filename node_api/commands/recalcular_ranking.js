// Script CLI para recalcular ranking anual utilizando la lógica Node
// Uso: node node_api/commands/recalcular_ranking.js

const config = require('dotenv').config();
require('../knexfile.js'); // inicializa global.knex
const { actualizarRanking } = require('../controllers/ranking');

(async () => {
  try {
    console.log('Iniciando recalculo de ranking (CLI)...');
    // Verificar conexión
    await global.knex.raw('SELECT 1');
    const resultado = await actualizarRanking();
    console.log('OK:', JSON.stringify(resultado, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERROR en recalculo de ranking:', err?.message || err);
    if (process.env.NODE_ENV === 'development') {
      console.error(err?.stack);
    }
    process.exit(1);
  } finally {
    try { await global.knex?.destroy?.(); } catch (_) {}
  }
})();