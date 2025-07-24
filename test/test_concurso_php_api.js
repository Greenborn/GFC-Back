// test/test_concurso_php_api.js
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL;
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

async function login() {
  try {
    const url = `${BASE_URL}/login`;
    console.log(`\n[POST] ${url}`);
    const res = await axios.post(url, {
      username: USERNAME,
      password: PASSWORD
    });
    // Respuesta real: { status: true, token: '...', ... }
    if (res.data && res.data.status === true && res.data.token) {
      return res.data.token;
    } else {
      throw new Error('Login fallido: ' + (res.data.message || JSON.stringify(res.data)));
    }
  } catch (err) {
    throw new Error('Error en login: ' + err.message);
  }
}

async function crearConcurso(token) {
  try {
    const concurso = {
      title: 'Concurso Test Automatizado',
      subtitle: 'Prueba Node.js',
      description: 'Concurso creado por script de test',
      start_date: '2024-07-01',
      end_date: '2024-07-31',
      registration_deadline: '2024-07-15',
      max_photos_per_user: 5,
      max_photos_per_section: 2,
      is_public: true,
      rules: 'Reglas de prueba',
      prizes: 'Premio de ejemplo'
    };
    const url = `${BASE_URL}/contests`;
    console.log(`\n[POST] ${url}`);
    const res = await axios.post(url, concurso, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.success && res.data.data.id) {
      return res.data.data.id;
    } else {
      throw new Error('Creación fallida: ' + (res.data.message || JSON.stringify(res.data)));
    }
  } catch (err) {
    throw new Error('Error al crear concurso: ' + err.message);
  }
}

async function editarConcurso(token, id) {
  try {
    const update = {
      title: 'Concurso Test Editado',
      description: 'Descripción actualizada por test',
      end_date: '2024-08-15',
      status: 'active'
    };
    const url = `${BASE_URL}/contests/${id}`;
    console.log(`\n[PUT] ${url}`);
    const res = await axios.put(url, update, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.success) {
      return true;
    } else {
      throw new Error('Edición fallida: ' + (res.data.message || JSON.stringify(res.data)));
    }
  } catch (err) {
    throw new Error('Error al editar concurso: ' + err.message);
  }
}

async function eliminarConcurso(token, id) {
  try {
    const url = `${BASE_URL}/contests/${id}`;
    console.log(`\n[DELETE] ${url}`);
    const res = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.success) {
      return true;
    } else {
      throw new Error('Eliminación fallida: ' + (res.data.message || JSON.stringify(res.data)));
    }
  } catch (err) {
    throw new Error('Error al eliminar concurso: ' + err.message);
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
    console.error('Error en el test:', err.message);
    process.exit(1);
  }
})(); 