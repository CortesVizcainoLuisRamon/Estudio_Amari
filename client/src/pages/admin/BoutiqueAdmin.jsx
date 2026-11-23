import { useEffect, useState } from "react";
import { Plus, Pencil, ShoppingBag } from "lucide-react";
import { getProductosGestion } from "../../services/productos.service";
import ModalProducto from "../../components/ModalProducto";
import { STOCK_BAJO } from "../../config/boutique";
import { formatearMoneda } from "../../utils/formato";

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

const claseStock = (stock) =>
  stock <= 0
    ? "bg-red-100 text-red-600"
    : stock <= STOCK_BAJO
      ? "bg-amber-100 text-amber-700"
      : "bg-amari-bg-soft text-amari-primario-oscuro";

function BoutiqueAdmin() {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [categoria, setCategoria] = useState(null);
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
  const visibles = categoria ? productos.filter((p) => p.categoria === categoria) : productos;

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
          className="btn-primario"
        >
          <Plus size={18} /> Nuevo producto
        </button>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando productos...</p>}
      {error && <p className="text-center text-red-600">No se pudieron cargar los productos.</p>}

      {!cargando && !error && (
        <>
          {categorias.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button onClick={() => setCategoria(null)} className={chip(categoria === null)}>
                ✨ Todos
              </button>
              {categorias.map((c) => (
                <button key={c} onClick={() => setCategoria(c)} className={chip(categoria === c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {visibles.length === 0 ? (
            <p className="tarjeta p-10 text-center text-sm text-amari-acento">
              Aún no hay productos. Crea el primero con &quot;Nuevo producto&quot;.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibles.map((p) => (
                <article
                  key={p.id}
                  className={`tarjeta min-w-0 overflow-hidden ${p.activo ? "" : "opacity-60"}`}
                >
                  <div className="relative flex h-44 items-center justify-center bg-amari-bg-soft sm:h-48">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <ShoppingBag size={44} className="text-amari-borde" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-amari-primario-oscuro">
                      {p.categoria}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="break-words font-semibold leading-snug text-amari-titulo">
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
                        className="shrink-0 rounded-lg p-1.5 text-amari-acento hover:bg-amari-bg-soft"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>

                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amari-acento">
                      {p.tipo_variante}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {p.variantes.map((v) => (
                        <span
                          key={v.id}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${claseStock(v.stock)}`}
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