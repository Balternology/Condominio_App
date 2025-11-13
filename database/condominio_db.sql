-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-11-2025 a las 16:56:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `condominio_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anuncios`
--

CREATE TABLE `anuncios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `condominio_id` bigint(20) UNSIGNED NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` varchar(50) NOT NULL DEFAULT 'general',
  `autor_id` bigint(20) UNSIGNED NOT NULL,
  `fecha_publicacion` date NOT NULL,
  `fecha_expiracion` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `anuncios`
--

INSERT INTO `anuncios` (`id`, `condominio_id`, `titulo`, `contenido`, `tipo`, `autor_id`, `fecha_publicacion`, `fecha_expiracion`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Bienvenida a Nuevos Residentes', 'Damos la bienvenida a todos los nuevos residentes del condominio. Les recordamos revisar el reglamento interno y mantener las áreas comunes en orden.', 'general', 2, '2025-11-10', '2025-12-10', 1, '2025-11-11 01:52:11', '2025-11-11 01:52:11'),
(2, 1, 'Mantenimiento de Piscina', 'Se informa que la piscina estará cerrada para mantenimiento el próximo lunes de 8:00 a 16:00 horas. Disculpen las molestias.', 'mantenimiento', 2, '2025-11-10', '2025-11-17', 1, '2025-11-11 01:52:11', '2025-11-11 01:52:11'),
(3, 1, 'Asamblea de Copropietarios', 'Se convoca a todos los residentes a la asamblea de copropietarios que se realizará el próximo mes. Favor confirmar asistencia.', 'importante', 2, '2025-11-10', '2026-01-09', 1, '2025-11-11 01:52:11', '2025-11-11 01:52:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `condominios`
--

CREATE TABLE `condominios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `direccion` varchar(300) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `condominios`
--

INSERT INTO `condominios` (`id`, `nombre`, `direccion`, `created_at`, `updated_at`) VALUES
(1, 'Condominio Los Alerces', 'Av. Siempre Viva 1234, Santiago', '2025-11-11 01:28:37', '2025-11-11 01:28:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `espacios_comunes`
--

CREATE TABLE `espacios_comunes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `condominio_id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `requiere_pago` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `espacios_comunes`
--

INSERT INTO `espacios_comunes` (`id`, `condominio_id`, `nombre`, `requiere_pago`, `created_at`) VALUES
(1, 1, 'Quincho', 1, '2025-11-11 01:28:37'),
(2, 1, 'Multicancha', 1, '2025-11-11 01:28:52'),
(3, 1, 'Sala de Eventos', 1, '2025-11-11 01:28:52'),
(4, 1, 'Gimnasio', 0, '2025-11-11 01:28:52'),
(5, 1, 'Piscina', 0, '2025-11-11 01:28:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gastos_comunes`
--

CREATE TABLE `gastos_comunes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vivienda_id` bigint(20) UNSIGNED NOT NULL,
  `mes` int(11) NOT NULL,
  `ano` int(11) NOT NULL,
  `monto_total` decimal(14,2) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'pendiente',
  `vencimiento` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `gastos_comunes`
--

INSERT INTO `gastos_comunes` (`id`, `vivienda_id`, `mes`, `ano`, `monto_total`, `estado`, `vencimiento`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2025, 150000.00, 'pendiente', '2025-01-31', '2025-11-11 01:28:37', '2025-11-11 01:28:37'),
(2, 1, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(3, 1, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(4, 1, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(5, 1, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(6, 1, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(7, 2, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(8, 2, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(9, 2, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(10, 2, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(11, 2, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(12, 2, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(13, 3, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(14, 3, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(15, 3, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(16, 3, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(17, 3, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(18, 3, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(19, 4, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(20, 4, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(21, 4, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:28:52', '2025-11-11 01:28:52'),
(33, 4, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(34, 4, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(35, 4, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(36, 5, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(37, 5, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(38, 5, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(39, 5, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(40, 5, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(41, 5, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(42, 6, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(43, 6, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(44, 6, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(45, 6, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(46, 6, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(47, 6, 6, 2025, 150000.00, 'pagado', '2025-06-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(48, 7, 1, 2025, 150000.00, 'pagado', '2025-01-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(49, 7, 2, 2025, 150000.00, 'pagado', '2025-02-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(50, 7, 3, 2025, 150000.00, 'pagado', '2025-03-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(51, 7, 4, 2025, 150000.00, 'pagado', '2025-04-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51'),
(52, 7, 5, 2025, 150000.00, 'pagado', '2025-05-28', '2025-11-11 01:30:51', '2025-11-11 01:30:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `multas`
--

CREATE TABLE `multas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `vivienda_id` bigint(20) UNSIGNED NOT NULL,
  `monto` decimal(14,2) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `fecha_aplicada` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Volcado de datos para la tabla `multas`
--

INSERT INTO `multas` (`id`, `vivienda_id`, `monto`, `descripcion`, `fecha_aplicada`, `created_at`) VALUES
(1, 1, 25000.00, 'Ruidos molestos', '2025-10-31', '2025-11-11 01:28:37'),
(2, 1, 35000.00, 'Basura fuera del horario', '2025-10-27', '2025-11-11 01:28:52'),
(3, 2, 35000.00, 'Basura fuera del horario', '2025-10-26', '2025-11-11 01:28:52'),
(4, 3, 35000.00, 'Basura fuera del horario', '2025-11-02', '2025-11-11 01:28:52'),
(5, 4, 35000.00, 'Basura fuera del horario', '2025-10-30', '2025-11-11 01:28:52'),
(6, 5, 35000.00, 'Basura fuera del horario', '2025-10-16', '2025-11-11 01:28:52'),
(9, 1, 25000.00, 'Basura fuera del horario', '2025-10-23', '2025-11-11 01:30:51'),
(10, 2, 15000.00, 'Basura fuera del horario', '2025-11-06', '2025-11-11 01:30:51'),
(11, 3, 25000.00, 'Basura fuera del horario', '2025-10-28', '2025-11-11 01:30:51'),
(12, 4, 15000.00, 'Basura fuera del horario', '2025-10-23', '2025-11-11 01:30:51'),
(13, 5, 15000.00, 'Mascota sin correa', '2025-11-05', '2025-11-11 01:30:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gasto_comun_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `monto_pagado` decimal(14,2) NOT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  `metodo_pago` varchar(30) NOT NULL DEFAULT 'webpay'
) ;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `gasto_comun_id`, `usuario_id`, `monto_pagado`, `fecha_pago`, `metodo_pago`) VALUES
(1, 2, 1, 150000.00, '2025-02-27 03:00:00', 'efectivo'),
(2, 3, 1, 150000.00, '2025-03-24 03:00:00', 'webpay'),
(3, 4, 1, 150000.00, '2025-04-22 04:00:00', 'webpay'),
(4, 5, 1, 150000.00, '2025-05-20 04:00:00', 'efectivo'),
(5, 6, 1, 150000.00, '2025-06-24 04:00:00', 'webpay');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `espacio_comun_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `fecha_hora_inicio` datetime NOT NULL,
  `fecha_hora_fin` datetime NOT NULL,
  `monto_pago` decimal(14,2) NOT NULL DEFAULT 0.00,
  `estado_pago` varchar(20) NOT NULL DEFAULT 'pendiente',
  `google_event_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id`, `espacio_comun_id`, `usuario_id`, `fecha_hora_inicio`, `fecha_hora_fin`, `monto_pago`, `estado_pago`, `google_event_id`, `created_at`) VALUES
(1, 1, 1, '2025-11-17 22:28:37', '2025-11-18 02:28:37', 10000.00, 'pendiente', NULL, '2025-11-11 01:28:37'),
(3, 1, 1, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pagado', NULL, '2025-11-11 01:30:51'),
(4, 1, 2, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pendiente', NULL, '2025-11-11 01:30:51'),
(5, 2, 1, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pagado', NULL, '2025-11-11 01:30:51'),
(6, 2, 2, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pendiente', NULL, '2025-11-11 01:30:51'),
(7, 3, 1, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pendiente', NULL, '2025-11-11 01:30:51'),
(8, 3, 2, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 10000.00, 'pendiente', NULL, '2025-11-11 01:30:51'),
(9, 4, 1, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 0.00, 'pagado', NULL, '2025-11-11 01:30:51'),
(10, 4, 2, '2025-11-12 08:30:51', '2025-11-12 10:30:51', 0.00, 'pagado', NULL, '2025-11-11 01:30:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `residentes_viviendas`
--

CREATE TABLE `residentes_viviendas` (
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `vivienda_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `residentes_viviendas`
--

INSERT INTO `residentes_viviendas` (`usuario_id`, `vivienda_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(200) NOT NULL,
  `rol` varchar(30) NOT NULL DEFAULT 'Residente',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notificaciones_email` tinyint(1) NOT NULL DEFAULT 1,
  `notificaciones_push` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `email`, `password_hash`, `nombre_completo`, `rol`, `is_active`, `last_login`, `created_at`, `updated_at`, `notificaciones_email`, `notificaciones_push`) VALUES
(1, 'residente@example.com', '$2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry', 'Juan Pérez', 'Residente', 1, '2025-11-11 04:46:29', '2025-11-11 01:28:37', '2025-11-11 03:49:51', 1, 1),
(2, 'admin@example.com', '$2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry', 'María González', 'Administrador', 1, '2025-11-11 06:12:49', '2025-11-11 01:28:37', '2025-11-11 03:12:49', 1, 1),
(3, 'conserje@example.com', '$2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry', 'Carlos Ramírez', 'Conserje', 1, NULL, '2025-11-11 01:28:37', '2025-11-11 01:28:37', 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `viviendas`
--

CREATE TABLE `viviendas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `condominio_id` bigint(20) UNSIGNED NOT NULL,
  `numero_vivienda` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cargo_fijo_uf` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `viviendas`
--

INSERT INTO `viviendas` (`id`, `condominio_id`, `numero_vivienda`, `created_at`, `updated_at`, `cargo_fijo_uf`) VALUES
(1, 1, 'Dpto 101', '2025-11-11 01:28:37', '2025-11-11 01:28:37', 0.00),
(2, 1, 'Dpto 102', '2025-11-11 01:28:37', '2025-11-11 01:28:37', 0.00),
(3, 1, 'Dpto 103', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50),
(4, 1, 'Dpto 104', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50),
(5, 1, 'Dpto 105', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50),
(6, 1, 'Dpto 201', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50),
(7, 1, 'Dpto 202', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50),
(8, 1, 'Dpto 203', '2025-11-11 01:28:52', '2025-11-11 01:28:52', 0.50);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `anuncios`
--
ALTER TABLE `anuncios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_anuncios_condominio` (`condominio_id`),
  ADD KEY `fk_anuncios_autor` (`autor_id`);

--
-- Indices de la tabla `condominios`
--
ALTER TABLE `condominios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_condominios_nombre` (`nombre`);

--
-- Indices de la tabla `espacios_comunes`
--
ALTER TABLE `espacios_comunes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_espacios_condominio_nombre` (`condominio_id`,`nombre`),
  ADD KEY `idx_espacios_condominio_id` (`condominio_id`);

--
-- Indices de la tabla `gastos_comunes`
--
ALTER TABLE `gastos_comunes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_gastos_vivienda_mes_ano` (`vivienda_id`,`mes`,`ano`),
  ADD KEY `idx_gastos_vivienda_id` (`vivienda_id`);

--
-- Indices de la tabla `multas`
--
ALTER TABLE `multas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_multas_vivienda_id` (`vivienda_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pagos_gasto_id` (`gasto_comun_id`),
  ADD KEY `idx_pagos_usuario_id` (`usuario_id`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reservas_espacio_id` (`espacio_comun_id`),
  ADD KEY `idx_reservas_usuario_id` (`usuario_id`);

--
-- Indices de la tabla `residentes_viviendas`
--
ALTER TABLE `residentes_viviendas`
  ADD PRIMARY KEY (`usuario_id`,`vivienda_id`),
  ADD KEY `idx_resviv_usuario_id` (`usuario_id`),
  ADD KEY `idx_resviv_vivienda_id` (`vivienda_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- Indices de la tabla `viviendas`
--
ALTER TABLE `viviendas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_viviendas_condominio_numero` (`condominio_id`,`numero_vivienda`),
  ADD KEY `idx_viviendas_condominio_id` (`condominio_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `anuncios`
--
ALTER TABLE `anuncios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `condominios`
--
ALTER TABLE `condominios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `espacios_comunes`
--
ALTER TABLE `espacios_comunes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `gastos_comunes`
--
ALTER TABLE `gastos_comunes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `multas`
--
ALTER TABLE `multas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `viviendas`
--
ALTER TABLE `viviendas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `anuncios`
--
ALTER TABLE `anuncios`
  ADD CONSTRAINT `fk_anuncios_autor` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anuncios_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `espacios_comunes`
--
ALTER TABLE `espacios_comunes`
  ADD CONSTRAINT `fk_espacios_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `gastos_comunes`
--
ALTER TABLE `gastos_comunes`
  ADD CONSTRAINT `fk_gastos_vivienda` FOREIGN KEY (`vivienda_id`) REFERENCES `viviendas` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `multas`
--
ALTER TABLE `multas`
  ADD CONSTRAINT `fk_multas_vivienda` FOREIGN KEY (`vivienda_id`) REFERENCES `viviendas` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_gasto` FOREIGN KEY (`gasto_comun_id`) REFERENCES `gastos_comunes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `fk_reservas_espacio` FOREIGN KEY (`espacio_comun_id`) REFERENCES `espacios_comunes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `residentes_viviendas`
--
ALTER TABLE `residentes_viviendas`
  ADD CONSTRAINT `fk_residentes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_residentes_vivienda` FOREIGN KEY (`vivienda_id`) REFERENCES `viviendas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `viviendas`
--
ALTER TABLE `viviendas`
  ADD CONSTRAINT `fk_viviendas_condominio` FOREIGN KEY (`condominio_id`) REFERENCES `condominios` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
