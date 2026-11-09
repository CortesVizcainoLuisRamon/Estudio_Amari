import { useEffect, useState } from "react";
import { X, Flower2, Search, Check, UserPlus } from "lucide-react";
import Campo from "./Campo";
import ModalCliente from "./ModalCliente";
import { getClientes } from "../services/clientes.service";
import { getServicios } from "../services/servicios.service";
import { getEmpleados } from "../services/empleados.service";
import { getDisponibilidad, crearCita } from "../services/citas.service";
import { aTexto, fechaLarga, horaMasMinutos } from "../utils/fechas";
import {
  formatearDuracion,
  formatearMoneda,
  etiquetaPrecio,
  normalizarTexto,
} from "../utils/formato";

const PASOS = ["Cliente", "Servicio", "Especialista", "Fecha y hora"];

const claseOpcion = (activa) =>
  `flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
    activa
      ? "border-amari-primario bg-amari-bg-soft"
      : "border-amari-borde bg-white hover:bg-amari-bg-soft"
  }`;

function ModalCita({ onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [paso, setPaso] = useState(0);
  const [clienteId, setClienteId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [serviciosIds, setServiciosIds] = useState([]);
  const [empleadoId, setEmpleadoId] = useState(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [disp, setDisp] = useState(null);
  const [refresco, setRefresco] = useState(0);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;

    Promise.all([getClientes(), getServicios(), getEmpleados()])
      .then(([clientes, servicios, empleados]) => {
        if (activo) setDatos({ clientes, servicios, empleados });
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (creandoCliente) return;
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar, creandoCliente]);

  const idsTexto = [...serviciosIds].sort((a, b) => a - b).join(",");
  const claveDisp = `${fecha}|${idsTexto}|${refresco}`;

  useEffect(() => {
    if (paso !== 3 || !fecha || !idsTexto) return;

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

  const cliente = datos?.clientes.find((c) => c.id === clienteId);
  const serviciosElegidos = datos
    ? datos.servicios.filter((s) => serviciosIds.includes(s.id))
    : [];
  const duracionTotal = serviciosElegidos.reduce((suma, s) => suma + s.duracion_min, 0);
  const total = serviciosElegidos.reduce((suma, s) => suma + (s.precio ?? 0), 0);
  const sinPrecio = serviciosElegidos.some((s) => s.precio === null);

  const especialistas = datos
    ? datos.empleados.filter(
        (e) => e.activo && serviciosIds.every((id) => e.servicios_ids.includes(id))
      )
    : [];
  const especialista = especialistas.find((e) => e.id === empleadoId);

  const dispActual = paso === 3 && fecha && disp?.clave === claveDisp ? disp : null;
  const buscando = paso === 3 && Boolean(fecha) && !dispActual;
  const horasLibres = dispActual?.data?.find((x) => x.empleado_id === empleadoId)?.horas ?? [];
  const horaValida = horasLibres.includes(hora);

  const puedeAvanzar = [
    Boolean(cliente),
    serviciosIds.length > 0,
    Boolean(especialista),
    horaValida,
  ][paso];

  const alternarServicio = (id) =>
    setServiciosIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const agendar = async () => {
    setError("");
    setEnviando(true);

    try {
      await crearCita({
        cliente_id: clienteId,
        empleado_id: empleadoId,
        servicios_ids: serviciosIds,
        fecha,
        hora,
        notas,
      });
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo agendar la cita");
      if (err.response?.status === 409) {
        setHora("");
        setRefresco((r) => r + 1);
      }
      setEnviando(false);
    }
  };

  const avanzar = () => {
    setError("");
    if (paso < 3) setPaso(paso + 1);
    else agendar();
  };

  const retroceder = () => {
    setError("");
    if (paso === 0) onCerrar();
    else setPaso(paso - 1);
  };

  const clientesFiltrados = datos
    ? datos.clientes.filter((c) =>
        normalizarTexto(`${c.nombre} ${c.apellidos} ${c.telefono}`).includes(
          normalizarTexto(busqueda)
        )
      )
    : [];

  const serviciosPorCategoria = datos
    ? datos.servicios.reduce((grupos, s) => {
        (grupos[s.categoria] ??= []).push(s);
        return grupos;
      }, {})
    : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta flex max-h-[90vh] w-full max-w-xl flex-col">
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            Nueva Cita
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

        <div className="grid grid-cols-4 gap-2 px-6 pt-4">
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
            <p className="text-center text-red-600">No se pudieron cargar los datos de la agenda.</p>
          )}
          {!datos && !errorCarga && (
            <p className="text-center text-amari-primario">Cargando...</p>
          )}

          {datos && paso === 0 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">¿Para quién es la cita?</p>
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amari-acento"
                />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  aria-label="Buscar cliente"
                  className="w-full rounded-full border border-amari-borde py-2 pl-9 pr-4 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
                />
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClienteId(c.id)}
                    className={claseOpcion(c.id === clienteId)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amari-bg-soft text-xs font-bold text-amari-primario">
                      {`${c.nombre?.[0] ?? ""}${c.apellidos?.[0] ?? ""}`.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-amari-titulo">
                        {c.nombre} {c.apellidos}
                      </span>
                      <span className="block text-xs text-amari-acento">
                        {c.telefono || c.email || "Sin contacto"}
                      </span>
                    </span>
                    {c.id === clienteId && <Check size={18} className="text-amari-primario" />}
                  </button>
                ))}
                {clientesFiltrados.length === 0 && (
                  <p className="py-4 text-center text-sm text-amari-acento">
                    No se encontraron clientes.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCreandoCliente(true)}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-amari-primario hover:underline"
              >
                <UserPlus size={16} /> Crear cliente nuevo
              </button>
            </>
          )}

          {datos && paso === 1 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">
                ¿Qué servicio(s) se realizarán?{" "}
                <span className="font-normal text-amari-primario">(puedes elegir varios)</span>
              </p>
              {Object.entries(serviciosPorCategoria).map(([categoria, lista]) => (
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

          {datos && paso === 2 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">¿Quién realizará el servicio?</p>
              {especialistas.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Ninguna especialista realiza todos los servicios elegidos. Regresa y elige menos
                  servicios, o asígnalos a una empleada desde la sección Empleadas.
                </p>
              ) : (
                <div className="space-y-2">
                  {especialistas.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEmpleadoId(e.id)}
                      className={claseOpcion(e.id === empleadoId)}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: e.color }}
                      >
                        {`${e.nombre[0]}${e.apellidos[0]}`.toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-amari-titulo">
                          {e.nombre} {e.apellidos}
                        </span>
                        <span className="block text-xs text-amari-acento">
                          {e.puesto || "Especialista"}
                        </span>
                      </span>
                      {e.id === empleadoId && <Check size={18} className="text-amari-primario" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {datos && paso === 3 && (
            <>
              <p className="mb-3 font-semibold text-amari-titulo">¿Cuándo será la cita?</p>

              <Campo
                id="fecha"
                type="date"
                etiqueta="Fecha"
                min={aTexto(new Date())}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setHora("");
                }}
              />

              {fecha && (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amari-primario">
                    Horarios disponibles con {especialista?.nombre}
                  </p>
                  {buscando && <p className="text-sm text-amari-primario">Buscando horarios...</p>}
                  {dispActual?.error && (
                    <p className="text-sm text-red-600">No se pudo consultar la disponibilidad.</p>
                  )}
                  {dispActual && !dispActual.error && horasLibres.length === 0 && (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      No hay horarios disponibles ese día. Prueba con otra fecha.
                    </p>
                  )}
                  {horasLibres.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {horasLibres.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHora(h)}
                          className={`rounded-xl border py-2 text-sm font-medium transition ${
                            h === hora
                              ? "border-transparent bg-amari-primario text-white"
                              : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {horaValida && (
                <div className="mt-4 rounded-xl bg-amari-bg-soft p-3 text-sm text-amari-titulo">
                  <p className="font-semibold">{fechaLarga(fecha)}</p>
                  <p>
                    {hora} a {horaMasMinutos(hora, duracionTotal)} · {cliente?.nombre}{" "}
                    {cliente?.apellidos} · {especialista?.nombre}
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
                  className="w-full rounded-xl border border-amari-borde px-4 py-2.5 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-amari-borde px-6 py-4">
          {serviciosIds.length > 0 && paso >= 1 && (
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
              {paso < 3 ? "Siguiente →" : enviando ? "Agendando..." : "Agendar cita"}
            </button>
          </div>
        </div>
      </div>

      {creandoCliente && (
        <ModalCliente
          cliente={null}
          onCerrar={() => setCreandoCliente(false)}
          onGuardado={(nuevo) => {
            setDatos((d) => ({ ...d, clientes: [...d.clientes, nuevo] }));
            setClienteId(nuevo.id);
            setCreandoCliente(false);
          }}
        />
      )}
    </div>
  );
}

export default ModalCita;