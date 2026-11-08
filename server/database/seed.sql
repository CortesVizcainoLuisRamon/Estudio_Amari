USE estudio_amari;

INSERT INTO categorias_servicio (id, nombre) VALUES
  (1, 'Rostro y depilación'),
  (2, 'Manicura y pedicura'),
  (3, 'Cabello y color'),
  (4, 'Pestañas'),
  (5, 'Cejas');

INSERT INTO servicios (categoria_id, nombre, duracion_min) VALUES
  (1, 'Makeup novias', 120),
  (1, 'Makeup quinceañeras', 90),
  (1, 'Makeup eventos sociales (graduaciones)', 90),
  (1, 'Depilación de rostro', 30),

  (2, 'Soft gel', 120),
  (2, 'Uñas acrílicas', 150),
  (2, 'Gelish', 60),
  (2, 'Baño de acrílico', 90),
  (2, 'Manicure y spa', 60),
  (2, 'Retiro de acrílico y gelish', 45),

  (3, 'Corte de dama', 60),
  (3, 'Corte de caballero', 30),
  (3, 'Tintes y efectos de color', 180),
  (3, 'Tratamientos capilares', 90),
  (3, 'Alaciado express', 90),
  (3, 'Ondulado de cabello', 60),
  (3, 'Alto peinado', 90),

  (4, 'Pestañas clásica', 120),
  (4, 'Pestañas híbridas', 120),
  (4, 'Pestañas wispy', 120),
  (4, 'Pestañas rimel', 120),
  (4, 'Pestañas efecto mojado', 120),
  (4, 'Pestañas volumen artesanal', 150),
  (4, 'Pestañas mega volumen artesanal', 180),
  (4, 'Lash lifting: levantamiento + pigmentación', 60),
  (4, 'Aplicación de pestañas en tira', 30),
  (4, 'Aplicación de pestañas en grupo', 60),

  (5, 'Cejas: laminado + diseño + henna + perfilado', 60),
  (5, 'Cejas: laminado + diseño + perfilado', 45);