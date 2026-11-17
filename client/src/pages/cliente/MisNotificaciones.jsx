import { useEffect, useState } from "react";
import { Bell, MessageCircle, CheckCheck } from "lucide-react";
import { getMisNotificaciones, marcarLeida, marcarTodasLeidas } from "../../services/notificaciones.service";
import { TIPOS_NOTIFICACION, WHATSAPP_ESTUDIO, enlaceWA } from "../../config/notificaciones";

function MisNotificaciones() {
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
            className="inline-flex items-center gap-2 rounded-xl border border-amari-borde px-4 py-2 text-sm font-semibold text-amari-primario hover:bg-amari-bg-soft"
          >
            <CheckCheck size={16} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {!resultado && <p className="text-center text-amari-primario">Cargando...</p>}
      {resultado?.error && <p className="text-center text-red-600">No se pudieron cargar tus notificaciones.</p>}

      {resultado?.data && lista.length === 0 && (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
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
              className={`tarjeta p-4 ${!n.leida ? "border-l-4 border-l-amari-primario" : "opacity-80"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${t.color}`}
                >
                  <Icono size={14} /> {t.texto}
                </span>
                <span className="flex-1 text-right text-xs text-amari-acento">{n.creada_en}</span>
              </div>

              <p className="mt-3 text-sm text-amari-texto">{n.mensaje}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={enlace}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageCircle size={16} /> Ver en WA
                </a>
                {!n.leida && (
                  <button
                    onClick={() => marcar(() => marcarLeida(n.id))}
                    className="rounded-xl border border-amari-borde px-4 py-2 text-sm font-semibold text-amari-primario hover:bg-amari-bg-soft"
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