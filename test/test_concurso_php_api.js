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
  // Interpretar éxito si hay id y img_url
  if (res.data && typeof res.data.id === 'number' && typeof res.data.img_url === 'string') {
    return res.data;
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
  // Interpretar éxito si la respuesta contiene id y name
  if (res.data && typeof res.data.id === 'number' && typeof res.data.name === 'string') {
    return res.data;
  } else {
    throw new Error('Edición fallida: ' + JSON.stringify(res.data));
  }
}

async function eliminarConcurso(token, id) {
  const url = `${BASE_URL}/contest/${id}`;
  console.log(`\n[DELETE] ${url}`);
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  // Considerar éxito si status HTTP es 200 o 204, aunque el body sea vacío
  if ((res.status === 200 || res.status === 204) || (res.data && res.data.status)) {
    return true;
  } else {
    throw new Error('Eliminación fallida: ' + (res.data?.message || JSON.stringify(res.data)));
  }
}

(async () => {
  let report = [];
  let error = null;
  let token = null, concurso = null;
  try {
    console.log('Iniciando test de concursos PHP API...');
    token = await login();
    report.push('✔️ Login exitoso');
    concurso = await crearConcurso(token);
    if (concurso && typeof concurso.id === 'number' && typeof concurso.img_url === 'string') {
      report.push({
        paso: 'Creación de concurso',
        estado: 'OK',
        detalle: `Concurso creado correctamente. ID: ${concurso.id}, Imagen: ${concurso.img_url}`,
        objeto: concurso
      });
      console.log('\x1b[32m%s\x1b[0m', '✔ Concurso creado exitosamente:', concurso);
    } else {
      report.push({
        paso: 'Creación de concurso',
        estado: 'ERROR',
        detalle: 'La respuesta no contiene los datos esperados.',
        objeto: concurso
      });
      console.log('\x1b[31m%s\x1b[0m', '✖ Error: La respuesta no contiene los datos esperados:', concurso);
    }
    const editado = await editarConcurso(token, concurso.id);
    if (editado && typeof editado.id === 'number' && typeof editado.name === 'string') {
      report.push({
        paso: 'Edición de concurso',
        estado: 'OK',
        detalle: `Concurso editado correctamente. ID: ${editado.id}, Nombre: ${editado.name}`,
        objeto: editado
      });
      console.log('\x1b[32m%s\x1b[0m', '✔ Concurso editado exitosamente:', editado);
    } else {
      report.push({
        paso: 'Edición de concurso',
        estado: 'ERROR',
        detalle: 'La respuesta de edición no contiene los datos esperados.',
        objeto: editado
      });
      console.log('\x1b[31m%s\x1b[0m', '✖ Error: La respuesta de edición no contiene los datos esperados:', editado);
    }
    await eliminarConcurso(token, concurso.id);
    report.push('✔️ Concurso eliminado exitosamente');
    report.push('✅ Test completado con éxito.');
  } catch (err) {
    error = err;
    if (err.response && err.response.data && typeof err.response.data.message === 'string') {
      if (err.response.data.message.includes('Permission denied')) {
        report.push('❌ Error de permisos al guardar archivo: ' + err.response.data.message);
      } else {
        report.push('❌ Error en la petición: ' + err.response.data.message);
      }
    } else {
      report.push('❌ Error inesperado: ' + err.message);
    }
    if (err.response) {
      report.push('--- RESPUESTA DE LA PETICIÓN ---');
      report.push('Código de estado: ' + err.response.status);
      report.push('Headers: ' + JSON.stringify(err.response.headers, null, 2));
      report.push('Cuerpo: ' + JSON.stringify(err.response.data, null, 2));
      report.push('------------------------------');
    } else {
      report.push('Objeto de error completo: ' + JSON.stringify(err));
    }
  }
  console.log('\n===== INFORME DEL TEST =====');
  report.forEach(line => console.log(line));
  console.log('============================\n');
  if (error) process.exit(1);
})();