const LogOperacion = require('../controllers/log_operaciones.js');

// Los inserts de log_operaciones se encolan y se procesan de a uno,
// con una pausa entre cada uno, para que nunca compitan por el pool
// de conexiones con las queries reales ni bloqueen la respuesta HTTP.
const DELAY_MS = Number(process.env.LOG_QUEUE_DELAY_MS) || 100;

const queue = [];
let processing = false;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    try {
      await LogOperacion(item.idUsuario, item.evento, item.metaData, item.dateTime);
    } catch (error) {
      console.error('Error al procesar log de operación en cola:', error);
    }

    if (queue.length > 0) {
      await delay(DELAY_MS);
    }
  }

  processing = false;
}

function logAction(req, event, meta) {
  queue.push({
    idUsuario: req.user?.id || 0,
    evento: event,
    metaData: meta || null,
    dateTime: new Date()
  });

  processQueue();

  return Promise.resolve();
}

module.exports = { logAction };
