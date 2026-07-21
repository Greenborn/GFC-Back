const axios = require('axios');
const LogOperacion = require('../controllers/log_operaciones');

const AUTH_SERVICE_URL = process.env.URL_AUTH_SERVICE || 'https://auth.greenborn.com.ar';
const SSO_TIMEOUT = 5000;

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const tokenCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (entry.expiresAt <= now) tokenCache.delete(key);
  }
}, 60 * 60 * 1000);

function resolveSsoRole(email) {
  const raw = process.env.SSO_ROLE_MAP;
  if (!raw) return 3;
  try {
    const map = JSON.parse(raw);
    if (map[email] !== undefined) return map[email];
    for (const [pattern, roleId] of Object.entries(map)) {
      if (pattern.startsWith('*') && email.endsWith(pattern.slice(1))) {
        return roleId;
      }
    }
  } catch {
    console.error('[Auth] SSO_ROLE_MAP inválido');
  }
  return 3;
}

async function syncSsoUser(ssoUser) {
  const email = ssoUser.email;
  let user = await global.knex('user').where({ email }).first();
  if (user) return user;

  const name = ssoUser.name || ssoUser.email?.split('@')[0] || 'SSO User';
  const [profileRow] = await global.knex('profile').insert({
    name,
    last_name: '',
    fotoclub_id: null
  }).returning('id');
  const profileId = profileRow?.id ?? profileRow;

  const [userRow] = await global.knex('user').insert({
    username: name,
    email: ssoUser.email,
    role_id: resolveSsoRole(ssoUser.email),
    profile_id: profileId,
    status: 1,
    created_at: new Date().toISOString()
  }).returning('id');
  const userId = userRow?.id ?? userRow;

  return await global.knex('user').where({ id: userId }).first();
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
  }

  const token = authHeader.replace('Bearer ', '');
  const tokenPreview = token.substring(0, 20) + '...';
  const ruta = req.originalUrl || req.url;

  try {
    let localUser = null;
    try {
      const tokenRow = await global.knex('user_tokens')
        .where({ token, is_active: true })
        .whereRaw('(expires_at IS NULL OR expires_at > NOW())')
        .first();
      if (tokenRow) {
        await global.knex('user_tokens').where({ id: tokenRow.id }).update({ last_used_at: new Date() });
        localUser = await global.knex('user').where({ id: tokenRow.user_id }).first();
      }
    } catch (_) {
      const legacyUser = await global.knex('user').where({ access_token: token }).first();
      if (legacyUser) localUser = legacyUser;
    }
    if (localUser) {
      req.user = localUser;
      return next();
    }

    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = await syncSsoUser(cached.user);
      return next();
    }

    const uniqueId = req.query.unique_id;
    if (!uniqueId) {
      console.warn(`[Auth] unique_id ausente para token SSO — ${tokenPreview} — ruta: ${ruta}`);
      await LogOperacion(0, 'auth - token SSO sin unique_id', JSON.stringify({ ruta, tokenPreview }), new Date());
      return res.status(400).json({ success: false, message: 'unique_id requerido en query param' });
    }

    let response;
    try {
      response = await axios.get(
        `${AUTH_SERVICE_URL}/auth/verify?unique_id=${encodeURIComponent(uniqueId)}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: SSO_TIMEOUT }
      );
    } catch (ssoErr) {
      const ssoBody = ssoErr.response?.data;
      const ssoStatus = ssoErr.response?.status;
      const ssoErrorDetail = ssoBody ? JSON.stringify(ssoBody) : (ssoErr.code || ssoErr.message);

      console.error(`[Auth] Error al consultar SSO (${ssoStatus}): ${ssoErrorDetail} — token: ${tokenPreview} — ruta: ${ruta}`);
      await LogOperacion(0, 'auth - error SSO', JSON.stringify({ status: ssoStatus, respuesta: ssoBody, ruta, tokenPreview }), new Date());

      if (ssoBody?.require_reauth || ssoBody?.error === 'TOKEN_EXPIRED' || ssoStatus === 401) {
        tokenCache.delete(token);
        return res.status(401).json({ success: false, message: 'Sesión expirada', require_reauth: true });
      }
      return res.status(500).json({ success: false, message: 'Error de autenticación', error: 'Servicio de autenticación no disponible' });
    }

    if (response.data?.success && response.data?.data?.valid) {
      const ssoUser = response.data.data.user;
      tokenCache.set(token, { user: ssoUser, expiresAt: Date.now() + CACHE_TTL_MS });
      req.user = await syncSsoUser(ssoUser);
      return next();
    }

    console.warn(`[Auth] SSO rechazó token: ${JSON.stringify(response.data)} — unique_id: ${uniqueId} — ruta: ${ruta}`);
    await LogOperacion(0, 'auth - token SSO rechazado', JSON.stringify({ respuesta: response.data, uniqueId, ruta, tokenPreview }), new Date());

    if (response.data?.require_reauth) {
      tokenCache.delete(token);
      return res.status(401).json({ success: false, message: 'Sesión expirada', require_reauth: true });
    }
    tokenCache.delete(token);
    return res.status(401).json({ success: false, message: 'Token inválido' });
  } catch (error) {
    console.error(`[Auth] Error inesperado: ${error.message} — ruta: ${ruta}`);
    return res.status(500).json({ success: false, message: 'Error de autenticación', error: error.message });
  }
}

async function authMiddlewareOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  const tokenPreview = token.substring(0, 20) + '...';
  const ruta = req.originalUrl || req.url;

  try {
    let localUser = null;
    try {
      const tokenRow = await global.knex('user_tokens')
        .where({ token, is_active: true })
        .whereRaw('(expires_at IS NULL OR expires_at > NOW())')
        .first();
      if (tokenRow) {
        await global.knex('user_tokens').where({ id: tokenRow.id }).update({ last_used_at: new Date() });
        localUser = await global.knex('user').where({ id: tokenRow.user_id }).first();
      }
    } catch (_) {
      const legacyUser = await global.knex('user').where({ access_token: token }).first();
      if (legacyUser) localUser = legacyUser;
    }
    if (localUser) {
      req.user = localUser;
      return next();
    }

    const cached = tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = await syncSsoUser(cached.user);
      return next();
    }

    const uniqueId = req.query.unique_id;
    if (!uniqueId) {
      return next();
    }

    let response;
    try {
      response = await axios.get(
        `${AUTH_SERVICE_URL}/auth/verify?unique_id=${encodeURIComponent(uniqueId)}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: SSO_TIMEOUT }
      );
    } catch (ssoErr) {
      const ssoBody = ssoErr.response?.data;
      const ssoStatus = ssoErr.response?.status;
      console.error(`[Auth] Error SSO (opcional) ${ssoStatus}: ${JSON.stringify(ssoBody)} — ${tokenPreview}`);
      return next();
    }

    if (response.data?.success && response.data?.data?.valid) {
      const ssoUser = response.data.data.user;
      tokenCache.set(token, { user: ssoUser, expiresAt: Date.now() + CACHE_TTL_MS });
      req.user = await syncSsoUser(ssoUser);
    }
  } catch (err) {
    console.error(`[Auth] Error inesperado (opcional): ${err.message}`);
  }

  return next();
}

module.exports = authMiddleware;
module.exports.authMiddlewareOptional = authMiddlewareOptional;
