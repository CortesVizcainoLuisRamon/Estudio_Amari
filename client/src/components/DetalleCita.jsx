import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import { cambiarEstado } from "../services/citas.service";
import { ESTADOS_CITA, ACCIONES_CITA } from "../config/citas";
import { fechaLarga, horaDe } from "../utils/fechas";
import { formatearDuracion, formatearMoneda, etiquetaPrecio } from "../utils/formato";

function DetalleCita({ cita, onCerrar, onCambio }) {
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const estado = ESTADOS_CITA[cita.estado];
  const acciones = ACCIONES_CITA.filter((a) => a.desde.includes(cita.estado));

  const cambiar = async (nuevoEstado) => {
    setError("");
    setEnviando(true);

    try {
      await cambiarEstado(cita.id, nuevoEstado);
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo actualizar la cita");
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="tarjeta max-h-[90vh] w-full max-w-md overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            Detalle de la cita
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-amari-acento hover:text-amari-primario-oscuro"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-amari-titulo">
          <div className="flex items-center justify-between">
            <p className="font-semibold capitalize">{fechaLarga(cita.inicio.slice(0, 10))}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>
              {estado.texto}
            </span>
          </div>

          <p>
            <span className="text-amari-acento">Horario: </span>
            {horaDe(cita.inicio)} a {horaDe(cita.fin)}
          </p>
          <p>
            <span className="text-amari-acento">Cliente: </span>
            {cita.cliente}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-amari-acento">Especialista: </span>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cita.color }} />
            {cita.empleada}
          </p>

          <div>
            <p className="mb-2 text-amari-acento">Servicios</p>
            <ul className="divide-y divide-amari-borde rounded-xl border border-amari-borde">
              {cita.servicios.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    {s.nombre}
                    <span className="block text-xs text-amari-acento">
                      {formatearDuracion(s.duracion_min)}
                    </span>
                  </span>
                  <span className="font-semibold text-amari-primario-oscuro">
                    {etiquetaPrecio(s)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-right font-display text-lg font-semibold">
              Total estimado: {formatearMoneda(cita.total)}
            </p>
          </div>

          {cita.notas && (
            <p>
              <span className="text-amari-acento">Notas: </span>
              {cita.notas}
            </p>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}

          {acciones.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {acciones.map((a) => (
                <button
                  key={a.estado}
                  type="button"
                  disabled={enviando}
                  onClick={() => cambiar(a.estado)}
                  className={a.clase}
                >
                  {a.texto}
                </button>
              ))}
            </div>
          ) : (
            <p className="pt-2 text-center text-xs text-amari-acento">
              Esta cita ya está {estado.texto.toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetalleCita;