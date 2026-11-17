export const ESTADOS_PEDIDO = {
  pendiente: { texto: "Pendiente", clase: "bg-amber-100 text-amber-700" },
  confirmado: { texto: "Confirmado", clase: "bg-sky-100 text-sky-700" },
  entregado: { texto: "Entregado", clase: "bg-green-100 text-green-700" },
  cancelado: { texto: "Cancelado", clase: "bg-gray-100 text-gray-500" },
};

export const METODOS_PAGO = {
  transferencia: "Transferencia / SPEI",
  efectivo: "Efectivo en tienda",
};

// Enlace que abre WhatsApp con el mensaje ya escrito
export const enlaceWhatsApp = (telefono, mensaje) => {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const numero = digitos.length === 10 ? `52${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};