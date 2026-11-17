import { useEffect, useState } from "react";
import { Bell, MessageCircle, Check, Trash2, Megaphone } from "lucide-react";
import {
  getNotificaciones,
  crearPromocion,
  marcarEnviada,
  descartarNotificacion,
} from "../../services/notificaciones.service";
import { TIPOS_NOTIFICACION, enlaceWA } from "../../config/notificaciones";

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

function NotificacionesAdmin() {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [pestana, setPestana] = useState("pendiente");
  const [tipo, setTipo] = useState("todos");
  const [promo, setPromo] = useState({ abierto: false, texto: "", enviando: false, error: "" });
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let activo = true;
    getNotificaciones()
      .then((data) => activo && setResultado({ data }))
      .catch(() => activo && setResultado({ error: true }));
    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = () => setVersion((v) => v + 1);
  const lista = resultado?.data ?? [];

  const pendientes = lista.filter((n) => n.estado === "pendiente").length;
  const visibles = lista.filter(
    (n) =>
      (pestana === "todas" || n.estado === (pestana === "pendiente" ? "pendiente" : "enviada")) &&
      (tipo === "todos" || n.tipo === tipo)
  );

  const accion = async (fn) => {
    try {
      await fn();
      recargar();
    } catch {
      setAviso("No se pudo completar la acción.");
    }
  };

  const enviarPromo = async () => {
    setPromo((p) => ({ ...p, enviando: true, error: "" }));
    try {
      const { creadas } = await crearPromocion(promo.texto.trim());
      setPromo({ abierto: false, texto: "", enviando: false, error: "" });
      setAviso(`Promoción creada para ${creadas} ${creadas === 1 ? "clienta" : "clientas"}.`);
      recargar();
    } catch (err) {
      setPromo((p) => ({
        ...p,
        enviando: false,
        error: err.response?.data?.mensaje ?? "No se pudo crear la promoción",
      }));
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Centro de notificaciones
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            {pendientes} {pendientes === 1 ? "mensaje pendiente" : "mensajes pendientes"} de enviar
          </p>
        </div>
        <button
          onClick={() => setPromo((p) => ({ ...p, abierto: !p.abierto }))}
          className="btn-primario inline-flex items-center gap-2"
        >
          <Megaphone size={18} /> Nueva promoción
        </button>
      </div>

      {aviso && (
        <p
          onClick={() => setAviso("")}
          className="mb-4 cursor-pointer rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {aviso}
        </p>
      )}

      {promo.abierto && (
        <div className="tarjeta mb-6 p-5">
          <label
            htmlFor="promo-texto"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario"
          >
            Mensaje para todas las clientas
          </label>
          <textarea
            id="promo-texto"
            rows={3}
            maxLength={500}
            value={promo.texto}
            onChange={(e) => setPromo((p) => ({ ...p, texto: e.target.value }))}
            placeholder="Ej: Este mes, 15% en Gelish. ¡Agenda tu cita!"
            className="w-full rounded-xl border border-amari-borde bg-white px-4 py-2 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
          />
          {promo.error && <p className="mt-2 text-sm text-red-600">{promo.error}</p>}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-amari-acento">{promo.texto.length}/500 · solo clientas con teléfono</span>
            <button
              onClick={enviarPromo}
              disabled={promo.enviando || promo.texto.trim().length < 10}
              className="btn-primario disabled:opacity-50"
            >
              {promo.enviando ? "Creando..." : "Crear mensajes"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ["pendiente", "Pendientes"],
          ["enviada", "Enviadas"],
          ["todas", "Todas"],
        ].map(([v, t]) => (
          <button key={v} onClick={() => setPestana(v)} className={chip(pestana === v)}>
            {t}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setTipo("todos")} className={chip(tipo === "todos")}>
          Todos los tipos
        </button>
        {Object.entries(TIPOS_NOTIFICACION).map(([v, t]) => (
          <button key={v} onClick={() => setTipo(v)} className={chip(tipo === v)}>
            {t.texto}
          </button>
        ))}
      </div>

      {!resultado && <p className="text-center text-amari-primario">Cargando notificaciones...</p>}
      {resultado?.error && <p className="text-center text-red-600">No se pudieron cargar las notificaciones.</p>}

      {resultado?.data && visibles.length === 0 && (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Bell size={36} className="text-amari-acento" />
          <p className="text-amari-texto">No hay notificaciones en esta vista.</p>
        </div>
      )}

      <div className="space-y-3">
        {visibles.map((n) => {
          const t = TIPOS_NOTIFICACION[n.tipo];
          const Icono = t.icono;
          const enlace = enlaceWA(n.telefono, n.mensaje);

          return (
            <article key={n.id} className="tarjeta p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${t.color}`}
                >
                  <Icono size={14} /> {t.texto}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-amari-titulo">
                  {n.cliente}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    n.estado === "pendiente" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {n.estado === "pendiente" ? "Pendiente" : "Enviada"}
                </span>
              </div>

              <p className="mt-3 rounded-xl bg-amari-bg-soft p-3 text-sm text-amari-texto">{n.mensaje}</p>
              <p className="mt-2 text-xs text-amari-acento">Generada {n.creada_en}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {enlace ? (
                  <a
                    href={enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <MessageCircle size={16} /> Enviar WA
                  </a>
                ) : (
                  <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500">Sin teléfono</span>
                )}
                {n.estado === "pendiente" && (
                  <>
                    <button
                      onClick={() => accion(() => marcarEnviada(n.id))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amari-borde px-4 py-2 text-sm font-semibold text-amari-primario hover:bg-amari-bg-soft"
                    >
                      <Check size={16} /> Marcar enviado
                    </button>
                    <button
                      onClick={() => accion(() => descartarNotificacion(n.id))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} /> Descartar
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {lista.length === 200 && (
        <p className="mt-3 text-center text-xs text-amari-acento">Se muestran las 200 más recientes.</p>
      )}
    </>
  );
}

export default NotificacionesAdmin;