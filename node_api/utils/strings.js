function sanitizarNombreSeccion(name) {
  if (!name) return 'sin_seccion';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function escapeLikePattern(value) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

const UNACCENT_FROM = 'áàâãäåéèêëíìîïóòôõöúùûüñçÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÑÇ';
const UNACCENT_TO   = 'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC';

function baseUnaccent(columnExpr) {
  return "TRANSLATE(LOWER(" + columnExpr + "),'" + UNACCENT_FROM + "','" + UNACCENT_TO + "')";
}

function sanitizeSearchTerm(term) {
  if (!term) return '';
  return term
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[%_]/g, ' ')
    .trim()
    .toLowerCase()
    .substring(0, 200);
}

function removeAccents(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

module.exports = { sanitizarNombreSeccion, escapeLikePattern, baseUnaccent, sanitizeSearchTerm, removeAccents };
