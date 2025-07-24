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

async function editarConcurso(token, id) {
  const url = `${BASE_URL}/contest/${id}`;
  const form = new FormData();
  form.append('name', 'Concurso Test Editado');
  form.append('sub_title', 'Prueba Node.js Editado');
  form.append('description', 'Descripción actualizada por test');
  form.append('max_img_section', '5');
  form.append('start_date', '2025-02-01T01:02:00.000Z');
  form.append('end_date', '2025-03-01T00:00:00.000Z');
  if (!fs.existsSync(IMAGE_PATH)) {
    fs.writeFileSync('test/dummy.jpg', Buffer.from([0xff,0xd8,0xff,0xd9]));
  }
  form.append('image_file', fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: 'image/jpeg'
  });
  const headers = { ...form.getHeaders(), Authorization: `Bearer ${token}` };
  const res = await axios.put(url, form, { headers });
  if (res.data && typeof res.data.id === 'number' && typeof res.data.name === 'string') {
    return res.data;
  } else {
    throw new Error('Edición fallida: ' + JSON.stringify(res.data));
  }
}

(async () => {
  try {
    console.log('Iniciando test de edición de concurso...');
    const token = await login();
    const fs = require('fs');
    const path = require('path');
    const runtimePath = path.join(__dirname, 'runtime.json');
    let id = null;
    if (fs.existsSync(runtimePath)) {
      try {
        const runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
        if (runtime['test_concurso_creacion'] && runtime['test_concurso_creacion'].id) {
          id = runtime['test_concurso_creacion'].id;
        }
      } catch (e) {}
    }
    if (!id) {
      console.log('No se encontró id de concurso en runtime.json. No se realiza edición.');
      process.exit(0);
    }
    const editado = await editarConcurso(token, id);
    console.log('\x1b[32m%s\x1b[0m', '✔ Concurso editado exitosamente:', editado);
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
      mensaje: `Concurso editado exitosamente. ID: ${editado.id}`,
      id: editado.id,
      fecha: new Date().toISOString()
    };
    if (!resultado['test_concurso_edicion']) resultado['test_concurso_edicion'] = [];
    resultado['test_concurso_edicion'].push(resumen);
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
    if (!resultado['test_concurso_edicion']) resultado['test_concurso_edicion'] = [];
    resultado['test_concurso_edicion'].push(resumen);
    require('fs').writeFileSync(resultadoPath, JSON.stringify(resultado, null, 2));
    process.exit(1);
  }
})();
