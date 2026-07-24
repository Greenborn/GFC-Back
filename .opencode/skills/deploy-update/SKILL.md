# Skill: deploy-update

Actualizar un despliegue existente en producción vía SSH. Este skill **requiere** que el despliegue inicial se haya realizado con el skill `deploy-produccion`.

---

## Script: `deploy-update.sh`

El script se encuentra en `scripts/deploy-update.sh` dentro de este skill. Es autónomo y puede ejecutarse directamente en cualquier máquina que tenga acceso al servidor de producción.

### Requisitos locales

- **Bash 4+** (Linux, macOS, WSL)
- **SSH** cliente instalado
- Si se usa autenticación por contraseña: `sshpass` instalado (`sudo apt install sshpass`)
- Si se usa `.pem`: permisos `600` en el archivo de clave

### Parámetros

| Flag | Formato `--var=valor` | Descripción |
|------|----------------------|-------------|
| `-h` `--host` | `--host=IP` | IP o dominio del servidor (requerido) |
| `-u` `--user` | `--user=USUARIO` | Usuario SSH (requerido) |
| `-p` `--port` | `--port=PUERTO` | Puerto SSH (default: 22) |
| `-P` `--password` | `--password=CLAVE` | Contraseña SSH (alternativa a -k) |
| `-k` `--key` | `--key=RUTA` | Ruta a archivo .pem (alternativa a -P) |
| `-b` `--branch` | `--branch=RAMA` | Rama de git a desplegar (si se omite, pregunta) |
| `-d` `--deploy-path` | `--deploy-path=RUTA` | Ruta de instalación en el servidor (si se omite, pregunta) |
| `-n` `--pm2-name` | `--pm2-name=NOMBRE` | Nombre del proceso en PM2 (si se omite, pregunta) |

### Uso

```bash
# Con --variable=valor
bash .opencode/skills/deploy-update/scripts/deploy-update.sh \
  --host=123.123.123.123 \
  --user=root \
  --key=~/claves/mi-server.pem \
  --branch=main \
  --deploy-path=/var/www/mi-app \
  --pm2-name=mi-app

# Con flags cortos y contraseña
bash .opencode/skills/deploy-update/scripts/deploy-update.sh \
  -h midominio.com \
  -u deploy \
  -P 'MiPasswordSegura' \
  -p 2222

# Mixto: algunos con --var=valor, otros interactivos
bash .opencode/skills/deploy-update/scripts/deploy-update.sh \
  --host=midominio.com \
  --user=deploy \
  --password='MiPasswordSegura'
```

### Flujo del script

1. **Valida** credenciales y requisitos locales
2. **Pregunta** rama, ruta y nombre PM2 si no se pasaron como flags
3. **Conecta** vía SSH al servidor y ejecuta:
   - `git stash` — guarda cambios locales no commiteados
   - `git checkout <branch>` y `git pull origin <branch>`
   - `npm install` en `backend/` y `frontend/`
   - `npm run build` en `frontend/`
   - `pm2 restart <nombre>` + `pm2 list`
4. **Muestra** el estado final de PM2

### Notas

- El script no configura Nginx, SSL, .env ni BD. Para el despliegue inicial usar `deploy-produccion`.
- La contraseña se almacena en un archivo temporal (`mktemp`) y se elimina al finalizar, sin exponerse en la lista de procesos.
- Si el `git stash` no encuentra cambios locales, no falla — continúa normalmente.
- Cada paso crítico detiene el script si falla (`set -euo pipefail` en remoto).
