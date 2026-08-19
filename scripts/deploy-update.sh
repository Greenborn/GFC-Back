#!/bin/bash

set -euo pipefail

# ──────────────────────────────────────────
# deploy-update.sh — Actualización de producción
# ──────────────────────────────────────────

USAGE="Uso: $0 --host=IP --user=USUARIO --password=CLAVE [--port=22] [--branch=master] [--deploy-path=/ruta] [--pm2-name=gfc-api] [--skip-bump]"

# ──────────────────────────────────────────
# Bump automático de versión (+0.0.1) en node_api/package.json
# ──────────────────────────────────────────
BUMP_ENABLED=1

for arg in "$@"; do
  case "$arg" in
    -h=*|--host=*) HOST="${arg#*=}" ;;
    -u=*|--user=*) USER="${arg#*=}" ;;
    -P=*|--password=*) PASSWORD="${arg#*=}" ;;
    -k=*|--key=*) KEY="${arg#*=}" ;;
    -p=*|--port=*) PORT="${arg#*=}" ;;
    -b=*|--branch=*) BRANCH="${arg#*=}" ;;
    -d=*|--deploy-path=*) DEPLOY_PATH="${arg#*=}" ;;
    -n=*|--pm2-name=*) PM2_NAME="${arg#*=}" ;;
    --skip-bump) BUMP_ENABLED=0 ;;
    --help) echo "$USAGE"; exit 0 ;;
    *) echo "Error: flag desconocido: $arg"; echo "$USAGE"; exit 1 ;;
  esac
done

: "${HOST:?Error: --host es requerido}"
: "${USER:?Error: --user es requerido}"
: "${PORT:=22}"
: "${BRANCH:=master}"
: "${PM2_NAME:=gfc-api}"

if [ -z "${PASSWORD-}" ] && [ -z "${KEY-}" ]; then
  echo "Error: debe especificar --password o --key"
  exit 1
fi

if [ -z "${DEPLOY_PATH-}" ]; then
  read -rp "Ruta de instalación en el servidor [/var/www/GFC-Back]: " DEPLOY_PATH
  DEPLOY_PATH="${DEPLOY_PATH:-/var/www/GFC-Back}"
fi

# Verificar requisitos locales
SSH_CMD="ssh -p $PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10"
if [ -n "${KEY-}" ]; then
  chmod 600 "$KEY" 2>/dev/null || true
  SSH_CMD="$SSH_CMD -i $KEY"
elif command -v sshpass &>/dev/null; then
  SSH_CMD="sshpass -p '$PASSWORD' $SSH_CMD"
else
  echo "Error: sshpass no está instalado. Instálelo o use --key."
  exit 1
fi

echo "========================================"
echo "  Actualizando producción"
echo "  Host:    $HOST:$PORT"
echo "  Usuario: $USER"
echo "  Ruta:    $DEPLOY_PATH"
echo "  Rama:    $BRANCH"
echo "  PM2:     $PM2_NAME"
echo "========================================"

# ──────────────────────────────────────────
# Fase 0: bump automático de versión (+0.0.1) local + push
# ──────────────────────────────────────────
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
PKG="$REPO_ROOT/node_api/package.json"

if [ "$BUMP_ENABLED" -eq 0 ]; then
  echo "[0/6] Bump de versión desactivado (--skip-bump)"
elif [ ! -f "$PKG" ]; then
  echo "[0/6] WARNING: no se encontró node_api/package.json en $REPO_ROOT; se omite el bump"
else
  echo "[0/6] Bump automático de versión (+0.0.1)..."
  node -e 'const fs=require("fs");const f=process.argv[1];const p=JSON.parse(fs.readFileSync(f,"utf8"));const v=p.version.split(".");v[2]=String(Number(v[2])+1);p.version=v.join(".");fs.writeFileSync(f,JSON.stringify(p,null,2)+"\n");console.log("  node_api/package.json ->",p.version)' "$PKG"
  (
    cd "$REPO_ROOT" || exit 1
    git add node_api/package.json
    if git commit -m 'chore: bump versión (+0.0.1)' >/dev/null 2>&1; then
      echo "  Commit local creado"
      if git push origin "$BRANCH" >/dev/null 2>&1; then
        echo "  Bump pusheado a origin/$BRANCH"
      else
        echo "  WARNING: no se pudo hacer push del bump (el servidor podría no recibirlo)"
      fi
    else
      echo "  Sin cambios de versión para commitear (¿ya bumpado?)"
    fi
  )
fi

# ──────────────────────────────────────────
# Comandos remotos
# ──────────────────────────────────────────
REMOTE_CMDS=$(cat <<SCRIPT
  set -euo pipefail

  echo "[1/5] Accediendo a $DEPLOY_PATH..."
  cd "$DEPLOY_PATH"

  echo "[2/5] Actualizando código (rama: $BRANCH)..."
  git fetch origin "$BRANCH"
  git checkout -f "$BRANCH"
  git reset --hard "origin/$BRANCH"

  echo "[3/5] Instalando dependencias..."
  cd node_api
  npm install

  echo "[4/5] Ejecutando migraciones..."
  npx knex migrate:latest

  echo "[5/5] Reiniciando servicio..."
  pm2 restart "$PM2_NAME" --update-env
  pm2 list

  echo ""
  echo "=== Actualización completada ==="
SCRIPT
)

if [ -n "${KEY-}" ]; then
  ssh -t -p "$PORT" -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" "bash -s" <<<"$REMOTE_CMDS"
else
  sshpass -p "$PASSWORD" ssh -t -p "$PORT" -o StrictHostKeyChecking=no "$USER@$HOST" "bash -s" <<<"$REMOTE_CMDS"
fi

echo "========================================"
echo "  Estado final de PM2 en $HOST"
echo "========================================"
if [ -n "${KEY-}" ]; then
  ssh -p "$PORT" -i "$KEY" -o StrictHostKeyChecking=no "$USER@$HOST" "pm2 status"
else
  sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$HOST" "pm2 status"
fi
