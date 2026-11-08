import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function Campo({ etiqueta, id, type = "text", ...props }) {
  const [visible, setVisible] = useState(false);
  const esPassword = type === "password";

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario"
      >
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={esPassword && visible ? "text" : type}
          className="w-full rounded-xl border border-amari-borde bg-white px-4 py-2.5 text-sm text-amari-titulo placeholder:text-amari-acento/50 focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amari-acento"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Campo;