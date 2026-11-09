USE estudio_amari;

ALTER TABLE empleados
  ADD COLUMN comision_pct DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER puesto,
  ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#e879f9' AFTER comision_pct,
  ADD COLUMN dias_laborales VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5,6' AFTER color;