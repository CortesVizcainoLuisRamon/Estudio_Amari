import { useEffect, useState } from "react";
import { X, Flower2, Plus, Trash2 } from "lucide-react";
import Campo from "./Campo";
import SelectorFoto from "./SelectorFoto";
import { crearProducto, actualizarProducto } from "../services/productos.service";
import { subirImagenProducto } from "../services/imagenes.service";
import { CATEGORIAS_PRODUCTO, TIPOS_VARIANTE } from "../config/boutique";

const claseSelect = "entrada";
const claseEtiqueta = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-amari-primario";
const claseEntrada =
  "entrada w-auto px-3 py-2";

function ModalProducto({ producto, onCerrar, onGuardado }) {
  const editando = Boolean(producto);

  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    categoria: producto?.categoria ?? CATEGORIAS_PRODUCTO[0],
    precio: producto?.precio ?? "",
    imagen_url: producto?.imagen_url ?? "",
    tipo_variante: producto?.tipo_variante ?? "Color",
    activo: producto?.activo ?? true,
  });
  const [variantes, setVariantes] = useState(
    producto?.variantes.map((v) => ({ id: v.id, nombre: v.nombre, stock: v.stock })) ?? [
      { id: null, nombre: "Único", stock: 0 },
    ]
  );
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const cambiarVariante = (indice, campo, valor) =>
    setVariantes((lista) => lista.map((v, i) => (i === indice ? { ...v, [campo]: valor } : v)));

  const agregarVariante = () =>
    setVariantes((lista) => [...lista, { id: null, nombre: "", stock: 0 }]);

  const quitarVariante = (indice) =>
    setVariantes((lista) => lista.filter((_, i) => i !== indice));

  const categorias = [...new Set([...CATEGORIAS_PRODUCTO, form.categoria])];

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const datos = { ...form, variantes };
      const guardado = editando
        ? await actualizarProducto(producto.id, datos)
        : await crearProducto(datos);
      onGuardado(guardado);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el producto");
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-3 font-display text-xl font-semibold text-amari-titulo">
            <span className="icono-tarjeta h-9 w-9">
              <Flower2 size={18} />
            </span>
            {editando ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-amari-acento transition hover:bg-pink-50 hover:text-amari-primario-oscuro"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4 px-6 py-5">
          <Campo
            id="nombre"
            etiqueta="Nombre del producto *"
            placeholder="Ej: Bolsa de mano"
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

            <Campo
              id="precio"
              type="number"
              etiqueta="Precio ($) *"
              min="0"
              step="0.01"
              required
              value={form.precio}
              onChange={cambiar("precio")}
            />
          </div>

          <div>
            <span className={claseEtiqueta}>Foto del producto</span>
            <SelectorFoto
              url={form.imagen_url}
              onOcupado={setSubiendoFoto}
              alSubir={async (archivo) => {
                const url = await subirImagenProducto(archivo);
                setForm((f) => ({ ...f, imagen_url: url }));
              }}
              alQuitar={async () => setForm((f) => ({ ...f, imagen_url: "" }))}
            />
          </div>

          <div>
            <label htmlFor="descripcion" className={claseEtiqueta}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows={2}
              maxLength={500}
              value={form.descripcion}
              onChange={cambiar("descripcion")}
              className={claseSelect}
            />
          </div>

          <div className="rounded-2xl border border-amari-borde p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <label htmlFor="tipo_variante" className={claseEtiqueta}>
                  El producto varía por
                </label>
                <select
                  id="tipo_variante"
                  value={form.tipo_variante}
                  onChange={cambiar("tipo_variante")}
                  className={`${claseSelect} !w-auto`}
                >
                  {TIPOS_VARIANTE.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-amari-acento">Cada una con su propio stock</p>
            </div>

            <div className="space-y-2">
              {variantes.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    aria-label={`${form.tipo_variante} ${i + 1}`}
                    placeholder={`${form.tipo_variante}: ej. Rojo`}
                    maxLength={60}
                    value={v.nombre}
                    onChange={(e) => cambiarVariante(i, "nombre", e.target.value)}
                    className={`${claseEntrada} min-w-0 flex-1`}
                  />
                  <input
                    type="number"
                    aria-label={`Stock de ${v.nombre || `variante ${i + 1}`}`}
                    min="0"
                    max="9999"
                    step="1"
                    value={v.stock}
                    onChange={(e) => cambiarVariante(i, "stock", e.target.value)}
                    className={`${claseEntrada} w-24 shrink-0`}
                  />
                  <button
                    type="button"
                    onClick={() => quitarVariante(i)}
                    disabled={variantes.length === 1}
                    aria-label="Quitar variante"
                    className="shrink-0 rounded-lg p-2 text-amari-acento hover:bg-amari-bg-soft disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarVariante}
              className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-amari-primario hover:underline"
            >
              <Plus size={16} /> Agregar {form.tipo_variante.toLowerCase()}
            </button>
          </div>

          {editando && (
            <label className="flex items-center gap-3 text-sm text-amari-titulo">
              <input
                type="checkbox"
                checked={!form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: !e.target.checked }))}
                className="h-4 w-4 accent-amari-primario"
              />
              Archivar este producto (deja de mostrarse en la boutique)
            </label>
          )}

          {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="btn-secundario"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando || subiendoFoto} className="btn-primario">
              {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalProducto;