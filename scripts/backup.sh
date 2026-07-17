#!/bin/bash

# NOTA: No se usa set -e para que errores individuales de scp no maten el script

if [ $# -ne 7 ]; then
    echo "Error: Se requieren 7 parámetros"
    echo "Uso: $0 <SSH_USER> <SSH_HOST> <SSH_PASS> <SSH_PORT> <DB_NAME> <FILES_PATH> <BACKUP_DEST>"
    echo ""
    echo "  SSH_USER     - Usuario SSH del servidor remoto"
    echo "  SSH_HOST     - Host/IP del servidor remoto"
    echo "  SSH_PASS     - Contraseña SSH del servidor remoto"
    echo "  SSH_PORT     - Puerto SSH del servidor remoto"
    echo "  DB_NAME      - Nombre de la base de datos (o connection string postgresql://)"
    echo "  FILES_PATH   - Ruta del directorio de archivos en el servidor remoto"
    echo "  BACKUP_DEST  - Ruta local donde guardar el backup"
    exit 1
fi

SSH_USER="$1"
SSH_HOST="$2"
SSH_PASS="$3"
SSH_PORT="$4"
DB_NAME="$5"
FILES_PATH="$6"
BACKUP_DEST="$7"

for cmd in sshpass rsync pg_dump gzip; do
    if ! command -v $cmd &>/dev/null; then
        echo "Error: $cmd no está instalado. Instálelo e intente de nuevo."
        exit 1
    fi
done

mkdir -p "$BACKUP_DEST"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ──────────────────────────────────────────
# Backup de base de datos
# ──────────────────────────────────────────
if echo "$DB_NAME" | grep -qE '^postgresql://'; then
    DB_LABEL=$(echo "$DB_NAME" | grep -oP '/\K[^/?]+' | tail -1)
else
    DB_LABEL="$DB_NAME"
fi

echo "Iniciando backup de base de datos: $DB_LABEL"
DB_BACKUP_FILE="${BACKUP_DEST}/${DB_LABEL}_backup_${TIMESTAMP}.sql.gz"

if echo "$DB_NAME" | grep -qE '^postgresql://'; then
    pg_dump "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
else
    pg_dump "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
fi

if [ -f "$DB_BACKUP_FILE" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo "Backup de BD completado — ${DB_SIZE}"
else
    echo "Error: Falló el backup de base de datos"
    exit 1
fi

# ──────────────────────────────────────────
# Backup de archivos vía SSH (rsync incremental con reintentos infinitos)
# ──────────────────────────────────────────
REMOTE_DIR_NAME=$(basename "$FILES_PATH")
FILES_BACKUP_DIR="${BACKUP_DEST}/${REMOTE_DIR_NAME}"
mkdir -p "$FILES_BACKUP_DIR"

SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=10 -o ServerAliveCountMax=3"

echo "Sincronizando archivos desde ${SSH_USER}@${SSH_HOST}:${FILES_PATH} → ${FILES_BACKUP_DIR}"

RSYNC_OPTS="-az --partial --append-verify --info=progress2 --delete --compress-level=3 --no-inc-recursive --timeout=120"

RETRY_DELAY=5
while true; do
    if sshpass -p "$SSH_PASS" rsync $RSYNC_OPTS -e "ssh $SSH_OPTS" \
        "${SSH_USER}@${SSH_HOST}:${FILES_PATH}/" \
        "${FILES_BACKUP_DIR}/"; then
        echo "Sincronización de archivos completada"
        break
    fi
    echo "  Conexión interrumpida, reintentando en ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
    RETRY_DELAY=$((RETRY_DELAY * 2))
    [ "$RETRY_DELAY" -gt 60 ] && RETRY_DELAY=60
done

echo "Backup finalizado exitosamente"
echo "  BD:      ${DB_BACKUP_FILE}"
echo "  Archivos: ${FILES_BACKUP_DIR}"
