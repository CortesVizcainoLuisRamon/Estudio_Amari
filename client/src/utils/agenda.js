// Utilidades para la agenda del día. Las horas llegan del servidor como "2026-11-23 14:30".

export const ESTADOS_ACTIVOS = ["pendiente", "confirmada"];

export const minutosDe = (texto) => Number(texto.slice(11, 13)) * 60 + Number(texto.slice(14, 16));

export const minutosDeAhora = (ahora) => ahora.getHours() * 60 + ahora.getMinutes();

export const primerNombre = (nombre) => (nombre ?? "").trim().split(/\s+/)[0] ?? "";

// "María Luisa Rojas" -> "ML"
export function iniciales(nombre) {
  return (nombre ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();
}

// 90 -> "1 h 30 min", 45 -> "45 min", 120 -> "2 h"
export function duracionTexto(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// porAtender = citas abiertas que aún no terminan; sinCerrar = abiertas cuya hora ya pasó
// (nadie las marcó como completadas, canceladas o inasistencias).
export function resumenDia(citas, ahora) {
  const ahoraMin = minutosDeAhora(ahora);
  const abiertas = citas.filter((c) => ESTADOS_ACTIVOS.includes(c.estado));
  const porAtender = abiertas.filter((c) => minutosDe(c.fin) > ahoraMin).length;

  return {
    total: citas.length,
    completadas: citas.filter((c) => c.estado === "completada").length,
    porAtender,
    sinCerrar: abiertas.length - porAtender,
  };
}

// La cita en curso o, si no hay, la siguiente del día. null si ya no queda ninguna.
export function citaActual(citas, ahora) {
  const ahoraMin = minutosDeAhora(ahora);
  const cita = citas.find((c) => ESTADOS_ACTIVOS.includes(c.estado) && minutosDe(c.fin) > ahoraMin);
  if (!cita) return null;

  const enCurso = minutosDe(cita.inicio) <= ahoraMin;
  const minutos = (enCurso ? minutosDe(cita.fin) : minutosDe(cita.inicio)) - ahoraMin;
  return { cita, enCurso, minutos };
}

export function textoFaltan(minutos, enCurso) {
  if (enCurso) return `termina en ${duracionTexto(minutos)}`;
  return minutos <= 0 ? "ahora" : `en ${duracionTexto(minutos)}`;
}