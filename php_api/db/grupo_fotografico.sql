-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-10-2021 a las 01:33:42
-- Versión del servidor: 10.4.21-MariaDB
-- Versión de PHP: 8.0.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `grupo_fotografico`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `category`
--

INSERT INTO `category` (`id`, `name`) VALUES
(1, 'Primera, number one'),
(2, 'Segunda');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contest`
--

CREATE TABLE `contest` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL,
  `description` longtext DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `contest`
--

INSERT INTO `contest` (`id`, `name`, `description`, `start_date`, `end_date`) VALUES
(1, 'Concurso primero todo', '1235555', '172800000', '172800000'),
(2, 'concurso prueba 2', 'Reglas? no, no hay eso acá', '1630355013', '1630355013'),
(5, 'concurso prueba 1', 'Reglas?', '1555200000', '1555200000'),
(12, '124', '12433', '949276800000', '833760000000'),
(13, '!231', ' 15221 sfd gs gfds gs', '793152000000', '630892800000'),
(14, '123', '123', '631152000000', '915148800000');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contest_category`
--

CREATE TABLE `contest_category` (
  `id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `contest_category`
--

INSERT INTO `contest_category` (`id`, `contest_id`, `category_id`) VALUES
(1, 1, 1),
(2, 1, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contest_result`
--

CREATE TABLE `contest_result` (
  `id` int(11) NOT NULL,
  `metric_id` int(11) NOT NULL,
  `image_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `contest_result`
--

INSERT INTO `contest_result` (`id`, `metric_id`, `image_id`, `contest_id`) VALUES
(24, 24, 25, 1),
(25, 25, 26, 1),
(26, 26, 27, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contest_section`
--

CREATE TABLE `contest_section` (
  `id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `contest_section`
--

INSERT INTO `contest_section` (`id`, `contest_id`, `section_id`) VALUES
(1, 1, 2),
(2, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fotoclub`
--

CREATE TABLE `fotoclub` (
  `id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `fotoclub`
--

INSERT INTO `fotoclub` (`id`, `name`) VALUES
(1, 'Testing'),
(2, 'El faro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `image`
--

CREATE TABLE `image` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `title` varchar(45) NOT NULL,
  `profile_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `image`
--

INSERT INTO `image` (`id`, `code`, `title`, `profile_id`) VALUES
(25, '#123', '123', 24),
(26, '$6663', '2222', 29),
(27, '#123', '555', 27);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metric`
--

CREATE TABLE `metric` (
  `id` int(11) NOT NULL,
  `prize` varchar(10) NOT NULL,
  `score` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `metric`
--

INSERT INTO `metric` (`id`, `prize`, `score`) VALUES
(24, '15', 5),
(25, '0', 0),
(26, '0', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profile`
--

CREATE TABLE `profile` (
  `id` int(11) NOT NULL,
  `name` varchar(59) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `fotoclub_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `profile`
--

INSERT INTO `profile` (`id`, `name`, `last_name`, `fotoclub_id`) VALUES
(1, 'admin', 'dos', 2),
(2, 'delegado', 'uno', 2),
(24, 'concursante', 'uno', 1),
(26, 'concursante', 'dos', 1),
(27, 'concursante', 'tres', 1),
(28, 'concursante', 'cuatro', 2),
(29, 'concursante', 'cinco', 2),
(30, 'delegado', 'dos', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profile_contest`
--

CREATE TABLE `profile_contest` (
  `id` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `profile_contest`
--

INSERT INTO `profile_contest` (`id`, `profile_id`, `contest_id`) VALUES
(1, 1, 1),
(2, 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `type` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `role`
--

INSERT INTO `role` (`id`, `type`) VALUES
(1, 'Administrador'),
(2, 'Delegado'),
(3, 'Concursante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `section`
--

CREATE TABLE `section` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `section`
--

INSERT INTO `section` (`id`, `name`) VALUES
(1, 'Monocromo'),
(2, 'Color');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(45) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `access_token` varchar(128) DEFAULT NULL,
  `created_at` varchar(45) DEFAULT NULL,
  `updated_at` varchar(45) DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `role_id` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `user`
--

INSERT INTO `user` (`id`, `username`, `password_hash`, `password_reset_token`, `access_token`, `created_at`, `updated_at`, `status`, `role_id`, `profile_id`) VALUES
(1, 'admin', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', NULL, NULL, 1, 1, 1),
(6, 'conc', NULL, NULL, '1', NULL, NULL, 0, 3, 24),
(7, 'c1', NULL, NULL, '1', NULL, NULL, 0, 3, 26),
(8, 'c2', NULL, NULL, '1', NULL, NULL, 0, 3, 27),
(9, 'c3', NULL, NULL, '1', NULL, NULL, 0, 3, 28),
(10, 'c4', NULL, NULL, '1', NULL, NULL, 0, 3, 29),
(101, 'd2', NULL, NULL, '1', NULL, NULL, 1, 2, 30),
(102, 'user', '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', NULL, 'v', NULL, NULL, 1, 2, 2);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `contest`
--
ALTER TABLE `contest`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `contest_category`
--
ALTER TABLE `contest_category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_category_id` (`category_id`),
  ADD KEY `fk_contest_contest_id` (`contest_id`);

--
-- Indices de la tabla `contest_result`
--
ALTER TABLE `contest_result`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_result_metric_id` (`metric_id`),
  ADD KEY `fk_contest_result_contest_id` (`contest_id`),
  ADD KEY `fk_contest_result_image_id` (`image_id`);

--
-- Indices de la tabla `contest_section`
--
ALTER TABLE `contest_section`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_section_id` (`section_id`),
  ADD KEY `fk_contest_contest2_id` (`contest_id`);

--
-- Indices de la tabla `fotoclub`
--
ALTER TABLE `fotoclub`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `image`
--
ALTER TABLE `image`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `metric`
--
ALTER TABLE `metric`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `profile`
--
ALTER TABLE `profile`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_profile_fotoclub_id` (`fotoclub_id`);

--
-- Indices de la tabla `profile_contest`
--
ALTER TABLE `profile_contest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_profile_contest_id` (`contest_id`),
  ADD KEY `fk_profile_profile_id` (`profile_id`);

--
-- Indices de la tabla `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `section`
--
ALTER TABLE `section`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fk_user_profile_id` (`profile_id`) USING BTREE,
  ADD KEY `fk_user_role_id` (`role_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `contest`
--
ALTER TABLE `contest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `contest_category`
--
ALTER TABLE `contest_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `contest_result`
--
ALTER TABLE `contest_result`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `contest_section`
--
ALTER TABLE `contest_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `fotoclub`
--
ALTER TABLE `fotoclub`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `image`
--
ALTER TABLE `image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `metric`
--
ALTER TABLE `metric`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `profile`
--
ALTER TABLE `profile`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `profile_contest`
--
ALTER TABLE `profile_contest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `role`
--
ALTER TABLE `role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `section`
--
ALTER TABLE `section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `contest_category`
--
ALTER TABLE `contest_category`
  ADD CONSTRAINT `fk_contest_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `contest_result`
--
ALTER TABLE `contest_result`
  ADD CONSTRAINT `fk_contest_result_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_result_image_id` FOREIGN KEY (`image_id`) REFERENCES `image` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_result_metric_id` FOREIGN KEY (`metric_id`) REFERENCES `metric` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `contest_section`
--
ALTER TABLE `contest_section`
  ADD CONSTRAINT `fk_contest_contest2_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`),
  ADD CONSTRAINT `fk_contest_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `profile`
--
ALTER TABLE `profile`
  ADD CONSTRAINT `fk_profile_fotoclub_id` FOREIGN KEY (`fotoclub_id`) REFERENCES `fotoclub` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `profile_contest`
--
ALTER TABLE `profile_contest`
  ADD CONSTRAINT `fk_profile_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_profile_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`),
  ADD CONSTRAINT `fk_user_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
