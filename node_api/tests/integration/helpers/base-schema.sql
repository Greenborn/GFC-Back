-- Esquema mínimo de las tablas base que en el ambiente real crea la API PHP/Yii2
-- (no forman parte de este repo ni de las migraciones de knex, que solo agregan
-- columnas/tablas incrementales sobre ellas).
--
-- Este esquema cubre únicamente las columnas que usan los tests de integración
-- (auth, fotoclub). Si se agregan tests que tocan otras tablas base (contest,
-- category, section, etc.) hay que extender este archivo.
--
-- Se aplica ANTES de correr `knex migrate:latest`, para que las migraciones
-- incrementales (add_profile_completed_to_user, add_is_test_enabled_to_user, etc.)
-- encuentren la tabla `user` ya creada.

CREATE TABLE IF NOT EXISTS `role` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `profile` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NULL,
  `last_name` VARCHAR(255) NULL DEFAULT '',
  `dni` VARCHAR(20) NULL,
  `fotoclub_id` INT UNSIGNED NULL,
  `img_url` VARCHAR(500) NULL,
  `executive` TINYINT(1) NULL DEFAULT 0,
  `executive_rol` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `role_id` INT UNSIGNED NULL,
  `profile_id` INT UNSIGNED NULL,
  `status` TINYINT NULL DEFAULT 1,
  `password_reset_token` VARCHAR(100) NULL,
  `pass_recovery_date` DATETIME NULL,
  `access_token` VARCHAR(255) NULL,
  `sign_up_verif_code` VARCHAR(100) NULL,
  `sign_up_verif_token` VARCHAR(255) NULL,
  `dni` VARCHAR(20) NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  KEY `idx_user_role` (`role_id`),
  KEY `idx_user_profile` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fotoclub` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `photo_url` VARCHAR(500) NULL,
  `description` VARCHAR(500) NULL,
  `facebook` VARCHAR(255) NULL,
  `instagram` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `mostrar_en_ranking` TINYINT(1) NULL DEFAULT 1,
  `organization_type` VARCHAR(50) NULL,
  `enabled` TINYINT(1) NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roles base usados por los tests (1 = admin, 3 = usuario normal)
INSERT INTO `role` (`id`, `type`) VALUES (1, 'admin') ON DUPLICATE KEY UPDATE `type` = `type`;
INSERT INTO `role` (`id`, `type`) VALUES (3, 'usuario') ON DUPLICATE KEY UPDATE `type` = `type`;
