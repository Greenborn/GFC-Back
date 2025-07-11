/**
 * Middleware para proteger endpoints de escritura cuando el sistema está en modo READ_ONLY
 */
const writeProtection = (req, res, next) => {
    const modoEscritura = process.env.MODO_ESCRITURA || 'READ_WRITE';
    
    if (modoEscritura === 'READ_ONLY') {
        return res.status(503).json({
            success: false,
            message: 'Sistema en modo de solo lectura',
            error: 'READ_ONLY_MODE',
            details: 'Las operaciones de escritura están deshabilitadas temporalmente',
            timestamp: new Date().toISOString()
        });
    }
    
    next();
};

module.exports = writeProtection; 