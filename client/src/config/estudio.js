// Datos públicos del estudio. Se usan en el login y donde haga falta.

export const ESTUDIO = {
  nombre: "Estudio Amari",
  direccion: "Av. Ticomán 839, Col. Ticomán",
  telefono: "(55) 8252-4200",
  telefonoLink: "+525582524200",
};

// HORARIO PROVISIONAL: cambia estas horas por las reales del estudio.
// Llave = día de la semana (0 = domingo ... 6 = sábado). null = cerrado.
// Formato 24 horas "HH:MM".
export const HORARIO = {
  0: null,
  1: { abre: "10:00", cierra: "21:00" },
  2: { abre: "10:00", cierra: "21:00" },
  3: { abre: "10:00", cierra: "21:00" },
  4: { abre: "10:00", cierra: "21:00" },
  5: { abre: "10:00", cierra: "21:00" },
  6: { abre: "10:00", cierra: "21:00" },
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const formatoHora = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${sufijo}`;
};

// Devuelve { abierto, texto } según la hora actual del dispositivo.
export function estadoHoy(ahora = new Date()) {
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = HORARIO[ahora.getDay()];

  if (hoy && minutos >= aMinutos(hoy.abre) && minutos < aMinutos(hoy.cierra)) {
    return { abierto: true, texto: `Abierto hoy hasta las ${formatoHora(hoy.cierra)}` };
  }
  if (hoy && minutos < aMinutos(hoy.abre)) {
    return { abierto: false, texto: `Abre hoy a las ${formatoHora(hoy.abre)}` };
  }

  for (let i = 1; i <= 7; i++) {
    const dia = (ahora.getDay() + i) % 7;
    const h = HORARIO[dia];
    if (h) {
      const cuando = i === 1 ? "mañana" : `el ${DIAS[dia]}`;
      return { abierto: false, texto: `Cerrado · abre ${cuando} a las ${formatoHora(h.abre)}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}

// "Buenos días" / "Buenas tardes" / "Buenas noches"
export function saludo(ahora = new Date()) {
  const h = ahora.getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}