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
- **Angular**: Framework de desarrollo web desarrollado por Google para crear aplicaciones de una sola página.
- **Vue3**: Framework progresivo de JavaScript para construir interfaces de usuario.
- **IA (Inteligencia Artificial)**: Tecnología que permite a las máquinas realizar tareas que normalmente requieren inteligencia humana.
- **Hosting**: Servicio que permite almacenar y hacer accesible un sitio web en internet.
- **Cotización**: Precio o valor de referencia de una moneda extranjera.

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
- Se solucionaron errores que provocaban que la sesión se cerrara de forma inesperada.

---

## Tareas de Soporte
- Carga de resultados de concursos y actualización de Ranking (aunque a partir del siguiente concurso ya las debería poder realizar ingresando al sitio como Administrador)
- Recuperación de contraseña (Ya se debería poder utilizar la nueva funcionalidad para tal fin)
- Unificación de cuenta de usuario Autor.
- Corrección en la inscripción de un Autor, de Primera a Estímulo.

---

## Tareas Adicionales
- Se continúa trabajando en la actualización de las Tecnologías empleadas en el servidor, se avanzó en un 20% la idea es a corto plazo hacer una migración total (se pasa de PHP a NodeJS).
- Se está trabajando en una versión nueva del sitio apuntando al uso de nuevas tecnologías (Se pasa de Angular 12 a Vue3).
- Se comienza una nueva etapa de Desarrollo Asistido por IA, lo que permitirá avanzar más rápido en las tareas de desarrollo y mantenimiento general del sistema.

---

## Pago correspondiente al trabajo realizado
- Se considera el acuerdo establecido de 50 dólares por concurso.
- Se considera que el conjunto de tareas realizadas más el hosting están comprendidos dentro de dicho monto.

Por lo que teniendo en cuenta la cotización oficial del Banco Central (https://www.bcra.gob.ar/PublicacionesEstadisticas/Tipo_de_cambio_minorista.asp) del día 25/07/2025 de $1.255,14

### Se estima el monto a pagar en: $62.757