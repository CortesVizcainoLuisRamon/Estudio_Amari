import { useEffect, useState } from "react";
import { CalendarDays, Wallet, Percent, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardEmpleada } from "../../services/dashboard.service";
import Estadistica from "../../components/Estadistica";
import DetalleCita from "../../components/DetalleCita";
import { ESTADOS_CITA } from "../../config/citas";
import { fechaLarga, horaDe, deTexto } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";
import AlertasInventario from "../../components/AlertasInventario";

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

function DashboardEmpleada() {
  const { usuario } = useAuth();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [saludoActual] = useState(saludo);
  const [mes] = useState(() => new Date().toLocaleDateString("es-MX", { month: "long" }));

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getDashboardEmpleada()
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

  const maxDia = Math.max(1, ...(d?.ultimos_7.map((x) => x.total) ?? [1]));
  const topMax = d?.servicios_top[0]?.veces ?? 1;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">
          {saludoActual}, {usuario.nombre}
        </h1>
        <p className="mt-1 text-sm text-amari-acento">
          {d ? fechaLarga(d.fecha) : "Tu resumen del día"}
        </p>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando tu resumen...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar tu resumen.</p>}

      {d && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Estadistica
              icono={CalendarDays}
              titulo="Mis citas de hoy"
              valor={d.citas_hoy.length}
              detalle={`${d.completadas_hoy} completadas`}
            />
            <Estadistica
              icono={Wallet}
              titulo={`Mis ingresos de ${mes}`}
              valor={formatearMoneda(d.ingresos_mes)}
              detalle="en citas completadas"
            />
            <Estadistica
              icono={Percent}
              titulo="Mi comisión estimada"
              valor={formatearMoneda(d.comision_mes)}
              detalle={`${d.comision_pct}% de tus ingresos`}
            />
            <Estadistica
              icono={Users}
              titulo="Clientas atendidas"
              valor={d.clientas_mes}
              detalle={`en ${mes}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Mi agenda de hoy
              </h2>

              {d.citas_hoy.length === 0 ? (
                <div className="tarjeta px-6 py-10 text-center text-amari-texto">
                  No tienes citas programadas para hoy.
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
                            {c.servicios.map((s) => s.nombre).join(", ")}
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
                Servicios que más realizas
              </h2>
              <div className="tarjeta space-y-3 p-5">
                {d.servicios_top.length === 0 ? (
                  <p className="text-sm text-amari-texto">Aún no hay citas este mes.</p>
                ) : (
                  d.servicios_top.map((s) => (
                    <div key={s.nombre}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-amari-titulo">{s.nombre}</span>
                        <span className="shrink-0 text-amari-acento">{s.veces}x</span>
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

            <section className="lg:col-span-2">
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Mis ingresos de los últimos 7 días
              </h2>
              <div className="tarjeta p-5">
                <div className="flex h-36 items-end gap-2 sm:gap-4">
                  {d.ultimos_7.map((x) => (
                    <div key={x.dia} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                      <p className="mb-1 truncate text-center text-[10px] text-amari-acento sm:text-xs">
                        {x.total > 0 ? formatearMoneda(x.total) : ""}
                      </p>
                      <div
                        className="w-full rounded-t-lg bg-linear-to-t from-amari-primario to-amari-acento"
                        style={{
                          height: x.total > 0 ? `${Math.max(4, (x.total / maxDia) * 100)}%` : "2px",
                          opacity: x.total > 0 ? 1 : 0.3,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2 sm:gap-4">
                  {d.ultimos_7.map((x) => (
                    <p
                      key={x.dia}
                      className="min-w-0 flex-1 text-center text-[11px] font-semibold uppercase text-amari-acento"
                    >
                      {deTexto(x.dia)
                        .toLocaleDateString("es-MX", { weekday: "short" })
                        .replace(".", "")}
                    </p>
                  ))}
                </div>
              </div>
            <AlertasInventario
              alertas={d.alertas_inventario}
              to="/empleado/inventario?filtro=alertas"
            />
            </section>
          </div>
        </>
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

export default DashboardEmpleada;