import { useEffect, useState } from "react";
import { CalendarDays, Percent, Users, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAhora } from "../../hooks/useAhora";
import { getDashboardEmpleada } from "../../services/dashboard.service";
import DetalleCita from "../../components/DetalleCita";
import Estadistica from "../../components/Estadistica";
import HeroDia from "../../components/HeroDia";
import AgendaHoy from "../../components/AgendaHoy";
import TopServicios from "../../components/TopServicios";
import AlertasInventario from "../../components/AlertasInventario";
import { saludo } from "../../config/estudio";
import { fechaLarga, deTexto } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";

function IngresosSemana({ dias }) {
  const maximo = Math.max(1, ...dias.map((x) => x.total));
  const total = dias.reduce((suma, x) => suma + x.total, 0);

  return (
    <section className="tarjeta p-6">
      <h2 className="font-display text-2xl font-semibold text-amari-titulo">
        Mis ingresos de los últimos 7 días
      </h2>
      <p className="mt-1 text-sm">
        En citas completadas · <b className="text-amari-titulo">{formatearMoneda(total)}</b>
      </p>

      <div className="mt-4 flex h-44 items-end gap-2 border-b border-amari-borde pt-7 sm:gap-4">
        {dias.map((x, i) => {
          const esHoy = i === dias.length - 1;
          const conVentas = x.total > 0;
          const rotular = conVentas && (x.total === maximo || esHoy);

          return (
            <div key={x.dia} className="flex h-full min-w-0 flex-1 items-end">
              <div
                className={`relative w-full rounded-t-xl ${
                  esHoy
                    ? "bg-linear-to-t from-amari-primario to-amari-acento"
                    : "bg-pink-200"
                }`}
                style={{
                  height: conVentas ? `${Math.max(6, (x.total / maximo) * 100)}%` : "3px",
                  opacity: conVentas ? 1 : 0.5,
                }}
              >
                {rotular && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-amari-titulo sm:text-xs">
                    {formatearMoneda(x.total)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 sm:gap-4">
        {dias.map((x, i) => (
          <p
            key={x.dia}
            className={`min-w-0 flex-1 text-center text-[11px] font-semibold uppercase ${
              i === dias.length - 1 ? "text-amari-primario-oscuro" : "text-amari-texto"
            }`}
          >
            {i === dias.length - 1
              ? "Hoy"
              : deTexto(x.dia).toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")}
          </p>
        ))}
      </div>
    </section>
  );
}

function DashboardEmpleada() {
  const { usuario } = useAuth();
  const ahora = useAhora();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
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

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">
          {saludo(ahora)}, {usuario.nombre}
        </h1>
        <p className="mt-1 text-sm text-amari-acento">
          {d ? `${fechaLarga(d.fecha)} · Tu día en el estudio` : "Tu resumen del día"}
        </p>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando tu resumen...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar tu resumen.</p>}

      {d && (
        <>
          <HeroDia citas={d.citas_hoy} ahora={ahora} onSeleccionar={setSeleccionada} />

          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Estadistica
              icono={CalendarDays}
              titulo="Mis citas de hoy"
              valor={d.citas_hoy.length}
              detalle={`${d.completadas_hoy} ${d.completadas_hoy === 1 ? "completada" : "completadas"}`}
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

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-6">
              <AgendaHoy
                titulo="Mi agenda de hoy"
                citas={d.citas_hoy}
                ahora={ahora}
                vacio="No tienes citas programadas para hoy."
                verTodas="/empleado/citas"
                onSeleccionar={setSeleccionada}
              />
              <IngresosSemana dias={d.ultimos_7} />
            </div>

            <div className="space-y-6">
              <TopServicios titulo="Servicios que más realizas" servicios={d.servicios_top} />
              <AlertasInventario
                alertas={d.alertas_inventario}
                to="/empleado/inventario?filtro=alertas"
              />
            </div>
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