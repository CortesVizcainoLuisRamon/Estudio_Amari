import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import Campo from "./Campo";
import { getServicios } from "../services/servicios.service";
import { getDisponibilidad, crearCita } from "../services/citas.service";
import { aTexto, sumarDias, fechaLarga, horaMasMinutos } from "../utils/fechas";
import { formatearDuracion, formatearMoneda, etiquetaPrecio } from "../utils/formato";

const PASOS = ["Servicio", "Fecha y hora"];

const claseOpcion = (activa) =>
  `flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
    activa
      ? "border-amari-primario bg-amari-bg-soft"
      : "border-amari-borde bg-white hover:bg-amari-bg-soft"
  }`;

function ModalCitaCliente({ onCerrar, onGuardado }) {
  const [servicios, setServicios] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [paso, setPaso] = useState(0);
  const [serviciosIds, setServiciosIds] = useState([]);
  const [fecha, setFecha] = useState("");
  const [seleccion, setSeleccion] = useState(null);
  const [notas, setNotas] = useState("");
  const [disp, setDisp] = useState(null);
  const [refresco, setRefresco] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;

    getServicios()
      .then((data) => {
        if (activo) setServicios(data);
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const idsTexto = [...serviciosIds].sort((a, b) => a - b).join(",");
  const claveDisp = `${fecha}|${idsTexto}|${refresco}`;

  useEffect(() => {
    if (paso !== 1 || !fecha || !idsTexto) return;

    let activo = true;
    const ids = idsTexto.split(",").map(Number);

    getDisponibilidad(fecha, ids)
      .then((data) => {
        if (activo) setDisp({ clave: claveDisp, data });
      })
      .catch(() => {
        if (activo) setDisp({ clave: claveDisp, error: true });
      });

    return () => {
      activo = false;
    };
  }, [paso, fecha, idsTexto, claveDisp]);

  const elegidos = servicios ? servicios.filter((s) => serviciosIds.includes(s.id)) : [];
  const duracionTotal = elegidos.reduce((suma, s) => suma + s.duracion_min, 0);
  const total = elegidos.reduce((suma, s) => suma + (s.precio ?? 0), 0);
  const sinPrecio = elegidos.some((s) => s.precio === null);

  const dispActual = paso === 1 && fecha && disp?.clave === claveDisp ? disp : null;
  const buscando = paso === 1 && Boolean(fecha) && !dispActual;
  const grupos = dispActual?.data?.filter((g) => g.horas.length > 0) ?? [];
  const grupoElegido = grupos.find((g) => g.empleado_id === seleccion?.empleadoId);
  const seleccionValida = Boolean(grupoElegido?.horas.includes(seleccion?.hora));

  const puedeAvanzar = paso === 0 ? serviciosIds.length > 0 : seleccionValida;

  const alternarServicio = (id) =>
    setServiciosIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const agendar = async () => {
    setError("");
    setEnviando(true);

    try {
      const cita = await crearCita({
        empleado_id: seleccion.empleadoId,
        servicios_ids: serviciosIds,
        fecha,
        hora: seleccion.hora,
        notas,
      });
      onGuardado(cita);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo agendar la cita");
      if (err.response?.status === 409) {
        setSeleccion(null);
        setRefresco((r) => r + 1);
      }
      setEnviando(false);
    }
  };

  const avanzar = () => {
    setError("");
    if (paso === 0) setPaso(1);
    else agendar();
  };

  const retroceder = () => {
    setError("");
    if (paso === 0) onCerrar();
    else setPaso(0);
  };

  const porCategoria = servicios
    ? servicios.reduce((grupo, s) => {
        (grupo[s.categoria] ??= []).push(s);
        return grupo;
      }, {})
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta flex max-h-[90vh] w-full max-w-xl flex-col">
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            Agendar cita
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

        <div className="grid grid-cols-2 gap-2 px-6 pt-4">
          {PASOS.map((nombre, i) => (
            <div key={nombre}>
              <div
                className={`h-1.5 rounded-full ${i <= paso ? "bg-amari-primario" : "bg-amari-borde"}`}
              />
              <p
                className={`mt-1 text-[11px] ${
                  i === paso ? "font-semibold text-amari-primario" : "text-amari-acento"
                }`}
              >
                {nombre}
              </p>
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {errorCarga && (
            <p className="text-center text-red-600">No se pudieron cargar los servicios.</p>
          )}
          {!servicios && !errorCarga && (
            <p className="text-center text-amari-primario">Cargando...</p>
          )}

          {servicios && paso === 0 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">
                ¿Qué servicio te gustaría?{" "}
                <span className="font-normal text-amari-primario">(puedes elegir varios)</span>
              </p>
              {Object.entries(porCategoria).map(([categoria, lista]) => (
                <div key={categoria} className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amari-acento">
                    {categoria}
                  </p>
                  <div className="space-y-2">
                    {lista.map((s) => {
                      const activo = serviciosIds.includes(s.id);
                      return (
                        <label key={s.id} className={`${claseOpcion(activo)} cursor-pointer`}>
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => alternarServicio(s.id)}
                            className="h-4 w-4 accent-amari-primario"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-amari-titulo">
                              {s.nombre}
                            </span>
                            <span className="block text-xs text-amari-acento">
                              {formatearDuracion(s.duracion_min)}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-amari-primario-oscuro">
                            {etiquetaPrecio(s)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {servicios && paso === 1 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">¿Cuándo te queda mejor?</p>

              <Campo
                id="fecha"
                type="date"
                etiqueta="Fecha"
                min={aTexto(new Date())}
                max={aTexto(sumarDias(new Date(), 60))}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setSeleccion(null);
                }}
              />

              {fecha && (
                <>
                  {buscando && <p className="text-sm text-amari-primario">Buscando horarios...</p>}
                  {dispActual?.error && (
                    <p className="text-sm text-red-600">No se pudo consultar la disponibilidad.</p>
                  )}
                  {dispActual && !dispActual.error && grupos.length === 0 && (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      No hay horarios disponibles ese día. Prueba con otra fecha.
                    </p>
                  )}

                  <div className="space-y-4">
                    {grupos.map((g) => (
                      <div key={g.empleado_id}>
                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amari-titulo">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: g.color }}
                          />
                          {g.nombre}
                        </p>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                          {g.horas.map((h) => {
                            const activa =
                              seleccion?.empleadoId === g.empleado_id && seleccion?.hora === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setSeleccion({ empleadoId: g.empleado_id, hora: h })}
                                className={`rounded-xl border py-2 text-sm font-medium transition ${
                                  activa
                                    ? "border-transparent bg-amari-primario text-white"
                                    : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
                                }`}
                              >
                                {h}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {seleccionValida && (
                <div className="mt-4 rounded-xl bg-amari-bg-soft p-3 text-sm text-amari-titulo">
                  <p className="font-semibold capitalize">{fechaLarga(fecha)}</p>
                  <p>
                    {seleccion.hora} a {horaMasMinutos(seleccion.hora, duracionTotal)} ·{" "}
                    {grupoElegido.nombre}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <label
                  htmlFor="notas"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario"
                >
                  Notas (opcional)
                </label>
                <textarea
                  id="notas"
                  rows={2}
                  maxLength={500}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Alergias, referencias, algo que debamos saber..."
                  className="w-full rounded-xl border border-amari-borde px-4 py-2.5 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-amari-borde px-6 py-4">
          {serviciosIds.length > 0 && (
            <p className="mb-3 text-xs text-amari-acento">
              {serviciosIds.length} servicio(s) · ~{formatearDuracion(duracionTotal)} · Total
              estimado: {formatearMoneda(total)}
              {sinPrecio && " + servicios por cotizar"}
            </p>
          )}

          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={retroceder}
              disabled={enviando}
              className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft disabled:opacity-60"
            >
              {paso === 0 ? "Cancelar" : "← Atrás"}
            </button>
            <button
              type="button"
              onClick={avanzar}
              disabled={!puedeAvanzar || enviando}
              className="btn-primario"
            >
              {paso === 0 ? "Siguiente →" : enviando ? "Agendando..." : "Agendar cita"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCitaCliente;