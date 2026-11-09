import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getCitas, cambiarEstado } from "../../services/citas.service";
import ModalCita from "../../components/ModalCita";
import DetalleCita from "../../components/DetalleCita";
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

const botonNav =
  "flex items-center justify-center rounded-full border border-amari-borde bg-white px-3 py-1.5 text-sm font-medium text-amari-primario hover:bg-amari-bg-soft";

const dos = (n) => String(n).padStart(2, "0");

const textoAhora = () => {
  const n = new Date();
  return `${aTexto(n)} ${dos(n.getHours())}:${dos(n.getMinutes())}`;
};

const claseVista = (activa) =>
  `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
    activa
      ? "bg-amari-primario text-white shadow-sm"
      : "text-amari-primario hover:bg-amari-bg-soft"
  }`;

const claseFiltro = (activo) =>
  `rounded-full border px-3 py-1 text-xs font-semibold transition ${
    activo
      ? "border-transparent bg-amari-titulo text-white"
      : "border-amari-borde bg-white text-amari-primario-oscuro hover:bg-amari-bg-soft"
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
        <button onClick={() => setModalNueva(true)} className="btn-primario">
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-amari-borde bg-white p-1">
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
              className={botonNav}
            >
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setLunes(inicioSemana(new Date()))} className={botonNav}>
              Hoy
            </button>
            <button
              onClick={() => setLunes(sumarDias(lunes, 7))}
              aria-label="Semana siguiente"
              className={botonNav}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {!esSemana && !cargando && !error && (
          <div className="flex gap-2">
            <button onClick={() => setFiltro("todas")} className={claseFiltro(filtro === "todas")}>
              Todas ({proximas.length})
            </button>
            <button
              onClick={() => setFiltro("pendientes")}
              className={claseFiltro(filtro === "pendientes")}
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
            <div className="tarjeta px-6 py-10 text-center text-amari-texto">
              {filtro === "pendientes"
                ? "No hay citas por confirmar. ¡Todo al día!"
                : "No hay citas próximas."}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(porDia).map(([dia, lista]) => (
                <section key={dia}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amari-titulo">
                    {etiquetaDia(dia) && (
                      <span className="rounded-full bg-amari-primario px-2.5 py-0.5 text-xs text-white">
                        {etiquetaDia(dia)}
                      </span>
                    )}
                    {fechaLarga(dia)}
                  </h2>

                  <div className="space-y-2">
                    {lista.map((c) => {
                      const estado = ESTADOS_CITA[c.estado];

                      return (
                        <div
                          key={c.id}
                          style={{ borderLeftColor: c.color }}
                          className="tarjeta flex items-stretch border-l-4"
                        >
                          <button
                            onClick={() => setSeleccionada(c)}
                            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 p-3 text-left text-sm hover:bg-amari-bg-soft"
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

                          {c.estado === "pendiente" && (
                            <button
                              onClick={() => confirmarRapido(c)}
                              disabled={confirmando === c.id}
                              className="m-2 shrink-0 self-center rounded-full bg-amari-primario px-4 py-1.5 text-xs font-semibold text-white hover:bg-amari-primario-oscuro disabled:opacity-60"
                            >
                              {confirmando === c.id ? "..." : "Confirmar"}
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                    className={`font-display text-xl font-semibold ${
                      esHoy ? "text-amari-primario" : "text-amari-titulo"
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
                        className={`w-full rounded-lg border border-amari-borde border-l-4 bg-white p-2 text-left text-xs shadow-sm transition hover:shadow-md ${
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