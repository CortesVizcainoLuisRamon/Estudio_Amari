import { useEffect, useState } from "react";
import { Plus, CalendarHeart } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getMisCitas, cancelarMiCita } from "../../services/citas.service";
import ModalCitaCliente from "../../components/ModalCitaCliente";
import { ESTADOS_CITA } from "../../config/citas";
import { aTexto, fechaLarga, horaDe } from "../../utils/fechas";
import { formatearMoneda, etiquetaPrecio } from "../../utils/formato";

const dos = (n) => String(n).padStart(2, "0");

const textoAhora = () => {
  const n = new Date();
  return `${aTexto(n)} ${dos(n.getHours())}:${dos(n.getMinutes())}`;
};

function TarjetaCita({ cita, puedeCancelar, onCambio }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const estado = ESTADOS_CITA[cita.estado];

  const cancelar = async () => {
    setError("");
    setEnviando(true);

    try {
      await cancelarMiCita(cita.id);
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cancelar la cita");
      setEnviando(false);
      setConfirmando(false);
    }
  };

  return (
    <article
      style={{ borderLeftColor: cita.color }}
      className="tarjeta border-l-4 p-4 text-sm text-amari-titulo"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold capitalize">{fechaLarga(cita.inicio.slice(0, 10))}</p>
          <p className="text-amari-acento">
            {horaDe(cita.inicio)} a {horaDe(cita.fin)} · {cita.empleada}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}
        >
          {estado.texto}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {cita.servicios.map((s) => (
          <li key={s.id} className="flex justify-between gap-3">
            <span>{s.nombre}</span>
            <span className="shrink-0 text-amari-primario-oscuro">{etiquetaPrecio(s)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-amari-borde pt-3">
        <p className="font-display text-base font-semibold">
          Total estimado: {formatearMoneda(cita.total)}
        </p>

        {puedeCancelar && !confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            Cancelar cita
          </button>
        )}

        {puedeCancelar && confirmando && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amari-acento">¿Seguro?</span>
            <button
              type="button"
              disabled={enviando}
              onClick={cancelar}
              className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {enviando ? "Cancelando..." : "Sí, cancelar"}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setConfirmando(false)}
              className="rounded-full border border-amari-borde px-4 py-1.5 font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
            >
              No
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}
    </article>
  );
}

function MisCitas() {
  const { usuario } = useAuth();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [modal, setModal] = useState(false);
  const [aviso, setAviso] = useState("");
  const [ahora] = useState(textoAhora);

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getMisCitas()
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
  const citas = !cargando && !error ? resultado.data : [];

  const esProxima = (c) =>
    (c.estado === "pendiente" || c.estado === "confirmada") && c.inicio >= ahora;

  // El servidor las manda de la más reciente a la más antigua
  const proximas = citas.filter(esProxima).reverse();
  const historial = citas.filter((c) => !esProxima(c));

  const recargar = () => setVersion((v) => v + 1);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-amari-acento">Aquí están tus citas en Estudio Amari.</p>
        </div>
        <button
          onClick={() => {
            setAviso("");
            setModal(true);
          }}
          className="btn-primario"
        >
          <Plus size={18} /> Agendar cita
        </button>
      </div>

      {aviso && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{aviso}</p>
      )}

      {cargando && <p className="text-center text-amari-primario">Cargando tus citas...</p>}
      {error && <p className="text-center text-red-600">No se pudieron cargar tus citas.</p>}

      {!cargando && !error && (
        <>
          <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
            Próximas citas
          </h2>

          {proximas.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
              <CalendarHeart size={36} className="text-amari-acento" />
              <p className="text-amari-texto">No tienes citas próximas.</p>
              <button onClick={() => setModal(true)} className="btn-primario">
                <Plus size={18} /> Agendar mi cita
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {proximas.map((c) => (
                <TarjetaCita key={c.id} cita={c} puedeCancelar onCambio={recargar} />
              ))}
            </div>
          )}

          {historial.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 font-display text-xl font-semibold text-amari-titulo">
                Historial
              </h2>
              <div className="space-y-3">
                {historial.map((c) => (
                  <TarjetaCita key={c.id} cita={c} puedeCancelar={false} onCambio={recargar} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {modal && (
        <ModalCitaCliente
          onCerrar={() => setModal(false)}
          onGuardado={() => {
            setModal(false);
            setAviso(
              "¡Listo! Tu cita quedó registrada y está pendiente de confirmación por el estudio."
            );
            recargar();
          }}
        />
      )}
    </>
  );
}

export default MisCitas;