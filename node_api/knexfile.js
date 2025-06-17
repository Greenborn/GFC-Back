
const config = require('dotenv').config()

const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.db_host,
        port: process.env.db_port,
        user: process.env.db_user,
        password: process.env.db_pass,
        database: process.env.db_name
    },
    migrations: {
        directory: './migrations'
    }
})
global.knex = knex

module.exports = {
    development: {
      client: 'mysql',
      connection: {
        host: process.env.db_host,
        user: process.env.db_user,
        port: process.env.db_port,
        password: process.env.db_pass,
        database: process.env.db_name
      },
      migrations: {
        directory: './migrations'
      }
    }
};