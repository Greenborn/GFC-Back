const { createSsoAuth } = require('express-greenborn-sso-back');

// La creación de usuarios/perfiles queda EXCLUSIVAMENTE en el flujo de registro
// (POST /auth/register). Esta función solo retorna el usuario local existente por
// email (sin crearlo), para que el middleware del socket autentique/linkee al
// usuario ya registrado y no genere filas duplicadas en cada login SSO.
function createUserFromSso(ssoUser, ctx) {
  const email = ssoUser?.email;
  if (!email || !ctx?.knex) return null;
  return ctx.knex(ctx.tables.user)
    .whereRaw('LOWER(email) = ?', [String(email).toLowerCase()])
    .first()
    .catch(() => null);
}

const sso = createSsoAuth({
  knex: global.knex,
  ssoBaseUrl: process.env.URL_AUTH_SERVICE || 'https://auth.greenborn.com.ar',
  ssoRoleMap: process.env.SSO_ROLE_MAP,
  defaultRoleId: 3,
  createUserFromSso,
  logger: {
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
    log: (...args) => console.log(...args)
  }
});

module.exports = sso;
