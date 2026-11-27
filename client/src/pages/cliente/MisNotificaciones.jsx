import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Bell, MessageCircle, CheckCheck } from "lucide-react";
import { getMisNotificaciones, marcarLeida, marcarTodasLeidas } from "../../services/notificaciones.service";
import { TIPOS_NOTIFICACION, WHATSAPP_ESTUDIO, enlaceWA } from "../../config/notificaciones";

function MisNotificaciones() {
  const { recargarContador } = useOutletContext();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let activo = true;
    getMisNotificaciones()
      .then((data) => activo && setResultado({ data }))
      .catch(() => activo && setResultado({ error: true }));
    return () => {
      activo = false;
    };
  }, [version]);

  const lista = resultado?.data ?? [];
  const noLeidas = lista.filter((n) => !n.leida).length;

  const marcar = async (fn) => {
    try {
      await fn();
      setVersion((v) => v + 1);
      recargarContador();
    } catch {
      /* si falla, la lista simplemente no cambia */
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Mis notificaciones</h1>
          <p className="mt-1 text-sm text-amari-acento">
            {noLeidas === 0 ? "Estás al día" : `${noLeidas} sin leer`}
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={() => marcar(marcarTodasLeidas)}
            className="btn-secundario"
          >
            <CheckCheck size={16} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {!resultado && <p className="text-center text-amari-primario">Cargando...</p>}
      {resultado?.error && <p className="text-center text-red-600">No se pudieron cargar tus notificaciones.</p>}

      {resultado?.data && lista.length === 0 && (
        <div className="vacio">
          <Bell size={36} className="text-amari-acento" />
          <p className="text-amari-texto">Aún no tienes notificaciones.</p>
        </div>
      )}

      <div className="space-y-3">
        {lista.map((n) => {
          const t = TIPOS_NOTIFICACION[n.tipo];
          const Icono = t.icono;
          const enlace = enlaceWA(WHATSAPP_ESTUDIO, `Hola, te escribo sobre este aviso: ${n.mensaje}`);

          return (
            <article
              key={n.id}
              className={`tarjeta relative p-5 sm:p-6 ${n.leida ? "opacity-80 shadow-sm" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${t.color}`}
                >
                  <Icono size={14} /> {t.texto}
                </span>
                {!n.leida && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amari-primario-oscuro">
                    <span className="h-2 w-2 rounded-full bg-amari-primario" /> Nueva
                  </span>
                )}
                <span className="flex-1 text-right text-xs text-amari-acento">{n.creada_en}</span>
              </div>

              <p className="mt-3 rounded-2xl bg-amari-bg-soft/70 px-4 py-3 text-sm leading-relaxed text-amari-texto">
                {n.mensaje}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={enlace}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-green-600/25 transition hover:bg-green-700"
                >
                  <MessageCircle size={16} /> Ver en WA
                </a>
                {!n.leida && (
                  <button
                    onClick={() => marcar(() => marcarLeida(n.id))}
                    className="btn-secundario py-2"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default MisNotificaciones;