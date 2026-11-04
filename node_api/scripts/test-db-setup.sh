#!/usr/bin/env bash
# Crea (si no existe) la base de datos y el usuario de pruebas en MariaDB,
# y corre las migraciones de knex contra esa base.
#
# Variables de entorno esperadas (ver node_api/.env.test.example):
#   TEST_DB_ROOT_USER, TEST_DB_ROOT_PASSWORD  -> credenciales admin para crear DB/usuario
#   TEST_DB_HOST, TEST_DB_PORT
#   TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD -> DB/usuario de pruebas a crear

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_API_DIR="$(dirname "$SCRIPT_DIR")"

ENV_TEST_FILE="$NODE_API_DIR/.env.test"
if [ -f "$ENV_TEST_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_TEST_FILE"
    set +a
fi

TEST_DB_ROOT_USER="${TEST_DB_ROOT_USER:-root}"
TEST_DB_ROOT_PASSWORD="${TEST_DB_ROOT_PASSWORD:-}"
TEST_DB_HOST="${TEST_DB_HOST:-127.0.0.1}"
TEST_DB_PORT="${TEST_DB_PORT:-3306}"
TEST_DB_NAME="${TEST_DB_NAME:-gfc_test}"
TEST_DB_USER="${TEST_DB_USER:-gfc_test_user}"
TEST_DB_PASSWORD="${TEST_DB_PASSWORD:-gfc_test_password}"

echo "Configurando base de datos de pruebas MariaDB..."
echo "  Host: ${TEST_DB_HOST}:${TEST_DB_PORT}"
echo "  DB:   ${TEST_DB_NAME}"
echo "  User: ${TEST_DB_USER}"

MYSQL_ROOT_ARGS=(-h "$TEST_DB_HOST" -P "$TEST_DB_PORT" -u "$TEST_DB_ROOT_USER")
if [ -n "$TEST_DB_ROOT_PASSWORD" ]; then
    MYSQL_ROOT_ARGS+=(-p"$TEST_DB_ROOT_PASSWORD")
fi

mysql "${MYSQL_ROOT_ARGS[@]}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${TEST_DB_USER}'@'%' IDENTIFIED BY '${TEST_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${TEST_DB_NAME}\`.* TO '${TEST_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "Base de datos y usuario de pruebas listos."

BASE_SCHEMA_FILE="$NODE_API_DIR/tests/integration/helpers/base-schema.sql"
if [ -f "$BASE_SCHEMA_FILE" ]; then
    echo "Aplicando esquema base (tablas user/role/profile/fotoclub, normalmente creadas por la API PHP)..."
    MYSQL_DB_ARGS=(-h "$TEST_DB_HOST" -P "$TEST_DB_PORT" -u "$TEST_DB_ROOT_USER")
    if [ -n "$TEST_DB_ROOT_PASSWORD" ]; then
        MYSQL_DB_ARGS+=(-p"$TEST_DB_ROOT_PASSWORD")
    fi
    mysql "${MYSQL_DB_ARGS[@]}" "$TEST_DB_NAME" < "$BASE_SCHEMA_FILE"
fi

echo "Ejecutando migraciones de knex contra la base de pruebas..."
cd "$NODE_API_DIR"

DB_CLIENT=mysql \
DB_HOST="$TEST_DB_HOST" \
DB_PORT="$TEST_DB_PORT" \
DB_USER="$TEST_DB_USER" \
DB_PASSWORD="$TEST_DB_PASSWORD" \
DB_NAME="$TEST_DB_NAME" \
npx knex migrate:latest --knexfile knexfile.js

echo "Migraciones aplicadas. Base de pruebas lista para usar."
