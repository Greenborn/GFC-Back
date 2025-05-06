const config = require('dotenv').config()
global.config = config.parsed

const express = require("express")
const app_admin = require('express')();
const server_admin = require('http').Server(app_admin);
const cors = require('cors')
const Session = require('express-session')
const bodyParser = require("body-parser")

const cors_origin = process.env.cors_origin.split(' ')
var corsOptions = {
    credentials: true,
    origin: cors_origin
}
app_admin.use(cors(corsOptions))

app_admin.use(bodyParser.json({ limit: '5mb', extended: true }))

app_admin.use(Session({
    secret: 'admin_session_secret',
    saveUninitialized: false,
    resave: true,
}))

server_admin.listen(process.env.service_port_admin)