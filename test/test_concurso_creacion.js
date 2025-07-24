require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL;
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;
const IMAGE_PATH = process.env.CONTEST_IMAGE_PATH || 'test/dummy.jpg';

async function login() {
  const url = `${BASE_URL}/login`;
  const res = await axios.post(url, { username: USERNAME, password: PASSWORD });
  if (res.data && res.data.status === true && res.data.token) {
    return res.data.token;
  } else {
    throw new Error('Login fallido: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

async function crearConcurso(token) {
  const url = `${BASE_URL}/contest`;
  const form = new FormData();
  form.append('name', 'Concurso Test Automatizado');
  form.append('sub_title', 'Prueba Node.js');
  form.append('description', 'Concurso creado por script de test');
  form.append('max_img_section', '3');
  form.append('start_date', '2025-02-01T01:02:00.000Z');
  form.append('end_date', '2025-02-02T00:00:00.000Z');
  if (!fs.existsSync(IMAGE_PATH)) {
    fs.writeFileSync('test/dummy.jpg', Buffer.from([0xff,0xd8,0xff,0xd9]));
  }
  form.append('image_file', fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: 'image/jpeg'
  });
  const headers = { ...form.getHeaders(), Authorization: `Bearer ${token}` };
  const res = await axios.post(url, form, { headers });
  if (res.data && typeof res.data.id === 'number' && typeof res.data.img_url === 'string') {
    return res.data;
  } else {
    throw new Error('Creación fallida: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

(async () => {
  try {
    console.log('Iniciando test de creación de concurso...');
    const token = await login();
    const concurso = await crearConcurso(token);
    console.log('\x1b[32m%s\x1b[0m', '✔ Concurso creado exitosamente:', concurso);
    // Guardar el id en runtime.json
    const runtimePath = path.join(__dirname, 'runtime.json');
    let runtime = {};
    if (fs.existsSync(runtimePath)) {
      try {
        runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
      } catch (e) {
        runtime = {};
      }
    }
    runtime['test_concurso_creacion'] = { id: concurso.id };
    fs.writeFileSync(runtimePath, JSON.stringify(runtime, null, 2));
    // Guardar resultado en resultado.json
    const resultadoPath = path.join(__dirname, 'resultado.json');
    let resultado = {};
    if (fs.existsSync(resultadoPath)) {
      try {
        resultado = JSON.parse(fs.readFileSync(resultadoPath, 'utf8'));
      } catch (e) {
        resultado = {};
      }
    }
    const resumen = {
      exito: true,
      mensaje: `Concurso creado exitosamente. ID: ${concurso.id}`,
      id: concurso.id,
      fecha: new Date().toISOString()
    };
    if (!resultado['test_concurso_creacion']) resultado['test_concurso_creacion'] = [];
    resultado['test_concurso_creacion'].push(resumen);
    fs.writeFileSync(resultadoPath, JSON.stringify(resultado, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    let resultado = {};
    const resultadoPath = require('path').join(__dirname, 'resultado.json');
    if (require('fs').existsSync(resultadoPath)) {
      try {
        resultado = JSON.parse(require('fs').readFileSync(resultadoPath, 'utf8'));
      } catch (e) {
        resultado = {};
      }
    }
    const resumen = {
      exito: false,
      mensaje: err.message,
      fecha: new Date().toISOString()
    };
    if (err.response) {
      resumen.codigo_estado = err.response.status;
      resumen.cuerpo = err.response.data;
    }
    if (!resultado['test_concurso_creacion']) resultado['test_concurso_creacion'] = [];
    resultado['test_concurso_creacion'].push(resumen);
    require('fs').writeFileSync(resultadoPath, JSON.stringify(resultado, null, 2));
    process.exit(1);
  }
})();
