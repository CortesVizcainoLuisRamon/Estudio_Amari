import { Sparkles } from "lucide-react";
import { VISITAS_REGULAR } from "../config/fidelidad";

// Nivel de la clienta según sus visitas completadas (calculadas con sus citas).
function TarjetaNivel({ visitas, ultimaVisita }) {
  const regular = visitas >= VISITAS_REGULAR;

  return (
    <section className="tarjeta p-6">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-amari-primario-oscuro">
          <Sparkles size={20} />
        </span>
        <h2 className="font-display text-xl font-semibold text-amari-titulo">Tu nivel</h2>
      </div>

      <p className="mt-4 font-display text-4xl font-semibold leading-none text-amari-titulo">
        {regular ? "Regular" : "Nuevo"}
      </p>
      <p className="mt-2 text-sm">
        {visitas} {visitas === 1 ? "visita" : "visitas"} en total
      </p>

      {ultimaVisita && (
        <p className="mt-4 border-t border-amari-borde/60 pt-3 text-sm">
          Última visita: {ultimaVisita}
        </p>
      )}
    </section>
  );
}

export default TarjetaNivel;