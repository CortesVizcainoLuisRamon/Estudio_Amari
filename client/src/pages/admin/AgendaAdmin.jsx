import { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getCitas } from "../../services/citas.service";
import ModalCita from "../../components/ModalCita";
import DetalleCita from "../../components/DetalleCita";
import { ESTADOS_CITA } from "../../config/citas";
import { aTexto, sumarDias, inicioSemana, rangoSemana, horaDe } from "../../utils/fechas";

const botonNav =
  "flex items-center justify-center rounded-full border border-amari-borde bg-white px-3 py-1.5 text-sm font-medium text-amari-primario hover:bg-amari-bg-soft";

function AgendaAdmin() {
  const [lunes, setLunes] = useState(() => inicioSemana(new Date()));
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);

  const desde = aTexto(lunes);
  const hasta = aTexto(sumarDias(lunes, 6));
  const clave = `${desde}|${version}`;

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

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const hoy = aTexto(new Date());

  const recargar = () => setVersion((v) => v + 1);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Agenda de Citas
          </h1>
          <p className="mt-1 text-sm text-amari-acento">{rangoSemana(lunes)}</p>
        </div>
        <button onClick={() => setModalNueva(true)} className="btn-primario">
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      <div className="mb-4 flex gap-2">
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

      {cargando && <p className="text-center text-amari-primario">Cargando agenda...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar la agenda.</p>}

      {!cargando && !error && (
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
                  {delDia.length === 0 && (
                    <p className="py-6 text-center text-amari-borde">–</p>
                  )}

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