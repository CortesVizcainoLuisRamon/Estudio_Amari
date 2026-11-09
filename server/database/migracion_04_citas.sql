USE estudio_amari;

-- Todavía no hay citas, por eso se pueden recrear sin perder datos
DROP TABLE IF EXISTS cita_servicios;
DROP TABLE IF EXISTS citas;

CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  empleado_id INT NOT NULL,
  inicio DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio')
    NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  INDEX idx_empleado_horario (empleado_id, inicio, fin),
  INDEX idx_inicio (inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cita_servicios (
  cita_id INT NOT NULL,
  servicio_id INT NOT NULL,
  precio DECIMAL(10,2) NULL,
  duracion_min INT NOT NULL,
  PRIMARY KEY (cita_id, servicio_id),
  FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;