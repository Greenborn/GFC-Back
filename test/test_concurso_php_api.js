// test/test_concurso_php_api.js
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
  console.log(`\n[POST] ${url}`);
  const res = await axios.post(url, {
    username: USERNAME,
    password: PASSWORD
  });
  if (res.data && res.data.status === true && res.data.token) {
    return res.data.token;
  } else {
    throw new Error('Login fallido: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

async function crearConcurso(token) {
  const url = `${BASE_URL}/contest`;
  console.log(`\n[POST] ${url}`);
  const form = new FormData();
  form.append('name', 'Concurso Test Automatizado');
  form.append('sub_title', 'Prueba Node.js');
  form.append('description', 'Concurso creado por script de test');
  form.append('max_img_section', '3');
  form.append('start_date', '2025-02-01T01:02:00.000Z');
  form.append('end_date', '2025-02-02T00:00:00.000Z');
  if (!fs.existsSync(IMAGE_PATH)) {
    fs.writeFileSync('test/dummy.jpg', Buffer.from([0xff,0xd8,0xff,0xd9])); // JPEG vacío
  }
  form.append('image_file', fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: 'image/jpeg'
  });
  const headers = {
    ...form.getHeaders(),
    Authorization: `Bearer ${token}`
  };
  const res = await axios.post(url, form, { headers });
  if (res.data && res.data.status) {
    return res.data.id || res.data.data?.id || true;
  } else {
    throw new Error('Creación fallida: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

async function editarConcurso(token, id) {
  const url = `${BASE_URL}/contest/${id}`;
  console.log(`\n[PUT] ${url}`);
  const form = new FormData();
  form.append('name', 'Concurso Test Editado');
  form.append('sub_title', 'Prueba Node.js Editado');
  form.append('description', 'Descripción actualizada por test');
  form.append('max_img_section', '5');
  form.append('start_date', '2025-02-01T01:02:00.000Z');
  form.append('end_date', '2025-03-01T00:00:00.000Z');
  if (!fs.existsSync(IMAGE_PATH)) {
    fs.writeFileSync('test/dummy.jpg', Buffer.from([0xff,0xd8,0xff,0xd9])); // JPEG vacío
  }
  form.append('image_file', fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: 'image/jpeg'
  });
  const headers = {
    ...form.getHeaders(),
    Authorization: `Bearer ${token}`
  };
  const res = await axios.put(url, form, { headers });
  if (res.data && res.data.status) {
    return true;
  } else {
    throw new Error('Edición fallida: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

async function eliminarConcurso(token, id) {
  const url = `${BASE_URL}/contest/${id}`;
  console.log(`\n[DELETE] ${url}`);
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.data && res.data.status) {
    return true;
  } else {
    throw new Error('Eliminación fallida: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

(async () => {
  try {
    console.log('Iniciando test de concursos PHP API...');
    const token = await login();
    console.log('Login exitoso. Token obtenido.');
    const id = await crearConcurso(token);
    console.log('Concurso creado con ID:', id);
    await editarConcurso(token, id);
    console.log('Concurso editado exitosamente.');
    await eliminarConcurso(token, id);
    console.log('Concurso eliminado exitosamente.');
    console.log('Test completado con éxito.');
  } catch (err) {
    let serverMsg = '';
    if (err.response) {
      serverMsg += `\nCódigo de estado: ${err.response.status}`;
      serverMsg += `\nHeaders: ${JSON.stringify(err.response.headers)}`;
      serverMsg += `\nCuerpo: ${JSON.stringify(err.response.data)}`;
    }
    console.error('Error en el test:', err.message, serverMsg);
    console.error('Objeto de error completo:', err);
    process.exit(1);
  }
})();