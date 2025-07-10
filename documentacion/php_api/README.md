# PHP API - Documentación

## Descripción General

La API PHP es el componente principal del sistema GFC-Back, desarrollada con el framework Yii2. Esta API maneja toda la lógica de negocio relacionada con la gestión de concursos fotográficos, usuarios, categorías, secciones y resultados.

## Propósito

Esta API proporciona:
- Gestión completa de concursos fotográficos
- Sistema de autenticación y autorización de usuarios
- Administración de categorías y secciones
- Procesamiento y evaluación de fotografías
- Sistema de puntuación y rankings
- Gestión de perfiles de fotógrafos

## Estructura del Subproyecto

```
php_api/
├── actions/                 # Acciones específicas de la API
├── commands/               # Comandos de consola
├── components/             # Componentes personalizados
├── config/                 # Configuraciones
├── controllers/            # Controladores de la API
├── migrations/             # Migraciones de base de datos
├── models/                 # Modelos de datos
├── traits/                 # Traits reutilizables
├── utils/                  # Utilidades y helpers
├── views/                  # Vistas (si aplica)
└── web/                    # Punto de entrada web
```

## Tecnologías y Dependencias

### Framework Principal
- **Yii2 Framework**: Framework PHP MVC
- **PHP 7.4+**: Versión mínima requerida

### Base de Datos
- **PostgreSQL**: Base de datos principal
- **Yii2 ActiveRecord**: ORM para acceso a datos

### Autenticación y Seguridad
- **JWT Tokens**: Autenticación stateless
- **Yii2 Security**: Componentes de seguridad

### Testing
- **Codeception**: Framework de testing
- **PHPUnit**: Testing unitario

## Documentación Técnica

- **[Arquitectura](arquitectura.md)**: Diseño arquitectónico detallado
- **[Definición Técnica](definicion_tecnica.md)**: Especificación técnica exhaustiva
- **[Endpoints](endpoints.md)**: Documentación completa de todos los endpoints

## Configuración e Instalación

### Requisitos del Sistema
- PHP 7.4 o superior
- PostgreSQL 12+
- Composer
- Extensiones PHP: pdo_pgsql, gd, mbstring, openssl

### Instalación

1. **Instalar dependencias**
   ```bash
   composer install
   ```

2. **Configurar base de datos**
   ```bash
   cp config/db.php.example config/db.php
   # Editar config/db.php con credenciales de BD
   ```

3. **Ejecutar migraciones**
   ```bash
   php yii migrate
   ```

4. **Configurar permisos**
   ```bash
   chmod 777 runtime/
   chmod 777 web/assets/
   ```

## Estructura de Datos

### Entidades Principales
- **User**: Usuarios del sistema
- **Contest**: Concursos fotográficos
- **Category**: Categorías de concursos
- **Section**: Secciones dentro de categorías
- **ContestResult**: Resultados de concursos
- **Profile**: Perfiles de fotógrafos
- **Fotoclub**: Clubes fotográficos

### Relaciones Clave
- Un concurso puede tener múltiples categorías
- Una categoría puede tener múltiples secciones
- Un usuario puede participar en múltiples concursos
- Los resultados se asocian a usuarios, concursos y secciones

## Convenciones de Código

### Nomenclatura
- **Clases**: PascalCase (ej: `ContestController`)
- **Métodos**: camelCase (ej: `getContestResults`)
- **Variables**: camelCase (ej: `$contestId`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `MAX_FILE_SIZE`)

### Estructura de Archivos
- **Controladores**: `controllers/ControllerNameController.php`
- **Modelos**: `models/ModelName.php`
- **Acciones**: `actions/ActionNameAction.php`
- **Migraciones**: `migrations/mYYYYMMDD_HHMMSS_description.php`

### Documentación
- Usar PHPDoc para todos los métodos públicos
- Documentar parámetros y valores de retorno
- Incluir ejemplos de uso cuando sea necesario

## Testing

### Tipos de Tests
- **Unit Tests**: Testing de métodos individuales
- **Functional Tests**: Testing de controladores
- **Acceptance Tests**: Testing de flujos completos

### Ejecutar Tests
```bash
# Todos los tests
vendor/bin/codecept run

# Tests unitarios
vendor/bin/codecept run unit

# Tests funcionales
vendor/bin/codecept run functional
```

## Deployment

### Configuración de Producción
- Configurar variables de entorno
- Optimizar configuración de PHP
- Configurar servidor web (Apache/Nginx)
- Configurar SSL/TLS

### Monitoreo
- Logs de aplicación en `runtime/logs/`
- Monitoreo de errores
- Métricas de rendimiento

## Mantenimiento

### Tareas Regulares
- Backup de base de datos
- Limpieza de logs
- Actualización de dependencias
- Revisión de seguridad

### Comandos Útiles
```bash
# Limpiar cache
php yii cache/flush-all

# Verificar estado de migraciones
php yii migrate/history

# Generar documentación de API
php yii api/generate-docs
```

## Integración con Node.js API

La API PHP se integra con la API Node.js para:
- Comunicación en tiempo real via WebSockets
- Operaciones específicas de procesamiento
- Sincronización de datos

## Soporte y Contacto

Para soporte técnico específico de la API PHP, contactar al equipo de desarrollo backend.

---

**Navegación**: [Volver al README Principal](../../README.md) | [Arquitectura](arquitectura.md) | [Definición Técnica](definicion_tecnica.md) | [Endpoints](endpoints.md) 