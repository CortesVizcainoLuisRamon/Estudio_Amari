export const ESTADOS_CITA = {
  pendiente: { texto: "Pendiente", clase: "bg-amber-100 text-amber-700" },
  confirmada: { texto: "Confirmada", clase: "bg-sky-100 text-sky-700" },
  completada: { texto: "Completada", clase: "bg-green-100 text-green-700" },
  cancelada: { texto: "Cancelada", clase: "bg-gray-100 text-gray-500" },
  no_asistio: { texto: "No asistió", clase: "bg-red-100 text-red-600" },
};

const SECUNDARIO =
  "rounded-full border border-amari-borde px-4 py-2 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft disabled:opacity-60";
const PELIGRO =
  "rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60";

export const ACCIONES_CITA = [
  { estado: "confirmada", texto: "Confirmar", desde: ["pendiente"], clase: "btn-primario" },
  {
    estado: "completada",
    texto: "Marcar completada",
    desde: ["pendiente", "confirmada"],
    clase: "btn-primario",
  },
  { estado: "no_asistio", texto: "No asistió", desde: ["pendiente", "confirmada"], clase: SECUNDARIO },
  { estado: "cancelada", texto: "Cancelar cita", desde: ["pendiente", "confirmada"], clase: PELIGRO },
];