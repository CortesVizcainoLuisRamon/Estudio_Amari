import { useState } from "react";
import { KeyRound, Copy, Check, TriangleAlert } from "lucide-react";

function ModalClaveTemporal({ nombre, email, clave, nuevo, onCerrar }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiado(true);
    } catch {
      /* sin portapapeles: la clave se puede seleccionar y copiar a mano */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta w-full max-w-md p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
          <KeyRound size={18} className="text-amari-primario" />
          {nuevo ? "Acceso creado" : "Contraseña restablecida"}
        </h2>

        <p className="mt-3 text-sm text-amari-texto">
          Esta es la contraseña temporal de <strong>{nombre}</strong>. Para entrar usa el correo{" "}
          <strong className="break-all">{email}</strong>.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amari-borde bg-amari-bg-soft p-3">
          <code className="flex-1 select-all break-all text-center font-mono text-xl font-semibold tracking-wider text-amari-titulo">
            {clave}
          </code>
          <button
            type="button"
            onClick={copiar}
            aria-label="Copiar contraseña"
            className="rounded-lg p-2 text-amari-primario hover:bg-white"
          >
            {copiado ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            Solo se muestra <strong>una vez</strong>: al cerrar esta ventana no se podrá volver a ver. Al
            entrar, el sistema le pedirá cambiarla por una propia.
          </span>
        </p>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onCerrar} className="btn-primario">
            Ya la copié, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalClaveTemporal;