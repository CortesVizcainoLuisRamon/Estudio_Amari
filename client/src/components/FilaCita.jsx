import { ESTADOS_CITA } from "../config/citas";
import { horaDe } from "../utils/fechas";
import { formatearMoneda } from "../utils/formato";
import { iniciales, primerNombre } from "../utils/agenda";

// Una cita en forma de fila: hora, barra con el color de la especialista, clienta, servicios y estado.
// `activa` la resalta; `mostrarEmpleada` y `mostrarTotal` agregan columnas; `accion` es un botón extra
// (por ejemplo "Confirmar") que va a la derecha, fuera del área que abre el detalle.
function FilaCita({ cita, activa = false, mostrarEmpleada = false, mostrarTotal = true, onSeleccionar, accion }) {
  const estado = ESTADOS_CITA[cita.estado];
  const inactiva = cita.estado === "cancelada" || cita.estado === "no_asistio";

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl transition hover:bg-amari-bg-soft ${
        activa ? "bg-amari-bg-soft ring-1 ring-amari-borde" : ""
      } ${inactiva ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSeleccionar(cita)}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left sm:gap-4"
      >
        <span className="min-w-14 shrink-0 whitespace-nowrap font-display text-lg font-semibold text-amari-titulo">
          {horaDe(cita.inicio)}
        </span>
        <span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: cita.color }} />
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amari-borde text-xs font-bold text-amari-primario-oscuro sm:flex">
          {iniciales(cita.cliente)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-amari-titulo">{cita.cliente}</span>
          <span className="block truncate text-sm">
            {cita.servicios.map((s) => s.nombre).join(", ")}
            {mostrarEmpleada && <span className="lg:hidden"> · {primerNombre(cita.empleada)}</span>}
          </span>
        </span>
        {mostrarEmpleada && (
          <span className="hidden w-24 shrink-0 items-center gap-2 text-sm lg:flex">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cita.color }} />
            <span className="truncate">{primerNombre(cita.empleada)}</span>
          </span>
        )}
        {mostrarTotal && (
          <span className="hidden min-w-[4.5rem] shrink-0 whitespace-nowrap text-right font-display text-base font-semibold text-amari-titulo sm:block">
            {formatearMoneda(cita.total)}
          </span>
        )}
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${estado.clase}`}>
          {estado.texto}
        </span>
      </button>

      {accion !== undefined && <div className="shrink-0 pr-3 sm:w-28 sm:pr-3">{accion || null}</div>}
    </div>
  );
}

export default FilaCita;
