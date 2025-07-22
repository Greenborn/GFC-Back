-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 15, 2021 at 06:56 PM
-- Server version: 10.5.11-MariaDB-1
-- PHP Version: 8.0.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `grupo_fotografico`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `name`) VALUES
(1, 'Primera, number one'),
(2, 'Segunda');

-- --------------------------------------------------------

--
-- Table structure for table `contest`
--

CREATE TABLE `contest` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL,
  `description` longtext DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `contest`
--

INSERT INTO `contest` (`id`, `name`, `description`, `start_date`, `end_date`) VALUES
(1, 'concurso prueba 1', 'Reglas?', '1630355013', '1630355013'),
(2, 'concurso prueba 2', 'Reglas? no, no hay eso acá', '1630355013', '1630355013');

-- --------------------------------------------------------

--
-- Table structure for table `contest_category`
--

CREATE TABLE `contest_category` (
  `id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `contest_category`
--

INSERT INTO `contest_category` (`id`, `contest_id`, `category_id`) VALUES
(1, 1, 1),
(2, 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `contest_result`
--

CREATE TABLE `contest_result` (
  `id` int(11) NOT NULL,
  `metric_id` int(11) NOT NULL,
  `image_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `contest_section`
--

CREATE TABLE `contest_section` (
  `id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `contest_section`
--

INSERT INTO `contest_section` (`id`, `contest_id`, `section_id`) VALUES
(1, 1, 2),
(2, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `fotoclub`
--

CREATE TABLE `fotoclub` (
  `id` int(11) NOT NULL,
  `name` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `fotoclub`
--

INSERT INTO `fotoclub` (`id`, `name`) VALUES
(1, 'Testing'),
(2, 'Testing.');

-- --------------------------------------------------------

--
-- Table structure for table `image`
--

CREATE TABLE `image` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `title` varchar(45) NOT NULL,
  `profile_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `image`
--

INSERT INTO `image` (`id`, `code`, `title`, `profile_id`) VALUES
(1, 'sdfgswer45', 'Test', 1),
(2, 'sdfgswer45', 'Test', 1);

-- --------------------------------------------------------

--
-- Table structure for table `metric`
--

CREATE TABLE `metric` (
  `id` int(11) NOT NULL,
  `prize` varchar(10) NOT NULL,
  `score` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `metric`
--

INSERT INTO `metric` (`id`, `prize`, `score`) VALUES
(1, '1', 10),
(2, '1', 10);

-- --------------------------------------------------------

--
-- Table structure for table `profile`
--

CREATE TABLE `profile` (
  `id` int(11) NOT NULL,
  `name` varchar(59) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `fotoclub_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `profile`
--

INSERT INTO `profile` (`id`, `name`, `last_name`, `fotoclub_id`) VALUES
(1, 'admin', NULL, 1),
(2, 'admin', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `profile_contest`
--

CREATE TABLE `profile_contest` (
  `id` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `profile_contest`
--

INSERT INTO `profile_contest` (`id`, `profile_id`, `contest_id`) VALUES
(1, 1, 1),
(2, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id` int(11) NOT NULL,
  `type` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`id`, `type`) VALUES
(1, 'Administrador'),
(2, 'Delegado');

-- --------------------------------------------------------

--
-- Table structure for table `section`
--

CREATE TABLE `section` (
  `id` int(11) NOT NULL,
  `name` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `section`
--

INSERT INTO `section` (`id`, `name`) VALUES
(1, 'Monocromo'),
(2, 'Color');

-- --------------------------------------------------------

--
-- Table structure for table `user`
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
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `username`, `password_hash`, `password_reset_token`, `access_token`, `created_at`, `updated_at`, `status`, `role_id`, `profile_id`) VALUES
(1, 'admin', '$2y$13$maydzLNRwqH4cQP2L8FCQu6OxIU/.GpzxwRxcqM3Tnzhk9uLMzcrm', NULL, 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', NULL, NULL, 1, 1, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contest`
--
ALTER TABLE `contest`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contest_category`
--
ALTER TABLE `contest_category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_category_id` (`category_id`),
  ADD KEY `fk_contest_contest_id` (`contest_id`);

--
-- Indexes for table `contest_result`
--
ALTER TABLE `contest_result`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_result_metric_id` (`metric_id`),
  ADD KEY `fk_contest_result_contest_id` (`contest_id`),
  ADD KEY `fk_contest_result_image_id` (`image_id`);

--
-- Indexes for table `contest_section`
--
ALTER TABLE `contest_section`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_contest_section_id` (`section_id`),
  ADD KEY `fk_contest_contest2_id` (`contest_id`);

--
-- Indexes for table `fotoclub`
--
ALTER TABLE `fotoclub`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `image`
--
ALTER TABLE `image`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `metric`
--
ALTER TABLE `metric`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `profile`
--
ALTER TABLE `profile`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_profile_fotoclub_id` (`fotoclub_id`);

--
-- Indexes for table `profile_contest`
--
ALTER TABLE `profile_contest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_profile_contest_id` (`contest_id`),
  ADD KEY `fk_profile_profile_id` (`profile_id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `section`
--
ALTER TABLE `section`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_role_id` (`role_id`),
  ADD KEY `fk_user_profile_id` (`profile_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `contest`
--
ALTER TABLE `contest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `contest_category`
--
ALTER TABLE `contest_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `contest_result`
--
ALTER TABLE `contest_result`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contest_section`
--
ALTER TABLE `contest_section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `fotoclub`
--
ALTER TABLE `fotoclub`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `image`
--
ALTER TABLE `image`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `metric`
--
ALTER TABLE `metric`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `profile`
--
ALTER TABLE `profile`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `profile_contest`
--
ALTER TABLE `profile_contest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `section`
--
ALTER TABLE `section`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `contest_category`
--
ALTER TABLE `contest_category`
  ADD CONSTRAINT `fk_contest_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `contest_result`
--
ALTER TABLE `contest_result`
  ADD CONSTRAINT `fk_contest_result_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_result_image_id` FOREIGN KEY (`image_id`) REFERENCES `image` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_contest_result_metric_id` FOREIGN KEY (`metric_id`) REFERENCES `metric` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `contest_section`
--
ALTER TABLE `contest_section`
  ADD CONSTRAINT `fk_contest_contest2_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`),
  ADD CONSTRAINT `fk_contest_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `profile`
--
ALTER TABLE `profile`
  ADD CONSTRAINT `fk_profile_fotoclub_id` FOREIGN KEY (`fotoclub_id`) REFERENCES `fotoclub` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `profile_contest`
--
ALTER TABLE `profile_contest`
  ADD CONSTRAINT `fk_profile_contest_id` FOREIGN KEY (`contest_id`) REFERENCES `contest` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_profile_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`id`),
  ADD CONSTRAINT `fk_user_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
