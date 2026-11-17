USE estudio_amari;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  estado ENUM('pendiente', 'confirmado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  metodo_pago ENUM('transferencia', 'efectivo') NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (cliente_id),
  INDEX (estado)
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  variante_id INT NOT NULL,
  producto VARCHAR(120) NOT NULL,
  variante VARCHAR(60) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (variante_id) REFERENCES variantes_producto(id)
);