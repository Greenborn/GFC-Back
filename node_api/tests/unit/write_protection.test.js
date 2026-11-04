const writeProtection = require('../../middleware/writeProtection');

function mockRes() {
    const res = {
        statusCode: null,
        body: null,
        status(code) { res.statusCode = code; return res; },
        json(body) { res.body = body; return res; }
    };
    return res;
}

describe('writeProtection middleware', () => {
    it('bloquea con 503 cuando MODO_ESCRITURA=READ_ONLY', () => {
        const prev = process.env.MODO_ESCRITURA;
        process.env.MODO_ESCRITURA = 'READ_ONLY';
        try {
            const res = mockRes();
            let nextCalled = false;
            writeProtection({}, res, () => { nextCalled = true; });

            expect(res.statusCode).toBe(503);
            expect(res.body.success).toBe(false);
            expect(nextCalled).toBe(false);
        } finally {
            process.env.MODO_ESCRITURA = prev;
        }
    });

    it('permite continuar cuando MODO_ESCRITURA=READ_WRITE', () => {
        const prev = process.env.MODO_ESCRITURA;
        process.env.MODO_ESCRITURA = 'READ_WRITE';
        try {
            const res = mockRes();
            let nextCalled = false;
            writeProtection({}, res, () => { nextCalled = true; });

            expect(nextCalled).toBe(true);
            expect(res.statusCode).toBe(null);
        } finally {
            process.env.MODO_ESCRITURA = prev;
        }
    });
});
