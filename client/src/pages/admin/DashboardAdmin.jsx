import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, CalendarDays, Gauge, Plus, Scissors, UserPlus, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAhora } from "../../hooks/useAhora";
import { getDashboard } from "../../services/dashboard.service";
import ModalCita from "../../components/ModalCita";
import ModalCliente from "../../components/ModalCliente";
import DetalleCita from "../../components/DetalleCita";
import Estadistica from "../../components/Estadistica";
import HeroDia from "../../components/HeroDia";
import AgendaHoy from "../../components/AgendaHoy";
import TopServicios from "../../components/TopServicios";
import AlertasInventario from "../../components/AlertasInventario";
import { saludo } from "../../config/estudio";
import { fechaLarga, horaDe } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";
import {
  ESTADOS_ACTIVOS,
  iniciales,
  minutosDe,
  minutosDeAhora,
  resumenDia,
} from "../../utils/agenda";

const botonSecundario =
  "inline-flex items-center gap-2 rounded-full border-2 border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro transition hover:bg-pink-50";

function TarjetaIngresos({ ingresos, mes }) {
  const proyectado = ingresos.completadas + ingresos.confirmadas;
  const pctCompletadas = proyectado === 0 ? 0 : (ingresos.completadas / proyectado) * 100;

  return (
    <section className="tarjeta p-6">
      <h2 className="font-display text-2xl font-semibold text-amari-titulo">Ingresos de {mes}</h2>
      <p className="mt-1 text-sm">Proyectado al cierre</p>
      <p className="font-display text-4xl font-semibold text-amari-titulo">{formatearMoneda(proyectado)}</p>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-amari-bg-soft">
        <div
          className="h-full bg-linear-to-r from-amari-acento to-amari-primario"
          style={{ width: `${pctCompletadas}%` }}
        />
        <div className="h-full bg-pink-200" style={{ width: `${proyectado === 0 ? 0 : 100 - pctCompletadas}%` }} />
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amari-primario" /> Completadas
          </dt>
          <dd className="font-semibold text-amari-titulo">{formatearMoneda(ingresos.completadas)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-200" /> Confirmadas (por cobrar)
          </dt>
          <dd className="font-semibold text-amari-titulo">{formatearMoneda(ingresos.confirmadas)}</dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-amari-borde/60 pt-3 text-xs text-amari-acento">
        Estimado con los precios registrados en cada cita.
      </p>
    </section>
  );
}

function EquipoHoy({ empleadas, citas, ahora }) {
  const ahoraMin = minutosDeAhora(ahora);

  return (
    <section className="tarjeta p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-amari-titulo">Ocupación por especialista</h2>
        {empleadas.length > 0 && (
          <span className="text-sm">
            {empleadas.length} {empleadas.length === 1 ? "especialista" : "especialistas"}
          </span>
        )}
      </div>

      {empleadas.length === 0 ? (
        <p className="mt-4 text-sm">Nadie tiene turno hoy.</p>
      ) : (
        <ul className="mt-5 space-y-5">
          {empleadas.map((e) => {
            const suyas = citas.filter((c) => c.empleado_id === e.id);
            const siguiente = suyas.find(
              (c) => ESTADOS_ACTIVOS.includes(c.estado) && minutosDe(c.fin) > ahoraMin
            );

            let detalle = "Sin citas hoy";
            if (suyas.length > 0) {
              detalle = `${suyas.length} ${suyas.length === 1 ? "cita" : "citas"}`;
              if (!siguiente) detalle += " · agenda terminada";
              else if (minutosDe(siguiente.inicio) <= ahoraMin) detalle += " · atendiendo ahora";
              else detalle += ` · próxima ${horaDe(siguiente.inicio)}`;
            }

            return (
              <li key={e.id}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-amari-titulo"
                    style={{ backgroundColor: e.color }}
                  >
                    {iniciales(e.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-amari-titulo">{e.nombre}</p>
                    <p className="truncate text-sm">{detalle}</p>
                  </div>
                  <span className="text-sm font-bold text-amari-titulo">{e.porcentaje}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-amari-bg-soft">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${e.porcentaje}%`, backgroundColor: e.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DashboardAdmin() {
  const { usuario } = useAuth();
  const ahora = useAhora();
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

  const resumen = d ? resumenDia(d.citas_hoy, ahora) : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            {saludo(ahora)}, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            {d ? `${fechaLarga(d.fecha)} · Así va tu estudio hoy` : "Resumen del día"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/admin/servicios" className={botonSecundario}>
            <Scissors size={17} /> Servicios
          </Link>
          <button onClick={() => setModalCliente(true)} className={botonSecundario}>
            <UserPlus size={17} /> Nuevo cliente
          </button>
          <button onClick={() => setModalCita(true)} className="btn-primario px-6">
            <Plus size={18} /> Nueva cita
          </button>
        </div>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando resumen...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar el dashboard.</p>}

      {d && (
        <>
          <HeroDia
            citas={d.citas_hoy}
            ahora={ahora}
            mostrarEmpleada
            onSeleccionar={setSeleccionada}
          />

          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Estadistica
              icono={CalendarDays}
              titulo="Citas de hoy"
              valor={d.citas_hoy.length}
              detalle={`${resumen.completadas} ${resumen.completadas === 1 ? "completada" : "completadas"}`}
              chip={
                resumen.porAtender > 0
                  ? `${resumen.porAtender} por atender`
                  : resumen.sinCerrar > 0
                    ? `${resumen.sinCerrar} sin cerrar`
                    : undefined
              }
            />
            <Estadistica
              icono={BellRing}
              titulo="Por confirmar"
              valor={d.por_confirmar}
              detalle={d.por_confirmar > 0 ? "Toca para revisarlas" : "Todo al día"}
              chip={d.por_confirmar > 0 ? "Pendientes" : "Al día"}
              alerta={d.por_confirmar > 0}
              to="/admin/citas?filtro=pendientes"
            />
            <Estadistica
              icono={Gauge}
              titulo="Ocupación de hoy"
              valor={`${d.ocupacion.porcentaje}%`}
              detalle="de las horas de atención"
            >
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-amari-bg-soft">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amari-acento to-amari-primario"
                  style={{ width: `${d.ocupacion.porcentaje}%` }}
                />
              </div>
            </Estadistica>
            <Estadistica
              icono={Wallet}
              titulo={`Ingresos de ${mes}`}
              valor={formatearMoneda(d.ingresos.completadas)}
              detalle="en citas completadas"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <AgendaHoy
              titulo="Citas de hoy"
              citas={d.citas_hoy}
              ahora={ahora}
              mostrarEmpleada
              verTodas="/admin/citas"
              onSeleccionar={setSeleccionada}
            />

            <div className="space-y-6">
              <TarjetaIngresos ingresos={d.ingresos} mes={mes} />
              <AlertasInventario
                alertas={d.alertas_inventario}
                to="/admin/inventario?filtro=alertas"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopServicios titulo={`Servicios más pedidos en ${mes}`} servicios={d.servicios_top} />
            <EquipoHoy empleadas={d.ocupacion.empleadas} citas={d.citas_hoy} ahora={ahora} />
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