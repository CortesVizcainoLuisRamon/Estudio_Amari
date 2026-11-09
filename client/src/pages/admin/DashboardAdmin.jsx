import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  BellRing,
  Gauge,
  Wallet,
  Plus,
  UserPlus,
  Scissors,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getDashboard } from "../../services/dashboard.service";
import ModalCita from "../../components/ModalCita";
import ModalCliente from "../../components/ModalCliente";
import DetalleCita from "../../components/DetalleCita";
import { ESTADOS_CITA } from "../../config/citas";
import { fechaLarga, horaDe } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";

function Estadistica({ icono: Icono, titulo, valor, detalle, alerta = false, to }) {
  const clases = `tarjeta flex items-start gap-4 p-5 ${
    alerta ? "border-amber-300 bg-amber-50" : ""
  } ${to ? "transition hover:shadow-md" : ""}`;

  const contenido = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          alerta ? "bg-amber-100 text-amber-700" : "bg-amari-bg-soft text-amari-primario"
        }`}
      >
        <Icono size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-amari-acento">{titulo}</p>
        <p className="font-display text-3xl font-semibold text-amari-titulo">{valor}</p>
        {detalle && <p className="text-xs text-amari-texto">{detalle}</p>}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

function DashboardAdmin() {
  const { usuario } = useAuth();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [mes] = useState(() => new Date().toLocaleDateString("es-MX", { month: "long" }));
  const [modalCita, setModalCita] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getDashboard()
      .then((data) => {
        if (activo) setResultado({ clave, data });
      })
      .catch(() => {
        if (activo) setResultado({ clave, error: true });
      });

    return () => {
      activo = false;
    };
  }, [clave]);

  const cargando = resultado?.clave !== clave;
  const error = !cargando && resultado.error;
  const d = !cargando && !error ? resultado.data : null;

  const recargar = () => setVersion((v) => v + 1);

  const topMax = d?.servicios_top[0]?.veces ?? 1;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            {d ? fechaLarga(d.fecha) : "Resumen del día"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModalCita(true)} className="btn-primario">
            <Plus size={18} /> Nueva cita
          </button>
          <button
            onClick={() => setModalCliente(true)}
            className="inline-flex items-center gap-2 rounded-full border border-amari-borde bg-white px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
          >
            <UserPlus size={18} /> Nuevo cliente
          </button>
          <Link
            to="/admin/servicios"
            className="inline-flex items-center gap-2 rounded-full border border-amari-borde bg-white px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
          >
            <Scissors size={18} /> Servicios
          </Link>
        </div>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando resumen...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar el dashboard.</p>}

      {d && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Estadistica
              icono={CalendarDays}
              titulo="Citas de hoy"
              valor={d.citas_hoy.length}
              detalle={d.citas_hoy.length === 1 ? "cita programada" : "citas programadas"}
            />
            <Estadistica
              icono={BellRing}
              titulo="Por confirmar"
              valor={d.por_confirmar}
              detalle={d.por_confirmar > 0 ? "Toca para revisarlas" : "Todo al día"}
              alerta={d.por_confirmar > 0}
              to="/admin/citas?filtro=pendientes"
            />
            <Estadistica
              icono={Gauge}
              titulo="Ocupación de hoy"
              valor={`${d.ocupacion.porcentaje}%`}
              detalle="de las horas de atención"
            />
            <Estadistica
              icono={Wallet}
              titulo={`Ingresos de ${mes}`}
              valor={formatearMoneda(d.ingresos.completadas)}
              detalle="en citas completadas"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Citas de hoy
              </h2>

              {d.citas_hoy.length === 0 ? (
                <div className="tarjeta px-6 py-10 text-center text-amari-texto">
                  No hay citas programadas para hoy.
                </div>
              ) : (
                <div className="space-y-2">
                  {d.citas_hoy.map((c) => {
                    const estado = ESTADOS_CITA[c.estado];

                    return (
                      <button
                        key={c.id}
                        onClick={() => setSeleccionada(c)}
                        style={{ borderLeftColor: c.color }}
                        className="tarjeta flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-l-4 p-3 text-left text-sm transition hover:bg-amari-bg-soft"
                      >
                        <span className="w-24 shrink-0 font-semibold text-amari-titulo">
                          {horaDe(c.inicio)} – {horaDe(c.fin)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-amari-titulo">
                            {c.cliente}
                          </span>
                          <span className="block truncate text-xs text-amari-acento">
                            {c.servicios.map((s) => s.nombre).join(", ")} · {c.empleada}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Ocupación por especialista
              </h2>
              <div className="tarjeta space-y-4 p-5">
                {d.ocupacion.empleadas.length === 0 ? (
                  <p className="text-sm text-amari-texto">Nadie tiene turno hoy.</p>
                ) : (
                  d.ocupacion.empleadas.map((e) => (
                    <div key={e.id}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-amari-titulo">{e.nombre}</span>
                        <span className="text-amari-acento">{e.porcentaje}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-amari-bg-soft">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${e.porcentaje}%`, backgroundColor: e.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Ingresos de {mes}
              </h2>
              <div className="tarjeta space-y-3 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-amari-texto">Completadas</span>
                  <span className="font-semibold text-green-700">
                    {formatearMoneda(d.ingresos.completadas)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amari-texto">Confirmadas (por cobrar)</span>
                  <span className="font-semibold text-sky-700">
                    {formatearMoneda(d.ingresos.confirmadas)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-amari-borde pt-3">
                  <span className="font-semibold text-amari-titulo">Proyectado</span>
                  <span className="font-display text-lg font-semibold text-amari-titulo">
                    {formatearMoneda(d.ingresos.completadas + d.ingresos.confirmadas)}
                  </span>
                </div>
                <p className="text-xs text-amari-acento">
                  Estimado con los precios registrados en cada cita.
                </p>
              </div>
            </section>

            <section className="lg:col-span-2">
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Servicios más pedidos en {mes}
              </h2>
              <div className="tarjeta space-y-3 p-5">
                {d.servicios_top.length === 0 ? (
                  <p className="text-sm text-amari-texto">Aún no hay citas este mes.</p>
                ) : (
                  d.servicios_top.map((s) => (
                    <div key={s.nombre}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-amari-titulo">{s.nombre}</span>
                        <span className="shrink-0 text-amari-acento">
                          {s.veces} {s.veces === 1 ? "vez" : "veces"}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-amari-bg-soft">
                        <div
                          className="h-full rounded-full bg-amari-primario"
                          style={{ width: `${(s.veces / topMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {modalCita && (
        <ModalCita
          onCerrar={() => setModalCita(false)}
          onGuardado={() => {
            setModalCita(false);
            recargar();
          }}
        />
      )}

      {modalCliente && (
        <ModalCliente
          cliente={null}
          onCerrar={() => setModalCliente(false)}
          onGuardado={() => setModalCliente(false)}
        />
      )}

      {seleccionada && (
        <DetalleCita
          cita={seleccionada}
          onCerrar={() => setSeleccionada(null)}
          onCambio={() => {
            setSeleccionada(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

export default DashboardAdmin;