require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL;
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

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
  const res = await axios.post(url, {
    name: 'Concurso Test Automatizado',
    sub_title: 'Prueba Node.js',
    description: 'Concurso creado por script de test',
    max_img_section: '3',
    start_date: '2025-02-01T01:02:00.000Z',
    end_date: '2025-02-02T00:00:00.000Z'
  }, { headers: { Authorization: `Bearer ${token}` } });
  if (res.data && typeof res.data.id === 'number') {
    return res.data;
  } else {
    throw new Error('Creación fallida: ' + (res.data.message || JSON.stringify(res.data)));
  }
}

async function eliminarConcurso(token, id) {
  const url = `${BASE_URL}/contest/${id}`;
  const res = await axios.delete(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if ((res.status === 200 || res.status === 204) || (res.data && res.data.status)) {
    return true;
  } else {
    throw new Error('Eliminación fallida: ' + (res.data?.message || JSON.stringify(res.data)));
  }
}

(async () => {
  try {
    const concursoIdArg = process.argv[2];
    console.log('Iniciando test de borrado de concurso...');
    const token = await login();
    let id;
    if (concursoIdArg) {
      id = concursoIdArg;
      console.log(`Usando id proporcionado: ${id}`);
    } else {
      const concurso = await crearConcurso(token);
      id = concurso.id;
      console.log(`Concurso creado para borrado. ID: ${id}`);
    }
    await eliminarConcurso(token, id);
    console.log('\x1b[32m%s\x1b[0m', '✔ Concurso eliminado exitosamente. ID:', id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Código de estado:', err.response.status);
      console.error('Cuerpo:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
