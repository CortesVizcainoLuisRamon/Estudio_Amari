import { useEffect } from "react";
import { KeyRound, MessageCircle, Phone, X } from "lucide-react";
import { ESTUDIO } from "../config/estudio";
import { WHATSAPP_ESTUDIO } from "../config/notificaciones";

// Mientras WHATSAPP_ESTUDIO siga con el número de ejemplo, no se muestra el botón.
const HAY_WHATSAPP = Boolean(WHATSAPP_ESTUDIO) && WHATSAPP_ESTUDIO !== "520000000000";

function ModalOlvideClave({ abierto, correo, onCerrar }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const mensaje =
    `Hola, olvidé mi contraseña de ${ESTUDIO.nombre}` +
    (correo ? ` (mi correo es ${correo})` : "") +
    ". ¿Me pueden generar una clave temporal?";
  const urlWhatsapp = `https://wa.me/${WHATSAPP_ESTUDIO}?text=${encodeURIComponent(mensaje)}`;

  const pasos = [
    "Avísale al estudio por WhatsApp o por teléfono.",
    "Te generan una clave temporal.",
    "Entras con ella y la cambias por una nueva.",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-olvide"
        className="relative w-full max-w-md rounded-3xl border border-amari-borde bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-full p-2 text-amari-texto/60 transition hover:bg-pink-50 hover:text-amari-primario"
        >
          <X size={18} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-amari-primario-oscuro">
          <KeyRound size={22} />
        </div>
        <h2 id="titulo-olvide" className="mt-4 font-display text-2xl font-semibold text-amari-titulo">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="mt-2 text-sm leading-relaxed">
          Por seguridad no podemos enviarte la clave por correo. Pídele al estudio que te genere una
          clave temporal.
        </p>

        <ol className="mt-5 space-y-3">
          {pasos.map((paso, i) => (
            <li key={paso} className="flex items-center gap-3 text-sm">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-amari-titulo">{paso}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col gap-3">
          {HAY_WHATSAPP && (
            <a href={urlWhatsapp} target="_blank" rel="noreferrer" className="btn-primario w-full py-3">
              <MessageCircle size={16} />
              Escribir por WhatsApp
            </a>
          )}
          <a
            href={`tel:${ESTUDIO.telefonoLink}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-pink-200 bg-white py-3 text-sm font-semibold text-amari-primario-oscuro transition hover:bg-pink-50"
          >
            <Phone size={16} />
            Llamar al {ESTUDIO.telefono}
          </a>
        </div>
      </div>
    </div>
  );
}

export default ModalOlvideClave;