const axios = require('axios');

const AUTH_SERVICE_URL = process.env.URL_AUTH_SERVICE || 'https://auth.greenborn.com.ar';
const SSO_TIMEOUT = 5000;

async function syncSsoUser(ssoUser) {
  const email = ssoUser.email;
  let user = await global.knex('user').where({ email }).first();
  if (user) return user;

  const name = ssoUser.name || ssoUser.email?.split('@')[0] || 'SSO User';
  const [profileId] = await global.knex('profile').insert({
    name,
    last_name: '',
    fotoclub_id: null
  });

  const [userId] = await global.knex('user').insert({
    username: name,
    email: ssoUser.email,
    role_id: 3,
    profile_id: profileId,
    status: 1,
    created_at: new Date().toISOString()
  });

  return await global.knex('user').where({ id: userId }).first();
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const localUser = await global.knex('user').where({ access_token: token }).first();
    if (localUser) {
      req.user = localUser;
      return next();
    }

    const uniqueId = req.query.unique_id;
    if (!uniqueId) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const response = await axios.get(
      `${AUTH_SERVICE_URL}/auth/verify?unique_id=${encodeURIComponent(uniqueId)}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: SSO_TIMEOUT }
    );

    if (response.data?.success && response.data?.data?.valid) {
      req.user = await syncSsoUser(response.data.data.user);
      return next();
    }

    return res.status(401).json({ success: false, message: 'Token inválido' });
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(500).json({ success: false, message: 'Error de autenticación', error: 'Servicio de autenticación no disponible' });
    }
    return res.status(500).json({ success: false, message: 'Error de autenticación', error: error.message });
  }
}

async function authMiddlewareOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const localUser = await global.knex('user').where({ access_token: token }).first();
    if (localUser) {
      req.user = localUser;
      return next();
    }

    const uniqueId = req.query.unique_id;
    if (!uniqueId) {
      return next();
    }

    const response = await axios.get(
      `${AUTH_SERVICE_URL}/auth/verify?unique_id=${encodeURIComponent(uniqueId)}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: SSO_TIMEOUT }
    );

    if (response.data?.success && response.data?.data?.valid) {
      req.user = await syncSsoUser(response.data.data.user);
    }
  } catch (err) {
    console.error('Auth optional error:', err.message);
  }

  return next();
}

module.exports = authMiddleware;
module.exports.authMiddlewareOptional = authMiddlewareOptional;
