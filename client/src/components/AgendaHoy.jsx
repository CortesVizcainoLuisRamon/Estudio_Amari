import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import FilaCita from "./FilaCita";
import { citaActual } from "../utils/agenda";

// Lista de las citas del día. La que está en curso (o sigue) va resaltada.
function AgendaHoy({
  titulo = "Agenda de hoy",
  citas,
  ahora,
  mostrarEmpleada = false,
  vacio = "No hay citas programadas para hoy.",
  verTodas,
  onSeleccionar,
}) {
  const activaId = citaActual(citas, ahora)?.cita.id;

  return (
    <section className="tarjeta p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 sm:mb-4">
        <h2 className="font-display text-2xl font-semibold text-amari-titulo">{titulo}</h2>
        {verTodas && (
          <Link
            to={verTodas}
            className="inline-flex items-center gap-1 text-sm font-bold text-amari-primario-oscuro hover:underline"
          >
            Ver todas las citas <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {citas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-amari-borde px-6 py-10 text-center">
          <CalendarDays size={28} className="text-amari-acento" />
          <p>{vacio}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {citas.map((c) => (
            <FilaCita
              key={c.id}
              cita={c}
              activa={c.id === activaId}
              mostrarEmpleada={mostrarEmpleada}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AgendaHoy;