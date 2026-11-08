import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import { crearServicio, actualizarServicio } from "../services/servicios.service";

const claseInput =
  "w-full rounded-xl border border-amari-borde bg-white px-4 py-2.5 text-sm text-amari-titulo placeholder:text-amari-acento/50 focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20";
const claseEtiqueta =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario";
const claseCasilla = "flex items-center gap-2 text-sm text-amari-titulo";

function ModalServicio({ servicio, categorias, onCerrar, onGuardado }) {
  const editando = Boolean(servicio);

  const [form, setForm] = useState({
    nombre: servicio?.nombre ?? "",
    categoria_id: servicio?.categoria_id ?? categorias[0]?.id ?? "",
    precio: servicio?.precio ?? "",
    precio_desde: servicio?.precio_desde ?? false,
    duracion_min: servicio?.duracion_min ?? 60,
    requiere_patch_test: servicio?.requiere_patch_test ?? false,
    descripcion: servicio?.descripcion ?? "",
    activo: servicio?.activo ?? true,
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const cambiar = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const datos = {
      ...form,
      categoria_id: Number(form.categoria_id),
      duracion_min: Number(form.duracion_min),
    };

    try {
      if (editando) await actualizarServicio(servicio.id, datos);
      else await crearServicio(datos);
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el servicio");
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="tarjeta max-h-[90vh] w-full max-w-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            {editando ? "Editar Servicio" : "Nuevo Servicio"}
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

          <div className="mb-4">
            <label htmlFor="nombre" className={claseEtiqueta}>Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              required
              placeholder="Ej: Uñas Acrílicas"
              value={form.nombre}
              onChange={cambiar}
              className={claseInput}
            />
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoria_id" className={claseEtiqueta}>Categoría</label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={form.categoria_id}
                onChange={cambiar}
                className={claseInput}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="precio" className={claseEtiqueta}>Precio base ($) *</label>
              <input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.precio}
                onChange={cambiar}
                className={claseInput}
              />
            </div>
          </div>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="duracion_min" className={claseEtiqueta}>Duración (minutos)</label>
              <input
                id="duracion_min"
                name="duracion_min"
                type="number"
                min="5"
                max="600"
                step="5"
                required
                value={form.duracion_min}
                onChange={cambiar}
                className={claseInput}
              />
            </div>
            <div className="flex flex-col justify-center gap-2 sm:pt-5">
              <label className={claseCasilla}>
                <input
                  type="checkbox"
                  name="requiere_patch_test"
                  checked={form.requiere_patch_test}
                  onChange={cambiar}
                  className="h-4 w-4 accent-amari-primario"
                />
                Requiere patch test
              </label>
              <label className={claseCasilla}>
                <input
                  type="checkbox"
                  name="precio_desde"
                  checked={form.precio_desde}
                  onChange={cambiar}
                  className="h-4 w-4 accent-amari-primario"
                />
                Precio “desde”
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="descripcion" className={claseEtiqueta}>Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              value={form.descripcion}
              onChange={cambiar}
              className={claseInput}
            />
          </div>

          {editando && (
            <label className={`${claseCasilla} mb-4`}>
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={cambiar}
                className="h-4 w-4 accent-amari-primario"
              />
              Servicio activo (visible para las clientas)
            </label>
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
              {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Crear servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalServicio;