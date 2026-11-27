import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// `icono` es opcional: pásale un componente de lucide-react (por ejemplo Mail).
// `claseRaiz` cambia el contenedor (por defecto lleva margen inferior).
function Campo({ etiqueta, id, type = "text", icono: Icono, claseRaiz = "mb-4", ...props }) {
  const [visible, setVisible] = useState(false);
  const esPassword = type === "password";

  return (
    <div className={claseRaiz}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amari-primario"
      >
        {etiqueta}
      </label>
      <div className="relative">
        {Icono && (
          <Icono
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amari-primario"
          />
        )}
        <input
          id={id}
          type={esPassword && visible ? "text" : type}
          className={`w-full rounded-2xl border border-amari-borde bg-white py-3.5 text-base text-amari-titulo placeholder:text-amari-acento/50 focus:border-amari-primario focus:outline-none focus:ring-4 focus:ring-amari-primario/15 ${
            Icono ? "pl-11" : "pl-4"
          } ${esPassword ? "pr-12" : "pr-4"}`}
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-amari-acento"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Campo;