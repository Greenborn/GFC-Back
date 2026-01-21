# Test Automatizado de Concursos - PHP API

Este script realiza pruebas automáticas de creación, edición y eliminación de concursos en la API PHP del sistema GFC-Back.

## Requisitos
- Node.js >= 14
- npm

## Instalación

1. Instala las dependencias:
   ```bash
   npm install axios dotenv
   ```

2. Copia el archivo `.env.example` a `.env` y configura las variables:
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales y URL de la API
   ```

## Uso

Ejecuta el script de prueba:

```bash
node test_concurso_php_api.js
```

El script:
- Realiza login con las credenciales configuradas
- Crea un concurso de prueba
- Edita el concurso creado
- Elimina el concurso
- Muestra el resultado de cada operación

## Variables de entorno
- `API_BASE_URL`: URL base de la API PHP (ej: https://api.gfc-back.com/v1)
- `ADMIN_USERNAME`: Usuario admin para login
- `ADMIN_PASSWORD`: Contraseña del usuario admin

## Tests de API Node.js

### test_fotoclub_list_enabled.js
Prueba el comportamiento del filtro de fotoclubes habilitados/deshabilitados en el endpoint `GET /api/fotoclub/get_all`.

**Funcionalidad probada:**
- Por defecto retorna solo fotoclubes con `enabled = true`
- Con parámetro `inc_disabled=true` retorna todos los fotoclubes

**Uso:**
```bash
node test_fotoclub_list_enabled.js
```

**Variables de entorno requeridas:**
- `NODE_API_BASE_URL`: URL base de la API Node.js (ej: http://localhost:3000) 