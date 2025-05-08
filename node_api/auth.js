const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const LogOperacion = require('./log_operaciones.js');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ r: false, error: 'Falta de credenciales' });
  }

  try {
    const user = await global.knex('user').where('username', username).first();

    if (!user) {
      await LogOperacion(0, 'usuario no encontrado', '{"user":"'+username+'"}', new Date());
      return res.status(401).json({ r: false, error: 'Usuario o Contraseña Incorrecta' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);

    if (!isValidPassword) {
      await LogOperacion(user.id, 'contraseña incorrecta', '{"user":"'+username+'"}', new Date());
      return res.status(401).json({ r: false, error: 'Usuario o Contraseña Incorrecta' });
    }
    await LogOperacion(user.id, 'login', null, new Date());

    // Si el usuario y la contraseña son válidos, creamos una sesión
    req.session.user = user;
    res.json({ r: true, message: 'Login exitoso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ r: false, error: 'Error interno del servidor' });
  }
});

router.post('/cerrar-sesion', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      res.status(500).send({ error: 'Error interno del servidor' });
    } else {
      res.redirect('/login');
    }
  });
});

router.get('/users', async (req, res) => {
  try {
    res.json({ 
      items: await global.knex('user'),
      profile: await global.knex('profile'),
      role: await global.knex('role')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener registros' });
  }
});

router.get('/log-operaciones', async (req, res) => {
  try {
    const registros = await global.knex('log_operaciones')
    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener registros' });
  }
});

module.exports = router;