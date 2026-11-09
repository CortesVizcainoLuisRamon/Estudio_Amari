const dos = (n) => String(n).padStart(2, "0");

export const aTexto = (fecha) =>
  `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;

export const deTexto = (texto) => {
  const [a, m, d] = texto.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const sumarDias = (fecha, n) => {
  const r = new Date(fecha);
  r.setDate(r.getDate() + n);
  return r;
};

export const inicioSemana = (fecha) => {
  const r = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dia = r.getDay();
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1));
  return r;
};

export const rangoSemana = (lunes) => {
  const domingo = sumarDias(lunes, 6);
  const corto = { day: "numeric", month: "short" };
  return `Semana del ${lunes.toLocaleDateString("es-MX", corto)} al ${domingo.toLocaleDateString(
    "es-MX",
    { ...corto, year: "numeric" }
  )}`;
};

// "2026-11-10 11:00" -> "11:00"
export const horaDe = (texto) => texto.slice(11, 16);

export const horaMasMinutos = (hora, minutos) => {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  return `${dos(Math.floor(total / 60))}:${dos(total % 60)}`;
};

export const fechaLarga = (texto) =>
  deTexto(texto).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });