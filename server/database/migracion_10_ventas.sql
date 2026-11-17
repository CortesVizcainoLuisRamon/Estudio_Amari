USE estudio_amari;

ALTER TABLE pedidos ADD COLUMN entregado_en TIMESTAMP NULL DEFAULT NULL;

-- Pedidos que ya estaban entregados: se toma su fecha de creación
UPDATE pedidos SET entregado_en = creado_en WHERE estado = 'entregado' AND entregado_en IS NULL;