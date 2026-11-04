const { ALLOWED_ORG_TYPES, isValidOrganizationType } = require('../../utils/organizationType');

describe('organizationType', () => {
    it('acepta todos los valores definidos en ALLOWED_ORG_TYPES', () => {
        for (const type of ALLOWED_ORG_TYPES) {
            expect(isValidOrganizationType(type)).toBe(true);
        }
    });

    it('rechaza valores inválidos', () => {
        expect(isValidOrganizationType('NO_EXISTE')).toBe(false);
        expect(isValidOrganizationType('')).toBe(false);
    });

    it('rechaza ausencia de valor', () => {
        expect(isValidOrganizationType(undefined)).toBe(false);
        expect(isValidOrganizationType(null)).toBe(false);
    });
});
