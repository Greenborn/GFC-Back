# GFC-Back - Sistema de Gestión de Concursos Fotográficos

## Descripción General

GFC-Back es un sistema backend completo para la gestión de concursos fotográficos, desarrollado con arquitectura de microservicios que incluye dos APIs principales:

- **PHP API** (Yii2 Framework): API principal para gestión de concursos, usuarios y resultados
- **Node.js API** (Express.js): API complementaria para operaciones específicas y WebSockets

## Estructura del Proyecto

```
GFC-Back/
├── documentacion/           # Documentación completa del proyecto
│   ├── php_api/            # Documentación de la API PHP
│   └── node_api/           # Documentación de la API Node.js
├── php_api/                # API principal en Yii2 Framework
├── node_api/               # API complementaria en Node.js/Express
└── README.md               # Este archivo
```

## Características Principales

- **Gestión de Concursos**: Creación, administración y evaluación de concursos fotográficos
- **Sistema de Usuarios**: Registro, autenticación y perfiles de fotógrafos
- **Categorías y Secciones**: Organización flexible de concursos por categorías
- **Sistema de Puntuación**: Evaluación y ranking de fotografías
- **WebSockets**: Comunicación en tiempo real
- **Gestión de Archivos**: Subida y procesamiento de imágenes

## Tecnologías Utilizadas

### PHP API (Yii2)
- **Framework**: Yii2
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT Tokens
- **Testing**: Codeception

### Node.js API (Express)
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (Knex.js)
- **WebSockets**: Socket.io
- **Testing**: Jest/Mocha

## Documentación

La documentación completa del proyecto se encuentra organizada en el directorio `documentacion/`:

- **[Documentación PHP API](documentacion/php_api/README.md)** - Especificaciones completas de la API principal
- **[Documentación Node.js API](documentacion/node_api/README.md)** - Especificaciones de la API complementaria

## Instalación y Configuración

### Requisitos Previos
- PHP 7.4+ con extensiones requeridas
- Node.js 14+
- PostgreSQL 12+
- Composer
- npm

### Configuración Rápida

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd GFC-Back
   ```

2. **Configurar PHP API**
   ```bash
   cd php_api
   composer install
   cp config/db.php.example config/db.php
   # Configurar base de datos en config/db.php
   php yii migrate
   ```

3. **Configurar Node.js API**
   ```bash
   cd ../node_api
   npm install
   cp .env.example .env
   # Configurar variables de entorno
   npm run migrate
   ```

## Desarrollo

### Estructura de Desarrollo
- Cada API mantiene su propia estructura y convenciones
- Las APIs se comunican mediante HTTP y WebSockets
- Base de datos compartida con esquemas separados por API

### Convenciones de Código
- Seguir las convenciones específicas de cada tecnología
- Documentar todos los endpoints y métodos públicos
- Mantener cobertura de tests
- Usar commits descriptivos

## Contribución

1. Crear una rama para tu feature
2. Seguir las convenciones de código establecidas
3. Documentar cambios en la documentación correspondiente
4. Ejecutar tests antes de hacer commit
5. Crear un Pull Request con descripción detallada

## Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.md

## Contacto

Para consultas técnicas o soporte, contactar al equipo de desarrollo.

---

**Nota**: Para información técnica detallada, consultar la documentación específica de cada subproyecto en el directorio `documentacion/`. 