---
name: deploy-update
description: Actualizar un despliegue existente en producción vía SSH con script autónomo.
requires: [deploy-produccion]
---

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

### Requisitos del servidor remoto

- Si se usa `--run-as`, el usuario SSH debe tener permisos **sudo sin contraseña** para `chown` (corre como el usuario SSH) y para `sudo -u <run-as>`. Configurar en `/etc/sudoers.d/`:
  ```
  deploy ALL=(nodeapp) NOPASSWD: ALL
  ```
  (donde `deploy` es el usuario SSH y `nodeapp` el valor de `--run-as`)

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
| `-r` `--run-as` | `--run-as=USUARIO` | Usuario dueño del deploy: ejecuta `chown -R`, npm, knex y pm2 vía `sudo -u` (opcional, si se omite pregunta y puede dejarse vacío para usar el usuario SSH) |
| `--git-user=USUARIO` | | Usuario de GitHub para autenticación en repos privados vía HTTPS (requiere `--git-token`) |
| `--git-token=TOKEN` | | Token personal de GitHub (classic PAT con acceso al repo) para autenticación (requiere `--git-user`) |
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

# Con --run-as: hace chown del directorio y ejecuta npm, knex y pm2 como otro usuario vía sudo
bash .opencode/skills/deploy-update/scripts/deploy-update.sh \
  --host=123.123.123.123 \
  --user=deploy \
  --key=~/claves/mi-server.pem \
  --branch=main \
  --deploy-path=/var/www/mi-app \
  --pm2-name=mi-app \
  --run-as=nodeapp

# Con repositorio privado y --git-user/--git-token
bash .opencode/skills/deploy-update/scripts/deploy-update.sh \
  --host=123.123.123.123 \
  --user=deploy \
  --key=~/claves/mi-server.pem \
  --branch=main \
  --deploy-path=/var/www/mi-app \
  --pm2-name=mi-app \
  --run-as=nodeapp \
  --git-user=mi-usuario \
  --git-token=ghp_xxxxx
```

### Flujo del script

1. **Valida** credenciales y requisitos locales
2. **Pregunta** rama, ruta, nombre PM2 y usuario de ejecución si no se pasaron como flags
3. **Conecta** vía SSH al servidor y ejecuta:
    - `git stash` — guarda cambios locales no commiteados
    - `git checkout <branch>` y `git pull origin <branch>` — si se proporcionaron `--git-user` y `--git-token`, se configura `credential.helper store` y se aprueban las credenciales vía `git credential approve` antes del pull (sin URL injection)
   - `chown -R <run-as>:<run-as> <deploy-path>` (solo si se especificó `--run-as`, corre como el usuario SSH)
   - `npm install` en `backend/` y `frontend/` (con `sudo -u <run-as>` si se especificó)
   - `npm run build` en `frontend/`
   - `npx knex migrate:latest` en `backend/` (con `sudo -u <run-as>` si se especificó)
   - `pm2 restart <nombre>` + `pm2 list` (con `sudo -u <run-as>` si se especificó)
4. **Muestra** el estado final de PM2

### Notas

- El script no configura Nginx, SSL, .env ni BD. Para el despliegue inicial usar `deploy-produccion`.
- La contraseña se almacena en un archivo temporal (`mktemp`) y se elimina al finalizar, sin exponerse en la lista de procesos.
- Si el `git stash` no encuentra cambios locales, no falla — continúa normalmente.
- El remote URL del repositorio **no debe llevar credenciales embebidas** en la URL. La autenticación se realiza exclusivamente vía `git credential approve` + `credential.helper store`, sin modificar el remote URL.
- Se eliminó `2>/dev/null` del `git credential approve` para que los errores de autenticación sean visibles en la salida del script (antes se ocultaban silenciosamente).
- Las credenciales de git quedan almacenadas en el git store local del repositorio (`~/.git-credentials` en el servidor remoto) para futuros pulls automáticos.

### Reglas para generación de scripts

- **Prohibido usar parámetros posicionales (`$1`, `$2`, `$@`, etc.)** al generar scripts. Usar siempre variables con nombre (`--flag=valor` o variables de entorno).
- Usar siempre `git config credential.helper store && printf 'protocol=https\nhost=github.com\nusername=...\npassword=...\n' | git credential approve` para autenticación en repositorios privados. **No inyectar credenciales en la URL remota.**
