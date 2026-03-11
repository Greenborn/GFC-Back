// Utility for organization_type validation and constants

const ALLOWED_ORG_TYPES = ['INTERNO', 'EXTERNO', 'EXTERNO_0', 'EXTERNO_UNICEN'];

/**
 * Comprueba si el valor proporcionado es un tipo de organización válido.
 *
 * @param {string} type - Valor a validar.
 * @returns {boolean} True si el tipo es válido, false en caso contrario.
 */
function isValidOrganizationType(type) {
    if (!type) return false;
    return ALLOWED_ORG_TYPES.includes(type);
}

module.exports = {
    ALLOWED_ORG_TYPES,
    isValidOrganizationType,
};
