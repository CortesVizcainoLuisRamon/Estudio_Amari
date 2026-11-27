import { useEffect, useState } from "react";
import { X, Flower2, Gift } from "lucide-react";
import {
  cambiarEstado,
  getFidelidadCliente,
  aplicarFidelidad,
  quitarFidelidad,
} from "../services/citas.service";
import { ESTADOS_CITA, ACCIONES_CITA } from "../config/citas";
import { fechaLarga, horaDe } from "../utils/fechas";
import { formatearDuracion, formatearMoneda, etiquetaPrecio } from "../utils/formato";

function DetalleCita({ cita, onCerrar, onCambio }) {
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fid, setFid] = useState(null);

  const verFidelidad = cita.estado === "pendiente" || cita.estado === "confirmada";

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  useEffect(() => {
    if (!verFidelidad) return;
    let activo = true;

    getFidelidadCliente(cita.cliente_id)
      .then((data) => {
        if (activo) setFid(data);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, [verFidelidad, cita.cliente_id]);

  const estado = ESTADOS_CITA[cita.estado];
  const acciones = ACCIONES_CITA.filter((a) => a.desde.includes(cita.estado));

  const ejecutar = async (accion) => {
    setError("");
    setEnviando(true);

    try {
      await accion();
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo completar la acción");
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
          <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-amari-titulo">
            <span className="icono-tarjeta h-9 w-9">
              <Flower2 size={18} />
            </span>
            Detalle de la cita
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-amari-acento transition hover:bg-pink-50 hover:text-amari-primario-oscuro"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm text-amari-titulo">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{fechaLarga(cita.inicio.slice(0, 10))}</p>
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
            <ul className="divide-y divide-amari-borde rounded-2xl border border-amari-borde">
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

            {cita.descuento > 0 && (
              <p className="mt-2 text-right text-xs font-semibold text-green-700">
                Premio de fidelidad: −{formatearMoneda(cita.descuento)}
              </p>
            )}
            <p className="mt-1 text-right font-display text-lg font-semibold">
              Total estimado: {formatearMoneda(cita.total)}
            </p>
          </div>

          {verFidelidad && fid && (
            <div className="rounded-2xl border border-amari-borde bg-amari-bg-soft p-3">
              <p className="flex items-center gap-2 font-semibold">
                <Gift size={16} className="text-amari-primario" />
                Fidelidad: {fid.sellos}/{fid.requeridas} visitas
              </p>

              {cita.canje_fidelidad ? (
                <>
                  <p className="mt-1 text-xs text-green-700">
                    Premio aplicado en esta cita (servicio gratis).
                  </p>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => ejecutar(() => quitarFidelidad(cita.id))}
                    className="mt-2 rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Quitar premio
                  </button>
                </>
              ) : fid.premio_disponible ? (
                <>
                  <p className="mt-1 text-xs text-amari-texto">
                    Ya completó sus {fid.requeridas} visitas. Le corresponde un servicio gratis
                    (Peinado, Corte, Manicure o Gelish).
                  </p>
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => ejecutar(() => aplicarFidelidad(cita.id))}
                    className="btn-primario mt-2"
                  >
                    Aplicar premio
                  </button>
                </>
              ) : fid.premio_reservado ? (
                <p className="mt-1 text-xs text-amari-acento">
                  Su premio ya está aplicado en otra cita.
                </p>
              ) : (
                <p className="mt-1 text-xs text-amari-acento">
                  Le {fid.requeridas - fid.sellos === 1 ? "falta" : "faltan"}{" "}
                  {fid.requeridas - fid.sellos} visita(s) para su servicio gratis.
                </p>
              )}
            </div>
          )}

          {cita.notas && (
            <p>
              <span className="text-amari-acento">Notas: </span>
              {cita.notas}
            </p>
          )}

          {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}

          {acciones.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {acciones.map((a) => (
                <button
                  key={a.estado}
                  type="button"
                  disabled={enviando}
                  onClick={() => ejecutar(() => cambiarEstado(cita.id, a.estado))}
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