const { createSsoAuth } = require('express-greenborn-sso-back');

const sso = createSsoAuth({
  knex: global.knex,
  ssoBaseUrl: process.env.URL_AUTH_SERVICE || 'https://auth.greenborn.com.ar',
  ssoRoleMap: process.env.SSO_ROLE_MAP,
  defaultRoleId: 3,
  logger: {
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args),
    log: (...args) => console.log(...args)
  }
});

module.exports = sso;
