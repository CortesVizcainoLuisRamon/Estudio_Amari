import { partesFecha } from "../utils/fechas";

// Cuadrito con el mes y el día de una cita. `grande` es el de la tarjeta de próxima cita.
function FechaCita({ inicio, grande = false }) {
  const { mes, dia, diaSemana } = partesFecha(inicio);

  const chico = (
    <div
      className={`h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-amari-borde bg-amari-bg-soft ${
        grande ? "flex sm:hidden" : "flex"
      }`}
    >
      <span className="text-[10px] font-bold tracking-[0.16em] text-amari-primario-oscuro">{mes}</span>
      <span className="font-display text-xl font-semibold leading-tight text-amari-titulo">{dia}</span>
    </div>
  );

  if (!grande) return chico;

  return (
    <>
      {chico}
      <div className="hidden h-28 w-24 shrink-0 flex-col items-center justify-center rounded-3xl border border-amari-borde bg-white shadow-md shadow-amari-primario/10 sm:flex">
        <span className="text-xs font-bold tracking-[0.18em] text-amari-primario-oscuro">{mes}</span>
        <span className="font-display text-5xl font-semibold leading-none text-amari-titulo">{dia}</span>
        <span className="mt-1 text-xs capitalize">{diaSemana}</span>
      </div>
    </>
  );
}

export default FechaCita;