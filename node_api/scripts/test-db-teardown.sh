#!/usr/bin/env bash
# Elimina la base de datos y el usuario de pruebas creados por test-db-setup.sh.
# Uso manual / CI. En desarrollo normalmente NO es necesario correrlo entre runs.

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

MYSQL_ROOT_ARGS=(-h "$TEST_DB_HOST" -P "$TEST_DB_PORT" -u "$TEST_DB_ROOT_USER")
if [ -n "$TEST_DB_ROOT_PASSWORD" ]; then
    MYSQL_ROOT_ARGS+=(-p"$TEST_DB_ROOT_PASSWORD")
fi

echo "Eliminando base de datos de pruebas '${TEST_DB_NAME}' y usuario '${TEST_DB_USER}'..."

mysql "${MYSQL_ROOT_ARGS[@]}" <<SQL
DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\`;
DROP USER IF EXISTS '${TEST_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "Listo."
