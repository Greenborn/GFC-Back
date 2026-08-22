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

// Sanitiza un término de búsqueda de código de imagen.
// A diferencia de sanitizeSearchTerm, conserva los guiones bajos (parte legítima
// del código) y escapa los comodines de LIKE (% y _) para que se matcheen literalmente.
function sanitizeSearchCode(term) {
  if (!term) return '';
  const clean = String(term)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
    .toLowerCase()
    .substring(0, 200);
  return escapeLikePattern(clean);
}

module.exports = { sanitizarNombreSeccion, escapeLikePattern, baseUnaccent, sanitizeSearchTerm, removeAccents, sanitizeSearchCode };
