USE estudio_amari;

-- Casilla "Requiere patch test"
ALTER TABLE servicios
  ADD COLUMN requiere_patch_test BOOLEAN NOT NULL DEFAULT FALSE AFTER duracion_min;

-- Categorías según el diseño (Figura 41)
UPDATE categorias_servicio SET nombre = CASE id
  WHEN 1 THEN 'Make-up'
  WHEN 2 THEN 'Nails'
  WHEN 3 THEN 'Hair'
  WHEN 4 THEN 'Eyelashes'
  WHEN 5 THEN 'Eyebrows'
END
WHERE id IN (1, 2, 3, 4, 5);

INSERT INTO categorias_servicio (id, nombre) VALUES (6, 'Lash lifting');

-- Servicios que cambian de categoría
UPDATE servicios SET categoria_id = 5 WHERE nombre = 'Depilación de rostro';

UPDATE servicios
SET categoria_id = 6, nombre = 'Levantamiento + pigmentación de pestañas'
WHERE nombre LIKE 'Lash lifting:%';