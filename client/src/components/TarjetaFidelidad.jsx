import { Check, Gift, Flower2 } from "lucide-react";

function TarjetaFidelidad({ fidelidad }) {
  const { sellos, requeridas, premio_reservado, servicios_premio } = fidelidad;
  const completa = sellos >= requeridas;
  const faltan = requeridas - sellos;

  let mensaje = `Te ${faltan === 1 ? "falta" : "faltan"} ${faltan} ${
    faltan === 1 ? "visita" : "visitas"
  } para tu servicio gratis.`;
  if (completa) mensaje = "¡Tu próximo servicio es gratis! Pídelo al agendar tu cita.";
  if (completa && premio_reservado) mensaje = "¡Tu premio ya está aplicado en una próxima cita!";

  return (
    <section className="tarjeta mb-6 overflow-hidden">
      <div className="bg-linear-to-r from-amari-primario to-amari-primario-oscuro px-5 py-3 text-white">
        <h2 className="font-display text-lg font-semibold">Tarjeta de fidelidad</h2>
        <p className="text-xs opacity-90">
          Completa {requeridas} visitas y recibe gratis tu sexto servicio
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: requeridas }, (_, i) => (
            <span
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                i < sellos
                  ? "border-transparent bg-amari-primario text-white"
                  : "border-dashed border-amari-borde text-amari-borde"
              }`}
            >
              {i < sellos ? <Check size={18} /> : <Flower2 size={16} />}
            </span>
          ))}
          <span
            className={`flex h-10 items-center gap-1 rounded-full px-3 text-xs font-bold ${
              completa
                ? "bg-amber-100 text-amber-700"
                : "border-2 border-dashed border-amari-borde text-amari-acento"
            }`}
          >
            <Gift size={16} /> GRATIS
          </span>
        </div>

        <p className="mt-3 text-sm font-semibold text-amari-titulo">{mensaje}</p>

        {servicios_premio?.length > 0 && (
          <p className="mt-1 text-xs text-amari-acento">
            Aplica en: {servicios_premio.join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}

export default TarjetaFidelidad;