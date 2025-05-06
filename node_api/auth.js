const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ r: false, error: 'Falta de credenciales' });
  }

  try {
    const user = await global.knex('user').where('username', username).first();

    if (!user) {
      return res.status(401).json({ r: false, error: 'Usuario o Contraseña Incorrecta' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ r: false, error: 'Usuario o Contraseña Incorrecta' });
    }

    // Si el usuario y la contraseña son válidos, creamos una sesión
    req.session.user = user;
    res.json({ r: true, message: 'Login exitoso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ r: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;