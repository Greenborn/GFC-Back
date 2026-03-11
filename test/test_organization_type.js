// test_organization_type.js
// Pequeña prueba para la función de validación de tipos de organización

const { isValidOrganizationType, ALLOWED_ORG_TYPES } = require('../node_api/utils/organizationType');

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

try {
    console.log('Tipos permitidos:', ALLOWED_ORG_TYPES.join(', '));
    // Cada tipo permitido debe ser válido
    ALLOWED_ORG_TYPES.forEach(t => {
        assert(isValidOrganizationType(t), `expected ${t} to be valid`);
    });

    // Valores no permitidos
    ['FOO', '', null, undefined, 'EXTERNO-INVALIDO'].forEach(t => {
        assert(!isValidOrganizationType(t), `expected ${t} to be invalid`);
    });

    console.log('✔️  Validación de tipos de organización funciona correctamente');
} catch (err) {
    console.error('❌ Error en test_organization_type:', err.message);
    process.exit(1);
}
