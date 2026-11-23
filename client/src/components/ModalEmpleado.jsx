import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import Campo from "./Campo";
import ModalClaveTemporal from "./ModalClaveTemporal";
import { crearEmpleado, actualizarEmpleado } from "../services/empleados.service";
import { COLORES_AGENDA, DIAS } from "../config/empleados";

const claseEtiqueta =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-amari-primario";

const claseChip = (activo) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    activo
      ? "border-transparent bg-amari-primario text-white"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

function ModalEmpleado({ empleado, servicios, onCerrar, onGuardado }) {
  const editando = Boolean(empleado);

  const [form, setForm] = useState({
    nombre: empleado?.nombre ?? "",
    apellidos: empleado?.apellidos ?? "",
    email: empleado?.email ?? "",
    telefono: empleado?.telefono ?? "",
    puesto: empleado?.puesto ?? "",
    comision_pct: empleado?.comision_pct ?? 40,
    color: empleado?.color ?? COLORES_AGENDA[0],
    dias_laborales: empleado?.dias_laborales ?? [1, 2, 3, 4, 5, 6],
    servicios_ids: empleado?.servicios_ids ?? [],
    activo: empleado?.activo ?? true,
    restablecer_clave: false,
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [claveGenerada, setClaveGenerada] = useState(null);

  useEffect(() => {
    const alPresionar = (e) => {
      // Con la contraseña a la vista, Escape no debe cerrar (se perdería)
      if (e.key === "Escape" && !claveGenerada) onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar, claveGenerada]);

  const cambiar = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const alternar = (campo, valor) =>
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(valor)
        ? f[campo].filter((v) => v !== valor)
        : [...f[campo], valor],
    }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const resultado = editando
        ? await actualizarEmpleado(empleado.id, form)
        : await crearEmpleado(form);

      const clave = resultado?.clave_temporal ?? resultado?.data?.clave_temporal ?? null;

      if (clave) {
        setClaveGenerada({
          nombre: `${form.nombre.trim()} ${form.apellidos.trim()}`,
          email: form.email.trim().toLowerCase(),
          clave,
          nuevo: !editando,
        });
        setEnviando(false);
      } else if (!editando) {
        setError(
          "La empleada se creó, pero no se recibió su contraseña. Ciérrala, edítala y marca «Restablecer contraseña»."
        );
        setEnviando(false);
      } else {
        onGuardado();
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar la empleada");
      setEnviando(false);
    }
  };

  if (claveGenerada) {
    return <ModalClaveTemporal {...claveGenerada} onCerrar={onGuardado} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="tarjeta max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            {editando ? "Editar Empleada" : "Nueva Empleada"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-amari-acento hover:text-amari-primario-oscuro"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={enviar} className="px-6 py-5">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Campo id="nombre" name="nombre" etiqueta="Nombre *" required value={form.nombre} onChange={cambiar} />
            <Campo id="apellidos" name="apellidos" etiqueta="Apellido *" required value={form.apellidos} onChange={cambiar} />
            <Campo id="email" name="email" type="email" etiqueta="Email *" required value={form.email} onChange={cambiar} />
            <Campo id="telefono" name="telefono" type="tel" etiqueta="Teléfono" value={form.telefono} onChange={cambiar} />
            <Campo
              id="puesto"
              name="puesto"
              etiqueta="Especialidad"
              placeholder="Ej: Nails & Eyelashes"
              value={form.puesto}
              onChange={cambiar}
            />
            <Campo
              id="comision_pct"
              name="comision_pct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              etiqueta="Comisión (%)"
              value={form.comision_pct}
              onChange={cambiar}
            />
            <div className="mb-4">
              <span className={claseEtiqueta}>Color en agenda</span>
              <div className="flex gap-2">
                {COLORES_AGENDA.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-8 w-8 rounded-full transition ${
                      form.color === c ? "ring-2 ring-amari-primario-oscuro ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <span className={claseEtiqueta}>Días laborales</span>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <button
                  key={d.valor}
                  type="button"
                  onClick={() => alternar("dias_laborales", d.valor)}
                  className={claseChip(form.dias_laborales.includes(d.valor))}
                >
                  {d.corto}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <span className={claseEtiqueta}>Servicios que puede realizar</span>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {servicios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => alternar("servicios_ids", s.id)}
                  className={claseChip(form.servicios_ids.includes(s.id))}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>

          {!editando && (
            <p className="mb-4 rounded-xl bg-amari-bg-soft px-3 py-2 text-xs text-amari-texto">
              Al guardar se generará una <strong>contraseña temporal</strong> que verás una sola vez. La
              empleada deberá cambiarla al entrar por primera vez.
            </p>
          )}

          {editando && (
            <div className="mb-4 space-y-2">
              <label className="flex items-center gap-2 text-sm text-amari-titulo">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={cambiar}
                  className="h-4 w-4 accent-amari-primario"
                />
                Empleada activa (puede iniciar sesión)
              </label>
              <label className="flex items-center gap-2 text-sm text-amari-titulo">
                <input
                  type="checkbox"
                  name="restablecer_clave"
                  checked={form.restablecer_clave}
                  onChange={cambiar}
                  className="h-4 w-4 accent-amari-primario"
                />
                Restablecer contraseña (se genera una temporal)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primario">
              {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Crear empleada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEmpleado;