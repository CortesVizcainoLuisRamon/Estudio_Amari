import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarCheck, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getCitas, cambiarEstado } from "../../services/citas.service";
import ModalCita from "../../components/ModalCita";
import DetalleCita from "../../components/DetalleCita";
import FilaCita from "../../components/FilaCita";
import { ESTADOS_CITA } from "../../config/citas";
import {
  aTexto,
  deTexto,
  sumarDias,
  inicioSemana,
  rangoSemana,
  horaDe,
  fechaLarga,
} from "../../utils/fechas";

const DIAS_PROXIMAS = 60;

const dos = (n) => String(n).padStart(2, "0");

const textoAhora = () => {
  const n = new Date();
  return `${aTexto(n)} ${dos(n.getHours())}:${dos(n.getMinutes())}`;
};

const claseVista = (activa) =>
  `rounded-full px-5 py-1.5 text-sm font-semibold transition ${
    activa
      ? "bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "text-amari-primario-oscuro hover:bg-amari-bg-soft"
  }`;

function AgendaAdmin() {
  const [params] = useSearchParams();
  const [vista, setVista] = useState("proximas");
  const [filtro, setFiltro] = useState(
    params.get("filtro") === "pendientes" ? "pendientes" : "todas"
  );
  const [lunes, setLunes] = useState(() => inicioSemana(new Date()));
  const [hoy] = useState(() => aTexto(new Date()));
  const [ahora] = useState(textoAhora);
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [errorAccion, setErrorAccion] = useState("");

  const esSemana = vista === "semana";
  const desde = esSemana ? aTexto(lunes) : hoy;
  const hasta = esSemana
    ? aTexto(sumarDias(lunes, 6))
    : aTexto(sumarDias(deTexto(hoy), DIAS_PROXIMAS));
  const clave = `${vista}|${desde}|${version}`;

  useEffect(() => {
    let activo = true;

    getCitas(desde, hasta)
      .then((data) => {
        if (activo) setResultado({ clave, data });
      })
      .catch(() => {
        if (activo) setResultado({ clave, error: true });
      });

    return () => {
      activo = false;
    };
  }, [desde, hasta, clave]);

  const cargando = resultado?.clave !== clave;
  const error = !cargando && resultado.error;
  const citas = !cargando && !error ? resultado.data : [];

  const recargar = () => setVersion((v) => v + 1);

  const confirmarRapido = async (cita) => {
    setErrorAccion("");
    setConfirmando(cita.id);

    try {
      await cambiarEstado(cita.id, "confirmada");
      recargar();
    } catch (err) {
      setErrorAccion(err.response?.data?.mensaje || "No se pudo confirmar la cita");
    } finally {
      setConfirmando(null);
    }
  };

  // ---------- Vista "Próximas" ----------
  const proximas = citas.filter(
    (c) => (c.estado === "pendiente" || c.estado === "confirmada") && c.inicio >= ahora
  );
  const porConfirmar = proximas.filter((c) => c.estado === "pendiente");
  const visibles = filtro === "pendientes" ? porConfirmar : proximas;

  const porDia = visibles.reduce((grupos, c) => {
    const dia = c.inicio.slice(0, 10);
    (grupos[dia] ??= []).push(c);
    return grupos;
  }, {});

  const manana = aTexto(sumarDias(deTexto(hoy), 1));
  const etiquetaDia = (dia) => (dia === hoy ? "Hoy" : dia === manana ? "Mañana" : "");

  // ---------- Vista "Semana" ----------
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Agenda de Citas
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            {esSemana ? rangoSemana(lunes) : `Próximos ${DIAS_PROXIMAS} días`}
          </p>
        </div>
        <button onClick={() => setModalNueva(true)} className="btn-primario px-6">
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-amari-borde bg-white p-1 shadow-sm">
          <button onClick={() => setVista("proximas")} className={claseVista(!esSemana)}>
            Próximas
          </button>
          <button onClick={() => setVista("semana")} className={claseVista(esSemana)}>
            Semana
          </button>
        </div>

        {esSemana && (
          <div className="flex gap-2">
            <button
              onClick={() => setLunes(sumarDias(lunes, -7))}
              aria-label="Semana anterior"
              className="chip px-3"
            >
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setLunes(inicioSemana(new Date()))} className="chip">
              Hoy
            </button>
            <button
              onClick={() => setLunes(sumarDias(lunes, 7))}
              aria-label="Semana siguiente"
              className="chip px-3"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {!esSemana && !cargando && !error && (
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro("todas")}
              className={`chip ${filtro === "todas" ? "chip-activo" : ""}`}
            >
              Todas ({proximas.length})
            </button>
            <button
              onClick={() => setFiltro("pendientes")}
              className={`chip ${filtro === "pendientes" ? "chip-activo" : ""}`}
            >
              Por confirmar ({porConfirmar.length})
            </button>
          </div>
        )}
      </div>

      {errorAccion && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorAccion}</p>
      )}

      {cargando && <p className="text-center text-amari-primario">Cargando agenda...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar la agenda.</p>}

      {/* ---------- PRÓXIMAS ---------- */}
      {!esSemana && !cargando && !error && (
        <>
          {visibles.length === 0 ? (
            <div className="vacio text-amari-texto">
              <CalendarCheck size={30} className="text-amari-acento" />
              {filtro === "pendientes"
                ? "No hay citas por confirmar. ¡Todo al día!"
                : "No hay citas próximas."}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(porDia).map(([dia, lista]) => (
                <section key={dia} className="tarjeta p-4 sm:p-5">
                  <h2 className="mb-2 flex flex-wrap items-center gap-2.5 px-2 font-display text-lg font-semibold text-amari-titulo">
                    {etiquetaDia(dia) && (
                      <span className="rounded-full bg-linear-to-r from-amari-primario to-amari-primario-oscuro px-3 py-1 font-sans text-xs font-bold text-white">
                        {etiquetaDia(dia)}
                      </span>
                    )}
                    {fechaLarga(dia)}
                    <span className="font-sans text-sm font-normal text-amari-acento">
                      · {lista.length} {lista.length === 1 ? "cita" : "citas"}
                    </span>
                  </h2>

                  <div className="space-y-1">
                    {lista.map((c) => (
                      <FilaCita
                        key={c.id}
                        cita={c}
                        mostrarEmpleada
                        onSeleccionar={setSeleccionada}
                        accion={
                          c.estado === "pendiente" && (
                            <button
                              onClick={() => confirmarRapido(c)}
                              disabled={confirmando === c.id}
                              className="btn-primario px-4 py-1.5 text-xs"
                            >
                              {confirmando === c.id ? "..." : "Confirmar"}
                            </button>
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- SEMANA ---------- */}
      {esSemana && !cargando && !error && (
        <div className="tarjeta grid overflow-hidden md:grid-cols-7">
          {dias.map((dia, i) => {
            const texto = aTexto(dia);
            const delDia = citas.filter((c) => c.inicio.startsWith(texto));
            const esHoy = texto === hoy;

            return (
              <section
                key={texto}
                className={`min-w-0 border-amari-borde ${i > 0 ? "border-t md:border-l md:border-t-0" : ""}`}
              >
                <header
                  className={`border-b border-amari-borde px-2 py-3 text-center ${
                    esHoy ? "bg-amari-bg-soft" : ""
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amari-acento">
                    {dia.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "")}
                  </p>
                  <p
                    className={`mx-auto mt-0.5 flex h-9 w-9 items-center justify-center rounded-full font-display text-xl font-semibold ${
                      esHoy
                        ? "bg-linear-to-br from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
                        : "text-amari-titulo"
                    }`}
                  >
                    {dia.getDate()}
                  </p>
                </header>

                <div className="space-y-2 p-2 md:min-h-72">
                  {delDia.length === 0 && <p className="py-6 text-center text-amari-borde">–</p>}

                  {delDia.map((c) => {
                    const estado = ESTADOS_CITA[c.estado];
                    const inactiva = c.estado === "cancelada" || c.estado === "no_asistio";

                    return (
                      <button
                        key={c.id}
                        onClick={() => setSeleccionada(c)}
                        style={{ borderLeftColor: c.color }}
                        className={`w-full rounded-xl border border-amari-borde border-l-4 bg-white p-2.5 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          inactiva ? "opacity-50" : ""
                        }`}
                      >
                        <p className="font-semibold text-amari-titulo">
                          {horaDe(c.inicio)} – {horaDe(c.fin)}
                        </p>
                        <p className="truncate text-amari-titulo">{c.cliente}</p>
                        <p className="truncate text-amari-acento">
                          {c.servicios.map((s) => s.nombre).join(", ")}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {modalNueva && (
        <ModalCita
          onCerrar={() => setModalNueva(false)}
          onGuardado={() => {
            setModalNueva(false);
            recargar();
          }}
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

export default AgendaAdmin;