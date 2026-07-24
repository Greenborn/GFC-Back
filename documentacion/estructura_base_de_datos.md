# Estructura de Base de Datos — Grupo Fotográfico

**Motor:** PostgreSQL  
**Base de datos:** `grupo_fotografico_prod`  
**Host:** `149.50.134.169`  
**Esquema:** `public`  
**Fecha de actualización:** 2025-07-24  

---

## Convenciones

- `PK` = Clave primaria
- `FK` → `tabla.columna` = Clave foránea
- `UQ(...)` = Restricción unique
- `DEFAULT valor` = Valor por defecto
- `SERIAL` = `INTEGER` con auto-incremento via secuencia

---

## Tablas (31)

### 1. `category`

Categorías de concursos/secciones.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR(45)` | `NOT NULL` | Nombre de la categoría |
| `mostrar_en_ranking` | `INTEGER` | | Indica si se muestra en el ranking |

---

### 2. `contest`

Concursos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR` | `NOT NULL` | Nombre del concurso |
| `description` | `TEXT` | | Descripción |
| `start_date` | `TIMESTAMP` | | Fecha de inicio |
| `end_date` | `TIMESTAMP` | | Fecha de fin |
| `max_img_section` | `INTEGER` | `DEFAULT 3` | Máximo de imágenes por sección |
| `img_url` | `VARCHAR(200)` | | URL de imagen del concurso |
| `rules_url` | `VARCHAR` | | URL del reglamento |
| `sub_title` | `VARCHAR(255)` | | Subtítulo |
| `organization_type` | `VARCHAR(250)` | | Tipo de organización |
| `judged` | `BOOLEAN` | | Indica si es evaluado por jurados |
| `deleted_at` | `TIMESTAMPTZ` | | Soft delete |
| `is_test` | `BOOLEAN` | `DEFAULT false` | Indica si es un concurso de prueba |
| `is_judging` | `BOOLEAN` | `DEFAULT false` | Indica si está en etapa de evaluación |

---

### 3. `contest_category`

Asociación muchos-a-muchos entre concursos y categorías.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `contest_id` | `INTEGER` | `NOT NULL`, `FK → contest.id` | Concurso |
| `category_id` | `INTEGER` | `NOT NULL`, `FK → category.id` | Categoría |

---

### 4. `contest_judge`

Jurados asignados a concursos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `contest_id` | `INTEGER` | `NOT NULL`, `FK → contest.id` | Concurso |
| `user_id` | `INTEGER` | `NOT NULL`, `FK → user.id` | Usuario jurado |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de creación |

`UQ(contest_id, user_id)` — Un usuario solo puede asignarse una vez por concurso.

---

### 5. `contest_preselected_photo`

Fotos preseleccionadas en concursos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `contest_id` | `INTEGER` | `NOT NULL`, `FK → contest.id` | Concurso |
| `image_id` | `INTEGER` | `NOT NULL`, `FK → image.id` | Imagen |
| `preselected` | `BOOLEAN` | `DEFAULT false` | Está preseleccionada |
| `votes` | `JSON` | | Votos de los jurados |

`UQ(contest_id, image_id)` — Una imagen solo se preselecciona una vez por concurso.

---

### 6. `contest_result`

Resultados de concursos (fotos premiadas por sección/métrica).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `metric_id` | `INTEGER` | `NOT NULL`, `FK → metric.id` | Métrica/premio |
| `image_id` | `INTEGER` | `NOT NULL`, `FK → image.id` | Imagen premiada |
| `contest_id` | `INTEGER` | `FK → contest.id` | Concurso |
| `section_id` | `INTEGER` | `NOT NULL`, `FK → section.id` | Sección |
| `type` | `VARCHAR(255)` | | Tipo de resultado |
| `temporada` | `INTEGER` | | Temporada |

---

### 7. `contest_section`

Asociación muchos-a-muchos entre concursos y secciones.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `contest_id` | `INTEGER` | `NOT NULL`, `FK → contest.id` | Concurso |
| `section_id` | `INTEGER` | `NOT NULL`, `FK → section.id` | Sección |

---

### 8. `contests_records`

Registros/archivos asociados a concursos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `url` | `VARCHAR(255)` | | URL del registro |
| `object` | `TEXT` | | Objeto JSON serializado |
| `contest_id` | `INTEGER` | `FK → contest.id` | Concurso |
| `type` | `VARCHAR(255)` | | Tipo de registro |
| `temporada` | `INTEGER` | | Temporada |

---

### 9. `footer`

Información de contacto del footer.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `email` | `VARCHAR(255)` | | Email de contacto |
| `facebook` | `VARCHAR(255)` | | URL de Facebook |
| `instagram` | `VARCHAR(255)` | | URL de Instagram |
| `youtube` | `VARCHAR(255)` | | URL de YouTube |
| `id` | `SERIAL` | `PK` | ID único |

---

### 10. `foto_del_anio`

Fotos del año (ranking especial anual).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `id_foto` | `INTEGER` | `NOT NULL` | ID de la foto |
| `puesto` | `VARCHAR(255)` | `NOT NULL` | Puesto obtenido |
| `orden` | `INTEGER` | `NOT NULL` | Orden de visualización |
| `temporada` | `INTEGER` | `NOT NULL` | Temporada |
| `nombre_obra` | `VARCHAR(255)` | `NOT NULL` | Nombre de la obra |
| `nombre_autor` | `VARCHAR(255)` | `NOT NULL` | Nombre del autor |
| `url_imagen` | `VARCHAR(500)` | | URL de la imagen |

---

### 11. `fotoclub`

Fotoclubes (agrupaciones de fotógrafos).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR(45)` | `NOT NULL` | Nombre del fotoclub |
| `facebook` | `VARCHAR` | | URL de Facebook |
| `instagram` | `VARCHAR` | | URL de Instagram |
| `email` | `VARCHAR` | | Email de contacto |
| `description` | `VARCHAR` | | Descripción |
| `photo_url` | `VARCHAR` | | URL del logo/foto |
| `mostrar_en_ranking` | `INTEGER` | | Indica si se muestra en el ranking |
| `organization_type` | `VARCHAR(250)` | | Tipo de organización |
| `enabled` | `BOOLEAN` | `DEFAULT true` | Habilitado |

---

### 12. `fotoclub_ranking`

Ranking de fotoclubes.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `fotoclub_id` | `INTEGER` | `NOT NULL` | Referencia a `fotoclub.id` (sin FK formal) |
| `name` | `TEXT` | | Nombre |
| `score` | `INTEGER` | `NOT NULL` | Puntaje |
| `prizes` | `TEXT` | | Premios (JSON) |
| `puntaje_temporada` | `INTEGER` | | Puntaje de temporada |
| `porc_efectividad_anual` | `TEXT` | | Porcentaje de efectividad anual |
| `premios_temporada` | `TEXT` | | Premios de temporada |

---

### 13. `image`

Imágenes subidas por perfiles.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `code` | `VARCHAR` | `NOT NULL` | Código único de la imagen |
| `title` | `VARCHAR` | `NOT NULL` | Título de la obra |
| `profile_id` | `INTEGER` | `NOT NULL`, `FK → profile.id` | Perfil del autor |
| `url` | `VARCHAR` | `NOT NULL` | URL de la imagen |
| `width` | `INTEGER` | | Ancho en píxeles |
| `height` | `INTEGER` | | Alto en píxeles |
| `mime_type` | `VARCHAR(50)` | | Tipo MIME |
| `image_metadata` | `JSONB` | | Metadatos EXIF/IPTC |

---

### 14. `info_centro`

Centro de información (páginas de contenido estático).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `title` | `VARCHAR(200)` | | Título |
| `content` | `TEXT` | | Contenido HTML/Markdown |
| `img_url` | `VARCHAR(200)` | | URL de imagen |

---

### 15. `knex_migrations`

Migraciones de Knex.js.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR(255)` | | Nombre del archivo de migración |
| `batch` | `INTEGER` | | Número de lote |
| `migration_time` | `TIMESTAMPTZ` | | Timestamp de ejecución |

---

### 16. `knex_migrations_lock`

Lock de migraciones Knex.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `index` | `SERIAL` | `PK` | ID único |
| `is_locked` | `INTEGER` | | 0 = desbloqueado, 1 = bloqueado |

---

### 17. `log_operaciones`

Log de operaciones de usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `id_usuario` | `INTEGER` | `NOT NULL` | ID del usuario |
| `evento` | `VARCHAR(255)` | `NOT NULL` | Tipo de evento |
| `meta_data` | `JSONB` | | Datos adicionales del evento |
| `date_time` | `TIMESTAMP` | `NOT NULL` | Fecha y hora del evento |

---

### 18. `metric`

Métricas/premios del sistema de puntuación.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `prize` | `VARCHAR` | `NOT NULL` | Nombre del premio/métrica |
| `score` | `INTEGER` | | Puntaje asignado |
| `dni` | `VARCHAR(25)` | | DNI asociado |

---

### 19. `metric_abm`

Métricas por tipo de organización (ABM).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `prize` | `VARCHAR` | `NOT NULL` | Nombre del premio |
| `score` | `NUMERIC` | | Puntaje |
| `organization_type` | `VARCHAR(36)` | | Tipo de organización |

---

### 20. `profile`

Perfiles de usuarios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR(59)` | | Nombre |
| `last_name` | `VARCHAR(50)` | | Apellido |
| `fotoclub_id` | `INTEGER` | `FK → fotoclub.id` | Fotoclub al que pertenece |
| `img_url` | `VARCHAR(200)` | | URL de foto de perfil |
| `executive` | `BOOLEAN` | `DEFAULT false` | Es directivo |
| `executive_rol` | `VARCHAR` | | Rol directivo |
| `dni` | `VARCHAR(25)` | | Documento de identidad |

---

### 21. `profile_contest`

Inscripción de perfiles en concursos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `profile_id` | `INTEGER` | `NOT NULL`, `FK → profile.id` | Perfil |
| `contest_id` | `INTEGER` | `NOT NULL`, `FK → contest.id` | Concurso |
| `category_id` | `INTEGER` | `FK → category.id` | Categoría |

---

### 22. `profiles_ranking`

Ranking general de perfiles.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id_profile` | `INTEGER` | `PK`, `FK → profile.id` | ID del perfil |
| `puntuacion` | `INTEGER` | `NOT NULL DEFAULT 0` | Puntuación total |

---

### 23. `profiles_ranking_category_section`

Ranking de perfiles desglosado por categoría y sección.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `profile_id` | `INTEGER` | `NOT NULL`, `FK → profile.id` | Perfil |
| `section_id` | `INTEGER` | `NOT NULL`, `FK → section.id` | Sección |
| `category_id` | `INTEGER` | `NOT NULL`, `FK → category.id` | Categoría |
| `puntaje_temporada` | `INTEGER` | `NOT NULL` | Puntaje de la temporada |
| `score_total` | `INTEGER` | `NOT NULL` | Puntaje total |
| `prizes` | `TEXT` | | Premios (JSON) |
| `name` | `VARCHAR` | | Nombre del perfil |
| `premios_temporada` | `TEXT` | | Premios de temporada |

---

### 24. `role`

Roles del sistema.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `type` | `VARCHAR(45)` | `NOT NULL` | Nombre del rol |

---

### 25. `section`

Secciones (temáticas de los concursos).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `name` | `VARCHAR(45)` | `NOT NULL` | Nombre de la sección |

---

### 26. `thumbnail`

Thumbnails de imágenes.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `image_id` | `INTEGER` | `NOT NULL` | Referencia a `image.id` (sin FK formal) |
| `thumbnail_type` | `INTEGER` | `NOT NULL` | Referencia a `thumbnail_type.id` (sin FK formal) |
| `url` | `VARCHAR(200)` | | URL del thumbnail |

---

### 27. `thumbnail_type`

Tipos/tamaños de thumbnail.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `width` | `INTEGER` | `NOT NULL` | Ancho en píxeles |
| `height` | `INTEGER` | `NOT NULL` | Alto en píxeles |

---

### 28. `user`

Usuarios del sistema (autenticación).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `username` | `VARCHAR(45)` | | Nombre de usuario |
| `password_hash` | `VARCHAR(255)` | | Hash de contraseña |
| `password_reset_token` | `VARCHAR(255)` | | Token de reset de contraseña |
| `access_token` | `VARCHAR(128)` | | Token de acceso |
| `created_at` | `VARCHAR(45)` | | Fecha de creación |
| `updated_at` | `VARCHAR(45)` | | Fecha de actualización |
| `status` | `INTEGER` | `NOT NULL` | Estado del usuario |
| `role_id` | `INTEGER` | `NOT NULL`, `FK → role.id` | Rol del usuario |
| `profile_id` | `INTEGER` | `NOT NULL`, `FK → profile.id` | Perfil asociado |
| `email` | `VARCHAR(255)` | | Email |
| `sign_up_verif_code` | `VARCHAR(255)` | | Código de verificación de registro |
| `sign_up_verif_token` | `VARCHAR(255)` | | Token de verificación de registro |
| `dni` | `VARCHAR(25)` | | Documento de identidad |
| `pass_recovery_date` | `TIMESTAMP` | | Fecha de recuperación de contraseña |
| `is_test_enabled` | `BOOLEAN` | `DEFAULT false` | Modo prueba habilitado |

---

### 29. `user_preferences`

Preferencias de usuario (clave-valor).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `user_id` | `INTEGER` | `NOT NULL` | ID del usuario |
| `key` | `VARCHAR(100)` | `NOT NULL` | Clave de preferencia |
| `value` | `TEXT` | | Valor |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de creación |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de actualización |

`UQ(user_id, key)` — Una clave solo puede existir una vez por usuario.

---

### 30. `user_preferences_meta`

Metadatos que definen las claves de preferencia válidas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `key` | `VARCHAR(100)` | `NOT NULL`, `UQ` | Clave de preferencia |
| `description` | `TEXT` | | Descripción de la preferencia |
| `value_type` | `VARCHAR(50)` | | Tipo de dato esperado |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de creación |

---

### 31. `user_tokens`

Tokens de sesión/autenticación.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | `SERIAL` | `PK` | ID único |
| `user_id` | `INTEGER` | `NOT NULL` | ID del usuario |
| `token` | `VARCHAR(128)` | `NOT NULL`, `UQ` | Token único |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | Fecha de creación |
| `expires_at` | `TIMESTAMPTZ` | | Fecha de expiración |
| `last_used_at` | `TIMESTAMPTZ` | | Último uso |
| `ip_address` | `VARCHAR(45)` | | Dirección IP |
| `user_agent` | `TEXT` | | User-Agent del navegador |
| `is_active` | `BOOLEAN` | `DEFAULT true` | Token activo |

---

## Resumen de Relaciones (Foreign Keys)

| Tabla | Columna | Referencia |
|-------|---------|------------|
| `contest_category` | `contest_id` | → `contest.id` |
| `contest_category` | `category_id` | → `category.id` |
| `contest_judge` | `contest_id` | → `contest.id` |
| `contest_judge` | `user_id` | → `user.id` |
| `contest_preselected_photo` | `contest_id` | → `contest.id` |
| `contest_preselected_photo` | `image_id` | → `image.id` |
| `contest_result` | `metric_id` | → `metric.id` |
| `contest_result` | `image_id` | → `image.id` |
| `contest_result` | `contest_id` | → `contest.id` |
| `contest_result` | `section_id` | → `section.id` |
| `contest_section` | `contest_id` | → `contest.id` |
| `contest_section` | `section_id` | → `section.id` |
| `contests_records` | `contest_id` | → `contest.id` |
| `profile` | `fotoclub_id` | → `fotoclub.id` |
| `profile_contest` | `profile_id` | → `profile.id` |
| `profile_contest` | `contest_id` | → `contest.id` |
| `profile_contest` | `category_id` | → `category.id` |
| `profiles_ranking` | `id_profile` | → `profile.id` |
| `profiles_ranking_category_section` | `profile_id` | → `profile.id` |
| `profiles_ranking_category_section` | `section_id` | → `section.id` |
| `profiles_ranking_category_section` | `category_id` | → `category.id` |
| `user` | `role_id` | → `role.id` |
| `user` | `profile_id` | → `profile.id` |

---

## Diagrama Entidad-Relación (texto)

```
fotoclub ──< profile ──< user >── role
  │            │
  │            ├──< image ──< thumbnail >── thumbnail_type
  │            │
  │            ├──< profile_contest >── contest
  │            │         │                ├── contest_category >── category
  │            │         │                ├── contest_section >── section
  │            │         │                ├── contest_judge >── user
  │            │         │                ├── contest_preselected_photo >── image
  │            │         │                ├── contest_result >── image, metric, section
  │            │         │                └── contests_records
  │            │
  │            ├──< profiles_ranking
  │            │
  │            └──< profiles_ranking_category_section >── section, category
  │
  └──< fotoclub_ranking

user ──< user_preferences
user ──< user_tokens
user ──< log_operaciones

metric
metric_abm
foto_del_anio
info_centro
footer
```

---

> Documentación generada desde información viva de la base de datos.  
> Para actualizar, ejecutar: `psql "$DATABASE_URL" -f scripts/generar_docs_bd.sql`
