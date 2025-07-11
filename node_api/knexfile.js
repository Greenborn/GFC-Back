
const config = require('dotenv').config()

// Determinar el cliente de base de datos desde variables de entorno
const dbClient = process.env.DB_CLIENT || 'postgresql'

// Configuración de conexión según el cliente
const connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || (dbClient === 'postgresql' ? 5432 : 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

// Configuración de pool según el cliente
const poolConfig = {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
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