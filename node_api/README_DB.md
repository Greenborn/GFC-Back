# Configuración de Base de Datos - Node.js API

Este proyecto soporta tanto **PostgreSQL** como **MariaDB/MySQL** configurable desde el archivo `.env`.

## Configuración

### 1. Crear archivo `.env`
```bash
cp env.example .env
```

### 2. Configurar variables de entorno

#### Para PostgreSQL:
```env
DB_CLIENT=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=gfc_database
```

#### Para MariaDB/MySQL:
```env
DB_CLIENT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=gfc_database
```

## Variables de Entorno

| Variable | Descripción | Valores | Por Defecto |
|----------|-------------|---------|-------------|
| `DB_CLIENT` | Tipo de base de datos | `postgresql` o `mysql` | `postgresql` |
| `DB_HOST` | Host de la base de datos | IP o hostname | - |
| `DB_PORT` | Puerto de la base de datos | Número de puerto | `5432` (PostgreSQL) / `3306` (MySQL) |
| `DB_USER` | Usuario de la base de datos | Nombre de usuario | - |
| `DB_PASSWORD` | Contraseña de la base de datos | Contraseña | - |
| `DB_NAME` | Nombre de la base de datos | Nombre de la BD | - |

## Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar migraciones
```bash
npm run migrate
```

### 3. Iniciar servidor
```bash
npm start
```

## Verificación

### Health Check
Accede a `http://localhost:3000/health` para verificar:
- Estado del servidor
- Conexión a la base de datos
- Tipo de base de datos configurada
- Información de conexión

### Ejemplo de respuesta del health check:
```json
{
  "status": "healthy",
  "database": {
    "client": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "gfc_database",
    "status": "connected"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Comandos de Migración

```bash
# Ejecutar migraciones pendientes
npm run migrate

# Revertir última migración
npm run migrate:rollback

# Ver estado de migraciones
npm run migrate:status
```

## Notas Importantes

- El proyecto incluye drivers para ambas bases de datos (`pg` para PostgreSQL, `mysql` para MariaDB/MySQL)
- Los puertos por defecto se configuran automáticamente según el cliente seleccionado
- Las migraciones son compatibles con ambos tipos de base de datos
- El health check muestra información detallada sobre la configuración actual 