# Informe de Avances

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/90219548?s=200&v=4" alt="Greenborn Logo" width="100" height="100">
  <h2>Greenborn - Software en Crecimiento</h2>
</div>

**Fecha:** 2025-07-25

Este informe detalla los avances realizados en el proyecto GFC-Back desde el 5 de febrero de 2025 hasta la fecha actual.

---

## Cambios en el Servidor
- Corrección en carga de resultados, verifica la metrica segun el tipo de concurso (metricas de concursos internos vs. metricas de concursos externos)
- Se agrega API experimental NodeJS, para migrar el sistema a tecnologías más nuevas y aumentar las posibilidades de mejora del sistema.
- En API NodeJS, se agrega posibilidad de recuperar contraseña (Solo en versión de prueba)
- Se actualiza servicio utilizado para envio de emails
- Se agrega mecanismo para consulta de fotografías por código o su título
- Api NodeJS ya maneja el mismo sistema de sesiones que versión PHP
- Se agrega función para carga de Resultados (solo ADMIN)
- Se agrega función para recalcular Ranking (solo ADMIN)
- Funcion de listado de inscriptos ahora retorna email, tambien se verifica que solo admins y delegados lo puedan descargar
- Funcionalidad de recuperar contraseña implementada.
- Directorio de Fotografías ahora es independiente, lo que facilitara el mantenimiento del sistema.
- Se agregan scripts de test automatizado de prueba de funcionalidad: Creación, Edición y Borrado de Concurso (solo para desarrollo).

---

## Cambios en el Sitio
