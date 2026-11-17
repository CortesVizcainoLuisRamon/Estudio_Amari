import { CalendarCheck, Clock, Megaphone } from "lucide-react";

// Número del estudio para el botón "Ver en WA" de la clienta (con prefijo de país)
export const WHATSAPP_ESTUDIO = "520000000000"; // ← pon aquí el número real

export const TIPOS_NOTIFICACION = {
  confirmacion: { texto: "Confirmación", icono: CalendarCheck, color: "bg-green-100 text-green-700" },
  recordatorio: { texto: "Recordatorio", icono: Clock, color: "bg-amber-100 text-amber-700" },
  promocion: { texto: "Promoción", icono: Megaphone, color: "bg-pink-100 text-pink-700" },
};

export const enlaceWA = (telefono, mensaje) => {
  let numero = String(telefono ?? "").replace(/\D/g, "");
  if (numero.length === 10) numero = `52${numero}`;
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
};