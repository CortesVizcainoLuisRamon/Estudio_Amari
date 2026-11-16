USE estudio_amari;

CREATE TABLE IF NOT EXISTS insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  categoria VARCHAR(60) NOT NULL DEFAULT 'Otros',
  unidad VARCHAR(20) NOT NULL DEFAULT 'unidad',
  stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  usuario_id INT NULL,
  tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  stock_anterior DECIMAL(10,2) NOT NULL,
  stock_nuevo DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(200) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (usuario_id),
  FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);

-- Insumos de EJEMPLO tomados de tu diseño (puedes archivarlos o borrarlos después)
INSERT IGNORE INTO insumos (nombre, categoria, unidad, stock, stock_minimo) VALUES
  ('Acetona', 'Insumos Generales', 'litro', 4, 1),
  ('Gel UV Clear', 'Geles y Acrílicos', 'ml', 250, 50),
  ('Guantes de látex (caja)', 'Insumos Generales', 'caja', 6, 2),
  ('Líquido acrílico', 'Geles y Acrílicos', 'ml', 200, 50),
  ('Pegamento para pestañas', 'Pestañas', 'ml', 1.5, 2),
  ('Pestañas sintéticas C-Curl 0.15', 'Pestañas', 'caja', 12, 4),
  ('Polvo acrílico rosa', 'Geles y Acrílicos', 'gr', 150, 30),
  ('Revelador 20 vol 1L', 'Tintes y Coloración', 'litro', 3, 1),
  ('Tinte rubio ceniza 90ml', 'Tintes y Coloración', 'tubo', 8, 3);