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
# Backup de archivos vía SSH (archivo por archivo)
# ──────────────────────────────────────────
REMOTE_DIR_NAME=$(basename "$FILES_PATH")
FILES_BACKUP_DIR="${BACKUP_DEST}/${REMOTE_DIR_NAME}_${TIMESTAMP}"
mkdir -p "$FILES_BACKUP_DIR"

SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=10 -o ServerAliveCountMax=3"

echo "Conectando a ${SSH_USER}@${SSH_HOST}:${SSH_PORT} para copiar archivos desde ${FILES_PATH}"

FILE_LIST=$(sshpass -p "$SSH_PASS" ssh $SSH_OPTS "${SSH_USER}@${SSH_HOST}" \
    "find \"${FILES_PATH}\" -type f 2>/dev/null" || true)

if [ -z "$FILE_LIST" ]; then
    echo "Advertencia: No se encontraron archivos en ${FILES_PATH}"
else
    TOTAL_FILES=$(echo "$FILE_LIST" | wc -l)
    COUNT=0
    ERROR_COUNT=0

    while IFS= read -r remote_file; do
        [ -z "$remote_file" ] && continue
        COUNT=$((COUNT + 1))
        rel_path="${remote_file#${FILES_PATH}/}"
        local_file="${FILES_BACKUP_DIR}/${rel_path}"
        local_dir=$(dirname "$local_file")

        mkdir -p "$local_dir"

        echo "[${COUNT}/${TOTAL_FILES}] Copiando: ${rel_path}"

        MAX_RETRIES=10
        RETRY_DELAY=5
        DOWNLOAD_OK=1

        for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
            if sshpass -p "$SSH_PASS" rsync -az --partial -e "ssh $SSH_OPTS" \
                "${SSH_USER}@${SSH_HOST}:${remote_file}" \
                "${local_file}" >/dev/null 2>&1; then
                DOWNLOAD_OK=0
                break
            fi
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo "  Conexión interrumpida, reintentando (${attempt}/${MAX_RETRIES}) en ${RETRY_DELAY}s..."
                sleep "$RETRY_DELAY"
            fi
        done

        if [ $DOWNLOAD_OK -ne 0 ]; then
            echo "  Error: No se pudo copiar ${rel_path} después de ${MAX_RETRIES} intentos"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    done <<< "$FILE_LIST"

    echo "Copia de archivos completada — ${COUNT} archivos procesados, ${ERROR_COUNT} errores → ${FILES_BACKUP_DIR}"
fi

echo "Backup finalizado exitosamente"
echo "  BD:      ${DB_BACKUP_FILE}"
echo "  Archivos: ${FILES_BACKUP_DIR}"
