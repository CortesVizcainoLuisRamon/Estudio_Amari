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

export const fechaLarga = (texto) => {
  const fecha = deTexto(texto).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
};

// ---------- Fechas de citas (llegan como "2026-11-26 11:30") ----------

// "2026-11-26 11:30" -> Date
export function aFecha(texto) {
  const [a, m, d] = texto.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d, Number(texto.slice(11, 13)) || 0, Number(texto.slice(14, 16)) || 0);
}

// Para el cuadrito de fecha: { mes: "NOV", dia: "26", diaSemana: "jueves" }
export function partesFecha(texto) {
  const f = aFecha(texto);
  return {
    mes: f.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase(),
    dia: String(f.getDate()).padStart(2, "0"),
    diaSemana: f.toLocaleDateString("es-MX", { weekday: "long" }),
  };
}

// "4 de noviembre"
export const diaYMes = (texto) =>
  aFecha(texto).toLocaleDateString("es-MX", { day: "numeric", month: "long" });

// "Faltan 3 días", "Es mañana", "Empieza en 40 min"...
export function faltaTexto(inicio, ahora) {
  const f = aFecha(inicio);
  const minutos = Math.round((f - ahora) / 60000);

  if (minutos <= 0) return "Es ahora";
  if (minutos < 60) return `Empieza en ${minutos} min`;

  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const dia = new Date(f.getFullYear(), f.getMonth(), f.getDate());
  const dias = Math.round((dia - hoy) / 86400000);

  if (dias === 0) return "Es hoy";
  if (dias === 1) return "Es mañana";
  return `Faltan ${dias} días`;
}
