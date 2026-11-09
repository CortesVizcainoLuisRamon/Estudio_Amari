USE estudio_amari;

-- Duraciones (minutos)
UPDATE servicios SET duracion_min = CASE nombre
  WHEN 'Makeup novias' THEN 120
  WHEN 'Makeup quinceañeras' THEN 90
  WHEN 'Makeup eventos sociales (graduaciones)' THEN 90
  WHEN 'Depilación de rostro' THEN 30
  WHEN 'Soft gel' THEN 80
  WHEN 'Uñas acrílicas' THEN 90
  WHEN 'Gelish' THEN 60
  WHEN 'Baño de acrílico' THEN 90
  WHEN 'Manicure y spa' THEN 50
  WHEN 'Retiro de acrílico y gelish' THEN 40
  WHEN 'Corte de dama' THEN 60
  WHEN 'Corte de caballero' THEN 30
  WHEN 'Tintes y efectos de color' THEN 150
  WHEN 'Tratamientos capilares' THEN 90
  WHEN 'Alaciado express' THEN 120
  WHEN 'Ondulado de cabello' THEN 60
  WHEN 'Alto peinado' THEN 90
  WHEN 'Pestañas clásica' THEN 120
  WHEN 'Pestañas híbridas' THEN 120
  WHEN 'Pestañas wispy' THEN 120
  WHEN 'Pestañas rimel' THEN 120
  WHEN 'Pestañas efecto mojado' THEN 120
  WHEN 'Pestañas volumen artesanal' THEN 150
  WHEN 'Pestañas mega volumen artesanal' THEN 180
  WHEN 'Levantamiento + pigmentación de pestañas' THEN 60
  WHEN 'Aplicación de pestañas en tira' THEN 30
  WHEN 'Aplicación de pestañas en grupo' THEN 60
  WHEN 'Cejas: laminado + diseño + henna + perfilado' THEN 75
  WHEN 'Cejas: laminado + diseño + perfilado' THEN 60
  ELSE duracion_min
END;

-- Precios de EJEMPLO tomados de la Figura 41 (solo si el servicio aún no tiene precio)
UPDATE servicios SET precio = CASE nombre
  WHEN 'Gelish' THEN 250
  WHEN 'Manicure y spa' THEN 180
  WHEN 'Retiro de acrílico y gelish' THEN 120
  WHEN 'Soft gel' THEN 320
  WHEN 'Uñas acrílicas' THEN 350
  WHEN 'Alaciado express' THEN 400
  WHEN 'Alto peinado' THEN 350
  WHEN 'Corte de caballero' THEN 150
  WHEN 'Corte de dama' THEN 150
  WHEN 'Tintes y efectos de color' THEN 550
  WHEN 'Pestañas clásica' THEN 450
  WHEN 'Pestañas wispy' THEN 500
  WHEN 'Pestañas volumen artesanal' THEN 550
  WHEN 'Pestañas mega volumen artesanal' THEN 650
  ELSE precio
END
WHERE precio IS NULL;