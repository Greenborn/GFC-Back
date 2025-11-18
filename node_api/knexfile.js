
const config = require('dotenv').config()

// Determinar el cliente de base de datos desde variables de entorno
const dbClient = process.env.DB_CLIENT || 'postgresql'

const num = (v, d) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
}

// Configuración de conexión según el cliente
const connectionConfig = {
    host: process.env.DB_HOST,
    port: num(process.env.DB_PORT, dbClient === 'postgresql' ? 5432 : 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

if (dbClient === 'mysql') {
    connectionConfig.connectTimeout = num(process.env.DB_CONNECT_TIMEOUT_MS, 10000)
} else if (dbClient === 'postgresql') {
    connectionConfig.connectionTimeoutMillis = num(process.env.DB_CONNECT_TIMEOUT_MS, 10000)
}

// Configuración de pool según el cliente
const poolConfig = {
    min: num(process.env.DB_POOL_MIN, 2),
    max: num(process.env.DB_POOL_MAX, 10),
    acquireTimeoutMillis: num(process.env.DB_ACQUIRE_TIMEOUT_MS, 30000),
    createTimeoutMillis: num(process.env.DB_CREATE_TIMEOUT_MS, 30000),
    destroyTimeoutMillis: num(process.env.DB_DESTROY_TIMEOUT_MS, 5000),
    idleTimeoutMillis: num(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    reapIntervalMillis: num(process.env.DB_REAP_INTERVAL_MS, 1000),
    createRetryIntervalMillis: num(process.env.DB_CREATE_RETRY_INTERVAL_MS, 100),
}

const knex = require('knex')({
    client: dbClient,
    connection: connectionConfig,
    pool: poolConfig,
    migrations: {
        directory: './migrations'
    }
})
global.knex = knex

module.exports = {
    development: {
      client: dbClient,
      connection: connectionConfig,
      pool: poolConfig,
      migrations: {
        directory: './migrations'
      }
    },
    production: {
      client: dbClient,
      connection: connectionConfig,
      pool: poolConfig,
      migrations: {
        directory: './migrations'
      }
    }
};