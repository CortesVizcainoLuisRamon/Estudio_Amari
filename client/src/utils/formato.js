export const formatearDuracion = (min) => {
  const horas = Math.floor(min / 60);
  const resto = min % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
};

export const formatearMoneda = (n) =>
  Number(n).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  });

export const etiquetaPrecio = (servicio) => {
  if (servicio.precio === null) return "Consultar";
  const monto = formatearMoneda(servicio.precio);
  return servicio.precio_desde ? `Desde ${monto}` : monto;
};

export const normalizarTexto = (t) =>
  (t ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");