import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import Campo from "./Campo";
import { crearInsumo, actualizarInsumo } from "../services/inventario.service";
import { UNIDADES, CATEGORIAS_INSUMO } from "../config/inventario";

const claseSelect =
  "w-full rounded-xl border border-amari-borde bg-white px-4 py-2.5 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20";
const claseEtiqueta = "mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario";

function ModalInsumo({ insumo, onCerrar, onGuardado }) {
  const editando = Boolean(insumo);

  const [form, setForm] = useState({
    nombre: insumo?.nombre ?? "",
    categoria: insumo?.categoria ?? CATEGORIAS_INSUMO[0],
    unidad: insumo?.unidad ?? "unidad",
    costo: insumo?.costo ?? 0,
    stock: 0,
    stock_minimo: insumo?.stock_minimo ?? 0,
    activo: insumo?.activo ?? true,
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

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const categorias = [...new Set([...CATEGORIAS_INSUMO, form.categoria])];

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const guardado = editando
        ? await actualizarInsumo(insumo.id, form)
        : await crearInsumo(form);
      onGuardado(guardado);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el insumo");
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            {editando ? "Editar Insumo" : "Nuevo Insumo"}
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

        <form onSubmit={enviar} className="space-y-4 px-6 py-5">
          <Campo
            id="nombre"
            etiqueta="Nombre del insumo *"
            placeholder="Ej: Gel UV Clear"
            maxLength={120}
            required
            value={form.nombre}
            onChange={cambiar("nombre")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categoria" className={claseEtiqueta}>
                Categoría
              </label>
              <select
                id="categoria"
                value={form.categoria}
                onChange={cambiar("categoria")}
                className={claseSelect}
              >
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="unidad" className={claseEtiqueta}>
                Unidad de medida
              </label>
              <select
                id="unidad"
                value={form.unidad}
                onChange={cambiar("unidad")}
                className={claseSelect}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              id="costo"
              type="number"
              etiqueta="Precio de costo ($)"
              min="0"
              step="0.01"
              value={form.costo}
              onChange={cambiar("costo")}
            />
            <Campo
              id="stock_minimo"
              type="number"
              etiqueta="Stock mínimo (alerta)"
              min="0"
              step="0.01"
              value={form.stock_minimo}
              onChange={cambiar("stock_minimo")}
            />
          </div>

          {!editando && (
            <Campo
              id="stock"
              type="number"
              etiqueta="Stock inicial"
              min="0"
              step="0.01"
              value={form.stock}
              onChange={cambiar("stock")}
            />
          )}

          {editando && (
            <label className="flex items-center gap-3 text-sm text-amari-titulo">
              <input
                type="checkbox"
                checked={!form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: !e.target.checked }))}
                className="h-4 w-4 accent-amari-primario"
              />
              Archivar este insumo (deja de aparecer en el inventario)
            </label>
          )}

          {editando && (
            <p className="text-xs text-amari-acento">
              Para cambiar la cantidad en existencia usa los botones Entrada, Salida o Ajustar.
            </p>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft disabled:opacity-60"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primario">
              {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Crear insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalInsumo;