const config = require('dotenv').config()
global.config = config.parsed
console.log('Configuración cargada:', global.config)

const express = require("express")
const app_admin = require('express')();
const server_admin = require('http').Server(app_admin);
const cors = require('cors')
const Session = require('express-session')
const SessionFileStore = require('session-file-store')(Session)
const bodyParser = require("body-parser")
require('./knexfile.js'); // Esto inicializa global.knex
const LogOperacion = require('./controllers/log_operaciones.js');

// Configuración de CORS
const cors_origin = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(' ')
var corsOptions = {
    credentials: true,
    origin: cors_origin
}
app_admin.use(cors(corsOptions))

// Configuración de body parser
app_admin.use(bodyParser.json({ limit: '5mb', extended: true }))

// Configuración de sesiones
app_admin.use(Session({
    store: new SessionFileStore({
        path: './sessions' 
    }),
    secret: 'admin_session_secret',
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: 60 * 60 * 1000 * 24, // 1 día
        rolling: true
    }
}))

// Health check endpoint
app_admin.get('/health', async (req, res) => {
    try {
        // Verificar conexión a base de datos
        await global.knex.raw('SELECT 1');
        
        res.json({
            status: 'healthy',
            database: {
                client: process.env.DB_CLIENT || 'postgresql',
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || (process.env.DB_CLIENT === 'mysql' ? 3306 : 5432),
                database: process.env.DB_NAME,
                status: 'connected'
            },
            system: {
                writeMode: process.env.MODO_ESCRITURA || 'READ_WRITE',
                readOnly: (process.env.MODO_ESCRITURA || 'READ_WRITE') === 'READ_ONLY'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: {
                client: process.env.DB_CLIENT || 'postgresql',
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || (process.env.DB_CLIENT === 'mysql' ? 3306 : 5432),
                database: process.env.DB_NAME,
                status: 'disconnected',
                error: error.message
            },
            system: {
                writeMode: process.env.MODO_ESCRITURA || 'READ_WRITE',
                readOnly: (process.env.MODO_ESCRITURA || 'READ_WRITE') === 'READ_ONLY'
            },
            timestamp: new Date().toISOString()
        });
    }
});

// Rutas de la API
app_admin.use('/api/auth', require('./routes/auth.js'));
app_admin.use('/api/category', require('./routes/category.js'));
app_admin.use('/api/fotoclub', require('./routes/fotoclub.js'));
app_admin.use('/api/section', require('./routes/section.js'));
app_admin.use('/api/metric', require('./routes/metrics.js'));
app_admin.use('/api/users', require('./routes/user.js'));
app_admin.use('/api/contests', require('./routes/contest.js'))
app_admin.use('/api/images', require('./routes/images.js'));
app_admin.use('/api/log', require('./routes/log.js'));
app_admin.use('/api/results', require('./routes/results.js'));

// Manejo de errores global
app_admin.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Puerto del servidor
const port = process.env.SERVICE_PORT_ADMIN || 3000;

server_admin.listen(port, () => {
    console.log(`Servidor API Admin escuchando en puerto ${port}`);
    console.log(`Base de datos configurada: ${process.env.DB_CLIENT || 'postgresql'}`);
    console.log(`Health check disponible en: http://localhost:${port}/health`);
});

// Log de inicio del servidor
setTimeout(async () => {
    try {
        await LogOperacion(0, 'Se inicia el servidor', null, new Date());
        console.log('Log de inicio del servidor registrado exitosamente');
    } catch (error) {
        console.error('Error al registrar log de inicio:', error);
    }
}, 1000);

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server_admin.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...');
    server_admin.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
    });
});