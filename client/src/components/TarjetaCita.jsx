import { useState } from "react";
import { BellRing } from "lucide-react";
import { cancelarMiCita } from "../services/citas.service";
import { ESTADOS_CITA } from "../config/citas";
import { fechaLarga, horaDe, faltaTexto } from "../utils/fechas";
import { formatearMoneda, etiquetaPrecio } from "../utils/formato";
import FechaCita from "./FechaCita";

// Una cita: fecha, hora, especialista, estado, servicios con precio, premio, total y cancelar.
// `destacada` es la próxima cita (fondo degradado y fecha grande); `ahora` es solo para ella.
function TarjetaCita({ cita, ahora, destacada = false, puedeCancelar, onCambio }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const estado = ESTADOS_CITA[cita.estado];

  const cancelar = async () => {
    setError("");
    setEnviando(true);

    try {
      await cancelarMiCita(cita.id);
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cancelar la cita");
      setEnviando(false);
      setConfirmando(false);
    }
  };

  return (
    <article
      style={{ borderLeftColor: cita.color }}
      className={`relative overflow-hidden rounded-3xl border border-l-4 border-amari-borde p-5 text-sm text-amari-titulo sm:p-6 ${
        destacada
          ? "bg-linear-to-br from-white via-amari-bg-soft to-pink-100 shadow-lg shadow-amari-primario/10"
          : "bg-white shadow-sm"
      }`}
    >
      {destacada && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-36 hidden h-80 w-80 rounded-full border border-amari-acento/25 sm:block"
          />
          <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amari-primario-oscuro">
              Tu próxima cita
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold ring-1 ring-amari-borde">
              <BellRing size={14} className="text-amari-primario" />
              {faltaTexto(cita.inicio, ahora)}
            </p>
          </div>
        </>
      )}

      <div className="relative flex items-start gap-4">
        <FechaCita inicio={cita.inicio} grande={destacada} />

        <div className="min-w-0 flex-1">
          <p
            className={
              destacada
                ? "font-display text-xl font-semibold leading-tight sm:text-2xl"
                : "text-base font-semibold"
            }
          >
            {fechaLarga(cita.inicio.slice(0, 10))}
          </p>
          <p className="mt-0.5 text-amari-acento">
            {horaDe(cita.inicio)} a {horaDe(cita.fin)} · {cita.empleada}
          </p>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      <ul className="relative mt-4 space-y-1.5 rounded-2xl border border-amari-borde/70 bg-white/70 p-4">
        {cita.servicios.map((s) => (
          <li key={s.id} className="flex justify-between gap-3">
            <span>{s.nombre}</span>
            <span className="shrink-0 text-amari-primario-oscuro">{etiquetaPrecio(s)}</span>
          </li>
        ))}
      </ul>

      {cita.descuento > 0 && (
        <p className="relative mt-3 text-xs font-semibold text-green-700">
          Premio de fidelidad aplicado: −{formatearMoneda(cita.descuento)}
        </p>
      )}

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amari-borde/70 pt-4">
        <p className="font-display text-lg font-semibold">
          Total estimado: {formatearMoneda(cita.total)}
        </p>

        {puedeCancelar && !confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Cancelar cita
          </button>
        )}

        {puedeCancelar && confirmando && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">¿Seguro?</span>
            <button
              type="button"
              disabled={enviando}
              onClick={cancelar}
              className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {enviando ? "Cancelando..." : "Sí, cancelar"}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setConfirmando(false)}
              className="rounded-full border border-amari-borde bg-white px-4 py-2 font-semibold text-amari-primario-oscuro transition hover:bg-amari-bg-soft"
            >
              No
            </button>
          </div>
        )}
      </div>

      {error && <p className="relative mt-3 rounded-xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}
    </article>
  );
}

export default TarjetaCita;