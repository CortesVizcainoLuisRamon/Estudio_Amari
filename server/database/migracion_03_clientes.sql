USE estudio_amari;

ALTER TABLE clientes
  ADD COLUMN fecha_nacimiento DATE NULL AFTER email;