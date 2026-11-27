import { ESTADOS_CITA } from "../config/citas";
import { horaDe } from "../utils/fechas";
import {
  citaActual,
  duracionTexto,
  iniciales,
  minutosDe,
  primerNombre,
  resumenDia,
  textoFaltan,
} from "../utils/agenda";

const RADIO = 44;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function Avance({ resumen }) {
  const { total, completadas, porAtender, sinCerrar } = resumen;
  const proporcion = total === 0 ? 0 : completadas / total;

  return (
    <div className="flex items-center gap-5 xl:pr-4">
      <svg
        width="104"
        height="104"
        viewBox="0 0 104 104"
        className="shrink-0"
        role="img"
        aria-label={`${completadas} de ${total} citas completadas`}
      >
        <circle cx="52" cy="52" r={RADIO} fill="none" strokeWidth="10" className="stroke-amari-borde" />
        {completadas > 0 && (
          <circle
            cx="52"
            cy="52"
            r={RADIO}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-amari-primario"
            strokeDasharray={`${proporcion * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
            transform="rotate(-90 52 52)"
          />
        )}
        <text
          x="52"
          y="60"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          className="fill-amari-titulo font-display"
        >
          {completadas}/{total}
        </text>
      </svg>

      <div>
        <p className="font-display text-lg font-semibold text-amari-titulo">Avance del día</p>
        <p className="mt-1 text-sm leading-relaxed">
          {completadas} {completadas === 1 ? "cita completada" : "citas completadas"}
          <br />
          {porAtender === 0 ? "nada por atender" : `${porAtender} por atender`}
        </p>
        {sinCerrar > 0 && (
          <p className="mt-1 text-sm font-semibold text-amber-700">{sinCerrar} sin cerrar</p>
        )}
      </div>
    </div>
  );
}

// Tarjeta grande de arriba: la cita en curso (o la siguiente) y el avance del día.
function HeroDia({ citas, ahora, mostrarEmpleada = false, onSeleccionar }) {
  const resumen = resumenDia(citas, ahora);
  const actual = citaActual(citas, ahora);
  const cita = actual?.cita;
  const estado = cita ? ESTADOS_CITA[cita.estado] : null;

  return (
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-amari-borde bg-linear-to-br from-white via-amari-bg-soft to-pink-100 p-6 shadow-lg shadow-amari-primario/10 sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-36 hidden h-80 w-80 rounded-full border border-amari-acento/25 sm:block"
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-10">
        <div className="xl:shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amari-primario-oscuro">
            {actual ? (actual.enCurso ? "En curso" : "Próxima cita") : "Agenda de hoy"}
          </p>

          {cita ? (
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="font-display text-6xl font-semibold leading-none text-amari-titulo">
                {horaDe(cita.inicio)}
              </span>
              <span className="mb-1 whitespace-nowrap rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-amari-primario-oscuro">
                {textoFaltan(actual.minutos, actual.enCurso)}
              </span>
            </div>
          ) : (
            <p className="mt-2 font-display text-4xl font-semibold leading-none text-amari-titulo">
              {resumen.total === 0 ? "Sin citas" : resumen.sinCerrar > 0 ? "Por cerrar" : "Todo listo"}
            </p>
          )}
        </div>

        <div className="hidden w-px self-stretch bg-amari-borde xl:block" />

        {cita ? (
          <button
            type="button"
            onClick={() => onSeleccionar(cita)}
            className="flex min-w-0 flex-1 items-center gap-4 text-left transition hover:opacity-90"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-300 to-amari-primario text-lg font-bold text-white shadow-md shadow-amari-primario/30">
              {iniciales(cita.cliente)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-semibold leading-tight text-amari-titulo">
                {cita.cliente}
              </span>
              <span className="mt-1 block truncate text-sm">
                {cita.servicios.map((s) => s.nombre).join(", ")} ·{" "}
                {duracionTexto(minutosDe(cita.fin) - minutosDe(cita.inicio))}
              </span>
              <span className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.clase}`}>
                  {estado.texto}
                </span>
                {mostrarEmpleada && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-amari-texto ring-1 ring-amari-borde">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cita.color }} />
                    con {primerNombre(cita.empleada)}
                  </span>
                )}
              </span>
            </span>
          </button>
        ) : (
          <p className="min-w-0 flex-1 text-base">
            {resumen.total === 0
              ? "Hoy no hay citas programadas."
              : resumen.sinCerrar > 0
                ? `Ya no quedan citas por atender. ${resumen.sinCerrar} ${resumen.sinCerrar === 1 ? "sigue" : "siguen"} sin marcarse como completada, cancelada o inasistencia.`
                : "Ya no quedan citas por atender hoy."}
          </p>
        )}

        {resumen.total > 0 && <Avance resumen={resumen} />}
      </div>
    </section>
  );
}

export default HeroDia;