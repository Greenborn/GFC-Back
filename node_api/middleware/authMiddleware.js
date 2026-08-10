const sso = require('../sso');

module.exports = sso.authMiddleware;
module.exports.authMiddlewareOptional = sso.authMiddlewareOptional;
