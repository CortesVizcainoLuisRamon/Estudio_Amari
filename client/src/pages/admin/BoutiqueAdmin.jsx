import { useEffect, useState } from "react";
import { Plus, Pencil, ShoppingBag, TriangleAlert } from "lucide-react";
import FotoProducto from "../../components/FotoProducto";
import { getProductosGestion } from "../../services/productos.service";
import ModalProducto from "../../components/ModalProducto";
import { STOCK_BAJO } from "../../config/boutique";
import { formatearMoneda } from "../../utils/formato";

const claseStock = (stock) =>
  stock <= 0
    ? "bg-red-100 text-red-600"
    : stock <= STOCK_BAJO
      ? "bg-amber-100 text-amber-700"
      : "bg-amari-bg-soft text-amari-primario-oscuro";

// Un producto activo tiene stock bajo si alguna de sus variantes está al límite o agotada
const conStockBajo = (producto) =>
  producto.activo && producto.variantes.some((v) => v.stock <= STOCK_BAJO);

function BoutiqueAdmin() {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [categoria, setCategoria] = useState(null);
  const [soloBajo, setSoloBajo] = useState(false);
  const [modal, setModal] = useState(null); // { producto }

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getProductosGestion()
      .then((data) => {
        if (activo) setResultado({ clave, data });
      })
      .catch(() => {
        if (activo) setResultado({ clave, error: true });
      });

    return () => {
      activo = false;
    };
  }, [clave]);

  const cargando = resultado?.clave !== clave;
  const error = !cargando && resultado.error;
  const productos = !cargando && !error ? resultado.data : [];

  const recargar = () => setVersion((v) => v + 1);

  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const cantidadBajo = productos.filter(conStockBajo).length;
  const visibles = productos.filter(
    (p) => (!categoria || p.categoria === categoria) && (!soloBajo || conStockBajo(p))
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Boutique</h1>
          <p className="mt-1 text-sm text-amari-acento">
            Productos a la venta: ropa, calzado, accesorios y bolsas
          </p>
        </div>
        <button
          onClick={() => setModal({ producto: null })}
          disabled={cargando || Boolean(error)}
          className="btn-primario px-6"
        >
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando productos...</p>}
      {error && <p className="text-center text-red-600">No se pudieron cargar los productos.</p>}

      {!cargando && !error && (
        <>
          {(categorias.length > 1 || cantidadBajo > 0) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {categorias.length > 1 && (
                <>
                  <button
                    onClick={() => setCategoria(null)}
                    className={`chip ${categoria === null ? "chip-activo" : ""}`}
                  >
                    ✨ Todos
                  </button>
                  {categorias.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoria(c)}
                      className={`chip ${categoria === c ? "chip-activo" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                </>
              )}

              {cantidadBajo > 0 && (
                <button
                  onClick={() => setSoloBajo((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    soloBajo
                      ? "border-transparent bg-amber-500 text-white shadow-md shadow-amber-500/30"
                      : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <TriangleAlert size={14} /> Stock bajo ({cantidadBajo})
                </button>
              )}
            </div>
          )}

          {visibles.length === 0 ? (
            <div className="vacio text-sm">
              <ShoppingBag size={30} className="text-amari-acento" />
              {productos.length === 0
                ? 'Aún no hay productos. Crea el primero con "Nuevo producto".'
                : "No hay productos con ese filtro."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibles.map((p) => (
                <article
                  key={p.id}
                  className={`tarjeta min-w-0 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl ${
                    p.activo ? "" : "opacity-60"
                  }`}
                >
                  <FotoProducto url={p.imagen_url} nombre={p.nombre}>
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amari-primario-oscuro shadow-sm">
                      {p.categoria}
                    </span>
                  </FotoProducto>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="break-words font-bold leading-snug text-amari-titulo">
                        {p.nombre}
                        {!p.activo && (
                          <span className="ml-2 text-xs font-normal text-amari-acento">
                            · Archivado
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => setModal({ producto: p })}
                        aria-label={`Editar ${p.nombre}`}
                        className="shrink-0 rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50"
                      >
                        <Pencil size={17} />
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amari-acento">
                      {p.tipo_variante}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.variantes.map((v) => (
                        <span
                          key={v.id}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claseStock(v.stock)}`}
                        >
                          {v.nombre} · {v.stock}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      <span className="font-display text-2xl font-semibold text-amari-titulo">
                        {formatearMoneda(p.precio)}
                      </span>
                      <span className="text-xs text-amari-acento">
                        {p.stock_total} {p.stock_total === 1 ? "pieza" : "piezas"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {modal && (
        <ModalProducto
          producto={modal.producto}
          onCerrar={() => setModal(null)}
          onGuardado={() => {
            setModal(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

export default BoutiqueAdmin;