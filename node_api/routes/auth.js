const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const LogOperacion = require('../controllers/log_operaciones.js');

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
    const token = crypto.randomBytes(32).toString('hex');
    req.session.token = token;
    res.json({ r: true, t: token, message: 'Login exitoso' });
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

module.exports = router;