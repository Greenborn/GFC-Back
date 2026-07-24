---
name: deploy-produccion
description: Configurar una instancia productiva en un servidor: SSH, clonar repo, .env, BD, Nginx, SSL, PM2 y verificación de permisos.
requires: [init-backend-nodejs, init-frontend-vuejs]
---

# Skill: Configurar instancia productiva

Usar cuando el usuario pida **desplegar una aplicación en producción**, configurar un servidor, hacer deploy, o preparar una instancia productiva desde cero.

---

## 0. Preguntar datos de conexión SSH

Usar la herramienta `question` para recolectar credenciales SSH. Primero host, puerto y usuario:

```
<question>
Pregunta: Ingresa el host del servidor (IP o dominio)
Header: Host SSH
```

```
<question>
Pregunta: Puerto SSH
Header: Puerto SSH
Options:
  - 22 (Recommended)
```

```
<question>
Pregunta: Usuario SSH
Header: Usuario SSH
```

Luego preguntar el método de autenticación:

```
<question>
Pregunta: Método de autenticación SSH
Header: Auth SSH
Options:
  - Archivo .pem
  - Contraseña
```

Si elige `.pem`:

```
<question>
Pregunta: Ruta local al archivo .pem (ej: /home/user/mi-key.pem)
Header: Ruta .pem
```

Validar que el archivo existe con `test -f "<ruta>"`. Si no existe, mostrar error y pedir de nuevo.
Si existe pero los permisos no son `600`, sugerir ejecutar `chmod 600 "<ruta>"`.

Si elige `Contraseña`:

```
<question>
Pregunta: Contraseña SSH del usuario <usuario>
Header: Password SSH
```

### Almacenar variables SSH

Guardar en variables para uso posterior:

```bash
SSH_HOST="<host>"
SSH_PORT="<puerto>"
SSH_USER="<usuario>"
SSH_KEY="<ruta-pem>"        # solo si aplica
SSH_PASS="<password>"        # solo si aplica
```

Comando SSH base:

```bash
# Si usa .pem:
SSH_CMD="ssh -p $SSH_PORT -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SSH_USER@$SSH_HOST"

# Si usa password (requiere sshpass):
SSH_CMD="sshpass -p '$SSH_PASS' ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $SSH_USER@$SSH_HOST"
```

Si se usa password, verificar que `sshpass` esté instalado localmente:

```bash
which sshpass || echo "ERROR: sshpass no instalado. Instalar con: apt install sshpass"
```

---

## 1. Preguntar datos del repositorio

```
<question>
Pregunta: URL del repositorio GitHub (formato HTTPS: https://github.com/usuario/repo.git)
Header: Repo URL
```

```
<question>
Pregunta: Usuario de GitHub
Header: GitHub User
```

```
<question>
Pregunta: GitHub Personal Access Token (con permisos de repo)
Header: GitHub Token
```

```
<question>
Pregunta: Rama a desplegar
Header: Rama
Options:
  - main (Recommended)
  - master
  - develop
```

> Si se elige otra rama, preguntar manualmente el nombre.

### Almacenar variables de repo

```bash
REPO_URL="<url>"
GITHUB_USER="<usuario>"
GITHUB_TOKEN="<token>"
GIT_BRANCH="<rama>"
```

Construir URL autenticada:

```bash
REPO_AUTH_URL="https://${GITHUB_USER}:${GITHUB_TOKEN}@${REPO_URL#https://}"
```

---

## 2. Preguntar ubicación de despliegue

```
<question>
Pregunta: Ruta base en el servidor para el proyecto
Header: Ruta base
Options:
  - /var/www/ (Recommended)
```

Si se elige otra ruta, preguntar manualmente:

```
<question>
Pregunta: Ruta base personalizada (ej: /home/usuario/apps)
Header: Ruta personalizada
```

```
<question>
Pregunta: Nombre del proyecto (directorio dentro de la ruta base)
Header: Nombre proyecto
```

### Almacenar variables de ruta

```bash
DEPLOY_BASE="<ruta-base>"
PROJECT_NAME="<nombre-proyecto>"
DEPLOY_PATH="${DEPLOY_BASE}/${PROJECT_NAME}"
```

Crear el directorio remoto si no existe:

```bash
$SSH_CMD "mkdir -p $DEPLOY_PATH"
```

Verificar que se creó correctamente:

```bash
$SSH_CMD "test -d $DEPLOY_PATH && echo OK || echo ERROR"
```

Si devuelve `ERROR`, abortar con mensaje de error.

---

## 3. Clonar repositorio en el servidor

Verificar si el directorio ya existe y no está vacío:

```bash
$SSH_CMD "test -d ${DEPLOY_PATH}/.git && echo EXISTE || echo VACIO"
```

Si el repo ya existe (`.git` presente):

```
<question>
Pregunta: El directorio ya contiene un repo. ¿Deseas hacer git pull en lugar de clonar?
Header: Repo existente
Options:
  - Si, hacer git pull
  - No, sobrescribir (eliminar y clonar)
```

**Si git pull:**

```bash
$SSH_CMD "cd $DEPLOY_PATH && git fetch origin && git checkout $GIT_BRANCH && git pull origin $GIT_BRANCH"
```

**Si clonar desde cero:**

```bash
$SSH_CMD "rm -rf $DEPLOY_PATH && git clone --branch $GIT_BRANCH $REPO_AUTH_URL $DEPLOY_PATH"
```

Validar que el clonado fue exitoso:

```bash
$SSH_CMD "test -d ${DEPLOY_PATH}/.git && echo OK || echo ERROR"
```

Si devuelve `ERROR`, abortar con mensaje de error.

> **Seguridad:** Limpiar la URL con token del historial de bash después de usarla. No persistir el token en variables de entorno.

---

## 4. Solicitar y escribir backend `.env`

Detectar si existe directorio backend:

```bash
$SSH_CMD "test -d ${DEPLOY_PATH}/backend && echo BACKEND || echo NO_BACKEND"
```

Si no existe backend, saltar este paso y el paso 5 (BD).

### Preguntar variables del backend

```
<question>
Pregunta: Puerto del servidor backend
Header: Backend PORT
Options:
  - 4000 (Recommended)
```

```
<question>
Pregunta: Origen CORS (dominio frontend o *)
Header: CORS_ORIGIN
Options:
  - *
```

```
<question>
Pregunta: Host de base de datos
Header: DB_HOST
Options:
  - localhost (Recommended)
```

```
<question>
Pregunta: Puerto de base de datos
Header: DB_PORT
Options:
  - 3306 (Recommended)
```

```
<question>
Pregunta: Usuario de base de datos
Header: DB_USER
```

```
<question>
Pregunta: Contraseña del usuario de base de datos
Header: DB_PASSWORD
```

```
<question>
Pregunta: Nombre de la base de datos
Header: DB_NAME
```

```
<question>
Pregunta: JWT Secret (dejar vacío para generar uno automáticamente)
Header: JWT_SECRET
```

Si se deja vacío, generar uno:

```bash
JWT_SECRET=$(openssl rand -base64 32)
```

```
<question>
Pregunta: Expiración del token JWT
Header: JWT_EXPIRES_IN
Options:
  - 8h (Recommended)
  - 24h
  - 7d
```

```
<question>
Pregunta: Usuario root de BD (para crear BD y usuario)
Header: DB_ROOT_USER
Options:
  - root (Recommended)
```

```
<question>
Pregunta: Contraseña del usuario root de BD
Header: DB_ROOT_PASSWORD
```

### Escribir `.env` en el servidor

Construir contenido del `.env`:

```bash
ENV_CONTENT="PORT=${BACKEND_PORT}
CORS_ORIGIN=${CORS_ORIGIN}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_ROOT_USER=${DB_ROOT_USER}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}"
```

Escribir vía SSH:

```bash
# Escapar para SSH
ENV_ESCAPED=$(printf '%s\n' "$ENV_CONTENT" | sed 's/"/\\"/g')
$SSH_CMD "cat > ${DEPLOY_PATH}/backend/.env << 'EOF'
${ENV_CONTENT}
EOF"
```

También crear `.env.example` como copia (omitiendo valores sensibles):

```bash
$SSH_CMD "cat > ${DEPLOY_PATH}/backend/.env.example << 'EOF'
PORT=4000
CORS_ORIGIN=*
JWT_SECRET=mi_secreto_jwt
JWT_EXPIRES_IN=8h
DB_HOST=localhost
DB_PORT=3306
DB_USER=mi_usuario
DB_PASSWORD=mi_password
DB_NAME=mi_app
DB_ROOT_USER=root
DB_ROOT_PASSWORD=
EOF"
```

### Instalar dependencias del backend

```bash
$SSH_CMD "cd ${DEPLOY_PATH}/backend && npm install"
```

Si falla, mostrar error y preguntar si continuar.

### Configurar PM2 para el backend

Instalar PM2 globalmente y crear archivo de configuración:

```bash
$SSH_CMD "npm install -g pm2 2>&1"
```

Crear `ecosystem.config.js` en el backend:

```bash
$SSH_CMD "cat > ${DEPLOY_PATH}/backend/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: 'src/index.js',
    cwd: '${DEPLOY_PATH}/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
PM2EOF"
```

Iniciar el backend con PM2:

```bash
$SSH_CMD "cd ${DEPLOY_PATH}/backend && pm2 start ecosystem.config.js 2>&1"
```

Guardar la lista de procesos para que persista entre reinicios:

```bash
$SSH_CMD "pm2 save 2>&1"
```

Configurar PM2 para iniciar automáticamente al arrancar el sistema:

```bash
$SSH_CMD "pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER 2>&1"
```

Verificar que el proceso está corriendo:

```bash
$SSH_CMD "pm2 list 2>&1"
```

Si el proceso no aparece o está en `errored`, mostrar el error y preguntar si continuar.

---

## 5. Crear base de datos y usuario

Verificar que MySQL/MariaDB está accesible en el servidor:

```bash
$SSH_CMD "which mysql && echo OK || echo NO_MYSQL"
```

Si devuelve `NO_MYSQL`, abortar con mensaje para instalar MySQL/MariaDB.

### Crear script SQL temporal

Ejecutar comandos MySQL vía SSH:

```bash
$SSH_CMD "mysql -u ${DB_ROOT_USER} -p${DB_ROOT_PASSWORD} -h ${DB_HOST} -P ${DB_PORT} -e \"
CREATE DATABASE IF NOT EXISTS \\\`${DB_NAME}\\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \\\`${DB_NAME}\\\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
\" 2>&1"
```

> **Nota:** El escapado de comillas puede variar según la shell. Alternativa segura: escribir un archivo SQL temporal en el servidor y ejecutarlo.

Alternativa con archivo SQL (más confiable):

```bash
$SSH_CMD "cat > /tmp/setup-db.sql << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQLEOF"

$SSH_CMD "mysql -u ${DB_ROOT_USER} -p${DB_ROOT_PASSWORD} -h ${DB_HOST} -P ${DB_PORT} < /tmp/setup-db.sql 2>&1"

$SSH_CMD "rm /tmp/setup-db.sql"
```

Verificar que la BD se creó:

```bash
$SSH_CMD "mysql -u ${DB_ROOT_USER} -p${DB_ROOT_PASSWORD} -h ${DB_HOST} -P ${DB_PORT} -e \"SHOW DATABASES LIKE '${DB_NAME}';\" 2>&1"
```

Si no aparece, mostrar error y abortar.

---

## 6. Preguntar subdominio y configurar Nginx para backend

```
<question>
Pregunta: Subdominio para el backend (ej: api.misitio.com)
Header: Subdominio backend
```

```
<question>
Pregunta: Correo electrónico para Let's Encrypt SSL
Header: Email SSL
```

```
<question>
Pregunta: ¿Deseas configurar SSL con certbot?
Header: Configurar SSL
Options:
  - Si (Recommended)
  - No, solo HTTP
```

### Crear configuración Nginx para backend

Construir archivo de sitio:

```bash
NGINX_BACKEND_SERVER="server {
    listen 80;
    server_name ${BACKEND_SUBDOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}"
```

Escribir en servidor:

```bash
$SSH_CMD "cat > /etc/nginx/sites-available/${PROJECT_NAME}-backend << 'NGINXEOF'
${NGINX_BACKEND_SERVER}
NGINXEOF"
```

Habilitar sitio:

```bash
$SSH_CMD "ln -sf /etc/nginx/sites-available/${PROJECT_NAME}-backend /etc/nginx/sites-enabled/"
```

Verificar sintaxis de Nginx:

```bash
$SSH_CMD "nginx -t 2>&1"
```

Si hay error, mostrar el mensaje y abortar.

### Configurar SSL con certbot (opcional)

Si el usuario eligió SSL:

```bash
$SSH_CMD "certbot --nginx -d ${BACKEND_SUBDOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL} 2>&1"
```

Si certbot no está instalado:

```bash
$SSH_CMD "which certbot || echo NO_CERTBOT"
```

Si devuelve `NO_CERTBOT`, preguntar:

```
<question>
Pregunta: certbot no está instalado. ¿Deseas instalarlo?
Header: Instalar certbot
Options:
  - Si, instalar y continuar
  - No, omitir SSL por ahora
```

**Si instalar:**

```bash
$SSH_CMD "apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx 2>&1"
$SSH_CMD "certbot --nginx -d ${BACKEND_SUBDOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL} 2>&1"
```

---

## 7. Configurar frontend `.env` según subdominio

Detectar si existe directorio frontend:

```bash
$SSH_CMD "test -d ${DEPLOY_PATH}/frontend && echo FRONTEND || echo NO_FRONTEND"
```

Si no existe frontend, saltar este paso y el paso 8.

```
<question>
Pregunta: Subdominio para el frontend (ej: app.misitio.com). Puede ser el mismo que el backend.
Header: Subdominio frontend
```

Construir `VITE_API_URL`:

```bash
# Si SSL está configurado:
VITE_API_URL="https://${BACKEND_SUBDOMAIN}"

# Si no hay SSL:
VITE_API_URL="http://${BACKEND_SUBDOMAIN}"
```

Escribir `.env` del frontend:

```bash
$SSH_CMD "cat > ${DEPLOY_PATH}/frontend/.env << 'EOF'
VITE_API_URL=${VITE_API_URL}
EOF"
```

También crear `.env.example`:

```bash
$SSH_CMD "cat > ${DEPLOY_PATH}/frontend/.env.example << 'EOF'
VITE_API_URL=http://localhost:4000
EOF"
```

---

## 8. Construir frontend y configurar Nginx

### Instalar dependencias y construir

```bash
$SSH_CMD "cd ${DEPLOY_PATH}/frontend && npm install 2>&1"
```

Si falla, mostrar error y preguntar si continuar.

```bash
$SSH_CMD "cd ${DEPLOY_PATH}/frontend && npm run build 2>&1"
```

Verificar que se generó `dist/`:

```bash
$SSH_CMD "test -d ${DEPLOY_PATH}/frontend/dist && echo OK || echo NO_DIST"
```

Si devuelve `NO_DIST`, abortar con error.

### Crear configuración Nginx para frontend

```bash
NGINX_FRONTEND_SERVER="server {
    listen 80;
    server_name ${FRONTEND_SUBDOMAIN};
    root ${DEPLOY_PATH}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}"
```

Escribir en servidor:

```bash
$SSH_CMD "cat > /etc/nginx/sites-available/${PROJECT_NAME}-frontend << 'NGINXEOF'
${NGINX_FRONTEND_SERVER}
NGINXEOF"
```

Habilitar sitio:

```bash
$SSH_CMD "ln -sf /etc/nginx/sites-available/${PROJECT_NAME}-frontend /etc/nginx/sites-enabled/"
```

Verificar sintaxis de Nginx:

```bash
$SSH_CMD "nginx -t 2>&1"
```

### Configurar SSL para frontend (opcional)

Si el usuario eligió SSL:

```bash
$SSH_CMD "certbot --nginx -d ${FRONTEND_SUBDOMAIN} --non-interactive --agree-tos --email ${SSL_EMAIL} 2>&1"
```

### Recargar Nginx

```bash
$SSH_CMD "systemctl reload nginx 2>&1 || nginx -s reload 2>&1"
```

---

## 9. Verificar permisos del repositorio

### Verificar propietario actual

```bash
$SSH_CMD "ls -la ${DEPLOY_PATH} | head -5"
```

```bash
$SSH_CMD "stat -c '%U:%G' ${DEPLOY_PATH} 2>&1"
```

### Verificar permisos de archivos

```bash
$SSH_CMD "find ${DEPLOY_PATH} -maxdepth 1 -type f -exec ls -la {} \;"
```

### Verificar permisos de directorios clave

```bash
$SSH_CMD "ls -la ${DEPLOY_PATH}/backend/.env 2>/dev/null && echo 'Backend .env OK' || echo 'No backend .env'"
$SSH_CMD "ls -la ${DEPLOY_PATH}/frontend/.env 2>/dev/null && echo 'Frontend .env OK' || echo 'No frontend .env'"
$SSH_CMD "ls -la ${DEPLOY_PATH}/frontend/dist 2>/dev/null && echo 'Frontend dist OK' || echo 'No frontend dist'"
```

### Sugerir corrección de permisos

Si el usuario SSH no es `www-data`:

```
<question>
Pregunta: ¿Deseas cambiar el propietario a www-data para Nginx?
Header: Corregir permisos
Options:
  - Si, chown -R www-data:www-data (Recommended)
  - No, mantener usuario actual
```

Si elige sí:

```bash
$SSH_CMD "chown -R www-data:www-data ${DEPLOY_PATH} 2>&1"
$SSH_CMD "chmod -R 755 ${DEPLOY_PATH} 2>&1"
$SSH_CMD "chmod 640 ${DEPLOY_PATH}/backend/.env 2>/dev/null"
$SSH_CMD "chmod 640 ${DEPLOY_PATH}/frontend/.env 2>/dev/null"
```

> **Importante:** Los archivos `.env` deben tener permisos restrictivos (640 o 600) para que solo el propietario y grupo puedan leerlos.

### Verificar resultado final

```bash
$SSH_CMD "stat -c '%U:%G %a %n' ${DEPLOY_PATH} ${DEPLOY_PATH}/backend/.env ${DEPLOY_PATH}/frontend/.env ${DEPLOY_PATH}/frontend/dist 2>/dev/null"
```

---

## 10. Resumen final

Mostrar al usuario un resumen con la siguiente información:

```
=============================================
  DESPLIEGUE COMPLETADO
=============================================

  Proyecto:     ${PROJECT_NAME}
  Ruta:         ${DEPLOY_PATH}

  Backend:
    URL:        http://${BACKEND_SUBDOMAIN} (o https)
    Puerto:     ${BACKEND_PORT}
    .env:       ${DEPLOY_PATH}/backend/.env

  Frontend:
    URL:        http://${FRONTEND_SUBDOMAIN} (o https)
    .env:       ${DEPLOY_PATH}/frontend/.env

  Base de datos:
    Nombre:     ${DB_NAME}
    Usuario:    ${DB_USER}

  Comandos útiles:
    Recargar Nginx:              nginx -s reload
    Ver logs Nginx:              journalctl -u nginx --no-pager -n 50
    Ver logs backend:            pm2 logs ${PROJECT_NAME} --lines 50
    Monitorear backend:          pm2 monit
    Iniciar backend:             pm2 start ${DEPLOY_PATH}/backend/ecosystem.config.js
    Detener backend:             pm2 stop ${PROJECT_NAME}
    Reiniciar backend:           pm2 restart ${PROJECT_NAME}
    Ver estado procesos PM2:     pm2 list
    Persistir procesos PM2:      pm2 save

  SSL:
    Backend:    ${SSL_BACKEND_STATUS}
    Frontend:   ${SSL_FRONTEND_STATUS}

=============================================
```

---

## Notas adicionales

### Gestión con PM2 (incluido por defecto)

El backend se configura automáticamente con PM2 durante el paso 4. PM2 ofrece:

- **Reinicio automático** ante caídas
- **Persistencia entre reinicios** del servidor (vía `pm2 startup`)
- **Logs** centralizados con `pm2 logs`
- **Monitoreo** en tiempo real con `pm2 monit`
- **Escalado** sencillo (cambiar `instances` en `ecosystem.config.js`)

Comandos útiles para el administrador:

```bash
# Ver logs en tiempo real
pm2 logs ${PROJECT_NAME}

# Ver últimas 50 líneas
pm2 logs ${PROJECT_NAME} --lines 50

# Monitoreo interactivo
pm2 monit

# Reiniciar después de un deploy
pm2 restart ${PROJECT_NAME}

# Detener
pm2 stop ${PROJECT_NAME}

# Ver todos los procesos
pm2 list

# Guardar estado actual (después de cambios en PM2)
pm2 save
```

Si se necesita modificar la configuración, editar `ecosystem.config.js` en el servidor y reiniciar:

```bash
$SSH_CMD "cd ${DEPLOY_PATH}/backend && pm2 restart ecosystem.config.js"
```

### Verificar estado final del backend

```bash
$SSH_CMD "curl -s http://127.0.0.1:${BACKEND_PORT}/health 2>&1"
```

Si el endpoint `/health` responde, el backend está funcionando correctamente.

### Firewall (ufw)

Si el usuario lo solicita, abrir puertos:

```bash
$SSH_CMD "ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable 2>&1"
```

---

## Verificación obligatoria post-despliegue

Ejecutar los siguientes comandos SSH en orden y **confirmar que cada uno devuelva el resultado esperado**. Si algún comando falla, abortar y notificar el error.

| # | Comando SSH | Resultado esperado |
|---|-------------|-------------------|
| 1 | `$SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${BACKEND_PORT}/health"` | `200` (backend vivo) |
| 2 | `$SSH_CMD "pm2 list 2>&1"` | El proceso `${PROJECT_NAME}` aparece como `online` |
| 3 | `$SSH_CMD "mysql -u ${DB_ROOT_USER} -p${DB_ROOT_PASSWORD} -e \"SHOW DATABASES LIKE '${DB_NAME}';\" 2>&1"` | La BD `${DB_NAME}` aparece listada |
| 4 | `$SSH_CMD "nginx -t 2>&1"` | `syntax is ok` y `test is successful` |
| 5 | `$SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://${BACKEND_SUBDOMAIN}/health"` | `200` (backend via Nginx) |
| 6 | `$SSH_CMD "test -d ${DEPLOY_PATH}/frontend/dist && echo OK"` | `OK` (frontend compilado) |
| 7 | `$SSH_CMD "stat -c '%U:%G %a' ${DEPLOY_PATH}/backend/.env 2>/dev/null"` | `www-data:www-data 640` o según lo configurado |
| 8 | Si SSL configurado: `$SSH_CMD "curl -s -o /dev/null -w '%{http_code}' https://${BACKEND_SUBDOMAIN}/health"` | `200` (SSL funcional) |
| 9 | Si frontend: `$SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://${FRONTEND_SUBDOMAIN}"` | `200` (frontend sirviendo) |

Si SSL está configurado, verificar también:
- `$SSH_CMD "echo | openssl s_client -connect ${BACKEND_SUBDOMAIN}:443 -servername ${BACKEND_SUBDOMAIN} 2>/dev/null \| openssl x509 -noout -dates"` → Certificado con fechas válidas

**Nota:** Esta verificación debe ejecutarse **inmediatamente después del paso 9** y antes de dar por terminado el despliegue.

## Reglas obligatorias

1. **No exponer tokens o contraseñas** en la salida del chat. Usar variables para almacenar valores sensibles.
2. **Validar cada paso** antes de continuar al siguiente. Si un paso falla, mostrar el error y preguntar si continuar o abortar.
3. **Eliminar archivos temporales** en el servidor después de usarlos (ej: scripts SQL).
4. **No hardcodear configuraciones** — todo debe ser preguntado al usuario.
5. **Usar `2>&1`** en los comandos SSH para capturar tanto stdout como stderr.
6. **Escapar correctamente** las variables en comandos SSH para evitar problemas con caracteres especiales.
7. **Preguntar siempre antes de sobrescribir** archivos existentes (`.env`, configs Nginx, etc.).
8. **Registrar cada paso** con `echo` descriptivo para que el usuario sepa qué está ocurriendo.
9. **Prohibido `||` como fallback de parámetros** — validar explícitamente cada entrada requerida.
10. **Manejo de errores:** Todo fallo debe mostrar el mensaje de error real del comando. Prohibido `catch {}` vacío o silencioso.
