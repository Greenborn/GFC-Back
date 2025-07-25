# Informe de Avances

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/90219548?s=200&v=4" alt="Greenborn Logo" width="100" height="100">
  <h2>Greenborn - Software en Crecimiento</h2>
</div>

**Fecha:** 2025-07-25

Este informe detalla los avances realizados en el proyecto GFC-Back desde el 5 de febrero de 2025 hasta la fecha actual.

---

## Glosario de Términos

Para facilitar la comprensión de este informe, se incluye un glosario con los términos técnicos más utilizados:

- **API (Application Programming Interface)**: Conjunto de reglas y protocolos que permiten que diferentes aplicaciones se comuniquen entre sí.
- **NodeJS**: Plataforma de desarrollo que permite ejecutar JavaScript en el servidor, facilitando el desarrollo de aplicaciones web.
- **PHP**: Lenguaje de programación del lado del servidor utilizado para crear aplicaciones web dinámicas.
- **Servidor**: Computadora o sistema que proporciona servicios a otros dispositivos o aplicaciones (clientes).
- **Sesión**: Período de tiempo durante el cual un usuario está activo en el sistema, manteniendo su información de autenticación.
- **Ranking**: Sistema de clasificación o posicionamiento basado en criterios específicos.
- **Subdominio**: Parte de una dirección web que precede al dominio principal (ej: api.ejemplo.com).
- **Script**: Programa o conjunto de instrucciones que automatiza tareas específicas.
- **Dependencias**: Librerías o módulos externos que requiere una aplicación para funcionar correctamente.

---

## Cambios en el Servidor
- Corrección en carga de resultados, verifica la métrica según el tipo de concurso (métricas de concursos internos vs. métricas de concursos externos)
- Se agrega API experimental NodeJS, para migrar el sistema a tecnologías más nuevas y aumentar las posibilidades de mejora del sistema.
- En API NodeJS, se agrega posibilidad de recuperar contraseña (Solo en versión de prueba)
- Se actualiza servicio utilizado para envío de emails
- Se agrega mecanismo para consulta de fotografías por código o su título
- API NodeJS ya maneja el mismo sistema de sesiones que versión PHP
- Se agrega función para carga de Resultados (solo ADMIN)
- Se agrega función para recalcular Ranking (solo ADMIN)
- Función de listado de inscriptos ahora retorna email, también se verifica que solo admins y delegados lo puedan descargar
- Funcionalidad de recuperar contraseña implementada.
- Directorio de Fotografías ahora es independiente, lo que facilitará el mantenimiento del sistema.
- Se agregan scripts de test automatizado de prueba de funcionalidad: Creación, Edición y Borrado de Concurso (solo para desarrollo).

---

## Cambios en el Sitio
- Se actualizan dependencias del proyecto, se hace limpieza de dependencias no usadas.
- Se agrega herramienta de búsqueda de fotografías para administradores.
- En sección de herramientas se agrega posibilidad de descargar listado de participantes de un concurso.
- En sección de herramientas, se agrega función de carga de Resultados.
- En sección de herramientas, se agrega función de actualización del ranking.
- Se agrega configuración de base URL, se migraron las rutas de las fotografías a nuevo subdominio para hacer el sistema más mantenible (tiene que ver con el cambio en el directorio de Fotografías mencionado anteriormente).
- Sección de Organizaciones, ya usa nueva API NodeJS.
- En sección de herramientas, planilla de inscriptos ahora tiene campo email.
- Funcionalidad de recuperación de contraseña implementada.

