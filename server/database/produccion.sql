-- Estudio Amari: estructura final + catalogo inicial (categorias, servicios e insumos base).
-- Para una base NUEVA y vacia (por ejemplo TiDB Cloud). No incluye usuarios ni datos de prueba.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `categorias_servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `categorias_servicio` VALUES
(5,'Eyebrows'),
(4,'Eyelashes'),
(3,'Hair'),
(6,'Lash lifting'),
(1,'Make-up'),
(2,'Nails');
CREATE TABLE `cita_servicios` (
  `cita_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `duracion_min` int(11) NOT NULL,
  PRIMARY KEY (`cita_id`,`servicio_id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `cita_servicios_ibfk_1` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cita_servicios_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `citas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `empleado_id` int(11) NOT NULL,
  `inicio` datetime NOT NULL,
  `fin` datetime NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estado` enum('pendiente','confirmada','completada','cancelada','no_asistio') NOT NULL DEFAULT 'pendiente',
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `canje_fidelidad` tinyint(1) NOT NULL DEFAULT 0,
  `descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `idx_empleado_horario` (`empleado_id`,`inicio`,`fin`),
  KEY `idx_inicio` (`inicio`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(80) NOT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `empleado_servicio` (
  `empleado_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  PRIMARY KEY (`empleado_id`,`servicio_id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `empleado_servicio_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `empleado_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `empleados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `puesto` varchar(60) DEFAULT NULL,
  `comision_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `color` varchar(7) NOT NULL DEFAULT '#e879f9',
  `dias_laborales` varchar(20) NOT NULL DEFAULT '1,2,3,4,5,6',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `insumos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `categoria` varchar(60) NOT NULL DEFAULT 'Otros',
  `unidad` varchar(20) NOT NULL DEFAULT 'unidad',
  `stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `costo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `insumos` VALUES
(1,'Acetona','Insumos Generales','litro',4.00,1.00,0.00,1,'2026-11-27 07:02:55'),
(2,'Gel UV Clear','Geles y Acrílicos','ml',250.00,50.00,0.00,1,'2026-11-27 07:02:55'),
(3,'Guantes de látex (caja)','Insumos Generales','caja',6.00,2.00,0.00,1,'2026-11-27 07:02:55'),
(4,'Líquido acrílico','Geles y Acrílicos','ml',200.00,50.00,0.00,1,'2026-11-27 07:02:55'),
(5,'Pegamento para pestañas','Pestañas','ml',1.50,2.00,0.00,1,'2026-11-27 07:02:55'),
(6,'Pestañas sintéticas C-Curl 0.15','Pestañas','caja',12.00,4.00,0.00,1,'2026-11-27 07:02:55'),
(7,'Polvo acrílico rosa','Geles y Acrílicos','gr',150.00,30.00,0.00,1,'2026-11-27 07:02:55'),
(8,'Revelador 20 vol 1L','Tintes y Coloración','litro',3.00,1.00,0.00,1,'2026-11-27 07:02:55'),
(9,'Tinte rubio ceniza 90ml','Tintes y Coloración','tubo',8.00,3.00,0.00,1,'2026-11-27 07:02:55');
CREATE TABLE `movimientos_inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `insumo_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo` enum('entrada','salida','ajuste') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `stock_anterior` decimal(10,2) NOT NULL,
  `stock_nuevo` decimal(10,2) NOT NULL,
  `motivo` varchar(200) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `insumo_id` (`insumo_id`),
  CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `tipo` enum('confirmacion','recordatorio','promocion') NOT NULL,
  `cita_id` int(11) DEFAULT NULL,
  `mensaje` text NOT NULL,
  `estado` enum('pendiente','enviada') NOT NULL DEFAULT 'pendiente',
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `creada_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `enviada_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cita_tipo` (`cita_id`,`tipo`),
  KEY `idx_cliente` (`cliente_id`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `variante_id` int(11) NOT NULL,
  `producto` varchar(120) NOT NULL,
  `variante` varchar(60) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `variante_id` (`variante_id`),
  CONSTRAINT `pedido_items_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pedido_items_ibfk_2` FOREIGN KEY (`variante_id`) REFERENCES `variantes_producto` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `estado` enum('pendiente','confirmado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `metodo_pago` enum('transferencia','efectivo') NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `entregado_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `categoria` varchar(60) NOT NULL DEFAULT 'Accesorios',
  `precio` decimal(10,2) NOT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `tipo_variante` varchar(30) NOT NULL DEFAULT 'Color',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoria_id` int(11) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `precio_desde` tinyint(1) NOT NULL DEFAULT 0,
  `duracion_min` int(11) NOT NULL,
  `requiere_patch_test` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `aplica_fidelidad` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `servicios_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_servicio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `servicios` VALUES
(1,1,'Makeup novias',NULL,NULL,0,120,0,1,0),
(2,1,'Makeup quinceañeras',NULL,NULL,0,90,0,1,0),
(3,1,'Makeup eventos sociales (graduaciones)',NULL,NULL,0,90,0,1,0),
(4,5,'Depilación de rostro',NULL,NULL,0,30,0,1,0),
(5,2,'Soft gel',NULL,320.00,0,80,0,1,0),
(6,2,'Uñas acrílicas',NULL,350.00,0,90,0,1,0),
(7,2,'Gelish',NULL,250.00,0,60,0,1,1),
(8,2,'Baño de acrílico',NULL,NULL,0,90,0,1,0),
(9,2,'Manicure y spa',NULL,180.00,0,50,0,1,1),
(10,2,'Retiro de acrílico y gelish',NULL,120.00,0,40,0,1,0),
(11,3,'Corte de dama',NULL,150.00,0,60,0,1,1),
(12,3,'Corte de caballero',NULL,150.00,0,30,0,1,1),
(13,3,'Tintes y efectos de color',NULL,550.00,0,150,0,1,0),
(14,3,'Tratamientos capilares',NULL,NULL,0,90,0,1,0),
(15,3,'Alaciado express',NULL,400.00,0,120,0,1,0),
(16,3,'Ondulado de cabello',NULL,NULL,0,60,0,1,0),
(17,3,'Alto peinado',NULL,350.00,0,90,0,1,1),
(18,4,'Pestañas clásica',NULL,450.00,0,120,0,1,0),
(19,4,'Pestañas híbridas',NULL,NULL,0,120,0,1,0),
(20,4,'Pestañas wispy',NULL,500.00,0,120,0,1,0),
(21,4,'Pestañas rimel',NULL,NULL,0,120,0,1,0),
(22,4,'Pestañas efecto mojado',NULL,NULL,0,120,0,1,0),
(23,4,'Pestañas volumen artesanal',NULL,550.00,0,150,0,1,0),
(24,4,'Pestañas mega volumen artesanal',NULL,650.00,0,180,0,1,0),
(25,6,'Levantamiento + pigmentación de pestañas',NULL,NULL,0,60,0,1,0),
(26,4,'Aplicación de pestañas en tira',NULL,NULL,0,30,0,1,0),
(27,4,'Aplicación de pestañas en grupo',NULL,NULL,0,60,0,1,0),
(28,5,'Cejas: laminado + diseño + henna + perfilado',NULL,NULL,0,75,0,1,0),
(29,5,'Cejas: laminado + diseño + perfilado',NULL,NULL,0,60,0,1,0);
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','empleado','cliente') NOT NULL DEFAULT 'cliente',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `debe_cambiar_clave` tinyint(1) NOT NULL DEFAULT 0,
  `foto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `variantes_producto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `producto_id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `variantes_producto_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
