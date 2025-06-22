const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const LogOperacion = require('../controllers/log_operaciones.js')
const Mailer = require('../controllers/mailer.js')

router.post('/recupera_pass', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ r: false, error: 'Falta email' });
  }

  try {
    const user = await global.knex('user').where('email', email).first();

    if (!user) {
      return res.status(200).json({ r: true });
    }

    if (user){
      const TOKEN_RECUPERA_PASS = crypto.randomBytes(32).toString('hex').slice(0, 6);
      const AHORA = new Date()
      await LogOperacion(user.id, 'recuperar contraseña', '{"email":"'+email+'"}', AHORA)
      await global.knex('user')
        .update({
          'token_recupera_pass': TOKEN_RECUPERA_PASS,
          'pass_recovery_date':  AHORA
        })
        .where('email', email)

      const email_data = {
        html: `
          <div class="password-reset">
            Hola ${user.username},<br><br>
            
            A continuación se adjunta código de verificación solicitado para recuperación de contraseña:<br>
            <h1><b>${user.sign_up_verif_code}</b></h1>
            <div style="font-size:10px;">Este mensaje es enviado automáticamente, por favor no lo responda </div>
          </div>
        `,
        text: `Hola ${user.username} \n\nA continuación se adjunta código de verificación solicitado para recuperación de contraseña: ${user.sign_up_verif_code}`,
        to: user.email,
        subject: '[Grupo Fotográfico Centro] Código de verificación'
      }
      await Mailer.sendEmail(email_data)
      return res.status(200).json({ r: true });
    }

    return res.status(200).json({ r: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ r: false, error: 'Error interno del servidor' });
    return
  }
});

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
    await LogOperacion(user.id, 'login - '+username, null, new Date());

    const profile = await global.knex('profile').where('id', user?.profile_id).first();
    // Si el usuario y la contraseña son válidos, creamos una sesión
    req.session.user = user;
    const token = crypto.randomBytes(32).toString('hex');
    req.session.token = token;
    req.session.profile = profile;
    res.status(200).send({ r: true, profile: profile,  message: 'Login exitoso' });
    req.session.save()
    return
  } catch (error) {
    console.error(error);
    res.status(500).json({ r: false, error: 'Error interno del servidor' });
    return
  }
});

router.post('/cerrar_sesion', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      res.status(500).send({ error: 'Error interno del servidor' });
    } else {
      return res.json({ stat: true, text: 'No hay sesión activa' });
    }
  });
});

router.get('/session', async (req, res) => {
  try {
    if (req.session.user) {
      return res.json({ stat: true, profile: req.session.profile });
    } else {
      return res.json({ stat: false, error: 'No hay sesión activa' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ stat: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;