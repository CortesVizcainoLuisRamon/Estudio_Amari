USE estudio_amari;

CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  tipo ENUM('confirmacion','recordatorio','promocion') NOT NULL,
  cita_id INT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('pendiente','enviada') NOT NULL DEFAULT 'pendiente',
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enviada_en TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_cita_tipo (cita_id, tipo),
  INDEX idx_cliente (cliente_id),
  INDEX idx_estado (estado)
) ENGINE=InnoDB;