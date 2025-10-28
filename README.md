# GFC-Back - Sistema de Gestión de Concursos Fotográficos

**Última actualización:** 28 de octubre de 2025

## Descripción General

GFC-Back es un sistema backend completo para la gestión de concursos fotográficos, desarrollado con arquitectura de microservicios que incluye dos APIs principales:

- **PHP API** (Yii2 Framework): API principal para gestión de concursos, usuarios y resultados
- **Node.js API** (Express.js): API complementaria para operaciones específicas, WebSockets y procesamiento de archivos

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
- **Compresión de Concursos**: Generación automática de archivos ZIP con estructura organizada
- **Gestión de Fotoclubes**: CRUD completo de clubes fotográficos con imágenes
- **Recuperación de Contraseñas**: Sistema completo de recuperación mediante códigos
- **Carga de Resultados**: Sistema automatizado para carga de resultados de jurado
- **Health Checks**: Endpoints de verificación de estado del sistema

## Tecnologías Utilizadas

### PHP API (Yii2)
- **Framework**: Yii2
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT Tokens
- **Testing**: Codeception

### Node.js API (Express)
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL/MySQL (Knex.js)
- **WebSockets**: Socket.io
- **Testing**: Jest/Mocha
- **Compresión**: Archiver (ZIP)
- **Procesamiento de Imágenes**: Sharp
- **Autenticación**: Sessions + JWT
- **Versión Actual**: 1.16.20

## Documentación

La documentación completa del proyecto se encuentra organizada en el directorio `documentacion/`:

- **[Documentación PHP API](documentacion/php_api/README.md)** - Especificaciones completas de la API principal
- **[Documentación Node.js API](documentacion/node_api/README.md)** - Especificaciones de la API complementaria
- **[Informe de Avances](documentacion/informe_avances_2025-07-25.md)** - Informe detallado de progreso del proyecto

## Actualizaciones Recientes (Octubre 2025)

### Node.js API
- ✅ **Compresión de Fotos de Concursos**: Endpoint `/contest/compressed-photos` que genera estructura organizada de carpetas (categoría/sección/premio) y archivo ZIP descargable
- ✅ **Gestión de Fotoclubes**: 
  - Endpoint POST `/fotoclub/create` para crear nuevos fotoclubes con imágenes
  - Endpoint PUT `/fotoclub/edit` mejorado con soporte de imágenes en base64
  - Almacenamiento automático de imágenes de fotoclubes
- ✅ **Optimización de Descargas**: Para concursos finalizados, se verifica si existe el ZIP antes de regenerarlo
- ✅ **Health Check Mejorado**: Endpoint `/health` con información detallada del estado de la base de datos y sistema
- ✅ **Soporte Multi-Database**: Configuración flexible para PostgreSQL y MySQL mediante `DB_CLIENT`
- ✅ **Modo Solo Lectura**: Configuración `MODO_ESCRITURA` para controlar operaciones de escritura

### PHP API
- ✅ **Manejo Robusto de Autenticación**: Validación mejorada de tokens con respuestas HTTP correctas (401 para errores de autenticación)
- ✅ **Validación de Headers**: Manejo seguro de headers Authorization malformados
- ✅ **Respuestas JSON Estructuradas**: Formato consistente para todos los errores de autenticación

### Documentación
- ✅ **Actualización Completa**: Documentación actualizada con todos los nuevos endpoints y funcionalidades
- ✅ **Ejemplos de Uso**: Ejemplos detallados para cada endpoint nuevo
- ✅ **Especificaciones Técnicas**: Definiciones TypeScript para nuevas interfaces y tipos

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