USE estudio_amari;

ALTER TABLE citas
  ADD COLUMN canje_fidelidad BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE servicios
  ADD COLUMN aplica_fidelidad BOOLEAN NOT NULL DEFAULT FALSE;

-- Servicios de la tarjeta: Peinado, Corte, Manicure o Gelish
UPDATE servicios SET aplica_fidelidad = TRUE
WHERE nombre IN ('Alto peinado', 'Corte de dama', 'Corte de caballero', 'Manicure y spa', 'Gelish');