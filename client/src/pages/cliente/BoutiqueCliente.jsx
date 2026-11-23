import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Check } from "lucide-react";
import { getCatalogo } from "../../services/productos.service";
import { useCarrito } from "../../hooks/useCarrito";
import { STOCK_BAJO } from "../../config/boutique";
import { formatearMoneda } from "../../utils/formato";

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

function TarjetaProducto({ producto }) {
  const { agregar } = useCarrito();
  const disponibles = producto.variantes.filter((v) => v.stock > 0);
  const [eleccion, setEleccion] = useState(disponibles[0]?.id ?? null);
  const [agregado, setAgregado] = useState(false);

  const variante = producto.variantes.find((v) => v.id === eleccion);
  const agotado = disponibles.length === 0;

  const alAgregar = () => {
    agregar(producto, variante, 1);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <article className="tarjeta flex min-w-0 flex-col overflow-hidden">
            <div className="relative flex h-44 items-center justify-center bg-amari-bg-soft sm:h-48">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        <ShoppingBag size={44} className="text-amari-borde" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-amari-primario-oscuro">
          {producto.categoria}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="break-words font-semibold leading-snug text-amari-titulo">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="mt-1 text-xs text-amari-texto">{producto.descripcion}</p>
        )}

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amari-acento">
          {producto.tipo_variante}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {producto.variantes.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock <= 0}
              onClick={() => setEleccion(v.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                v.id === eleccion
                  ? "border-transparent bg-amari-primario text-white"
                  : v.stock <= 0
                    ? "border-amari-borde text-amari-borde line-through"
                    : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
              }`}
            >
              {v.nombre}
            </button>
          ))}
        </div>

        {variante && variante.stock <= STOCK_BAJO && (
          <p className="mt-2 text-xs font-semibold text-amber-600">
            {variante.stock === 1 ? "¡Solo queda 1!" : `¡Solo quedan ${variante.stock}!`}
          </p>
        )}

        <p className="mt-auto pt-4 font-display text-2xl font-semibold text-amari-titulo">
          {formatearMoneda(producto.precio)}
        </p>

        <button
          type="button"
          onClick={alAgregar}
          disabled={agotado || !variante}
          className="btn-primario mt-3 w-full"
        >
          {agotado ? (
            "Agotado"
          ) : agregado ? (
            <>
              <Check size={18} /> Agregado
            </>
          ) : (
            <>
              <ShoppingCart size={18} /> Agregar al carrito
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function BoutiqueCliente() {
  const { cantidad } = useCarrito();
  const [resultado, setResultado] = useState(null);
  const [categoria, setCategoria] = useState(null);

  useEffect(() => {
    let activo = true;

    getCatalogo()
      .then((data) => {
        if (activo) setResultado({ data });
      })
      .catch(() => {
        if (activo) setResultado({ error: true });
      });

    return () => {
      activo = false;
    };
  }, []);

  const cargando = resultado === null;
  const error = Boolean(resultado?.error);
  const productos = resultado?.data ?? [];

  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const visibles = categoria ? productos.filter((p) => p.categoria === categoria) : productos;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Boutique</h1>
          <p className="mt-1 text-sm text-amari-acento">Ropa, tenis y accesorios disponibles</p>
        </div>

        <Link to="/cliente/carrito" className="btn-primario relative">
          <ShoppingCart size={18} /> Mi carrito
          {cantidad > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-amari-primario shadow ring-1 ring-amari-primario/30">
              {cantidad}
            </span>
          )}
        </Link>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando productos...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar la boutique.</p>}

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
              Por ahora no hay productos disponibles.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibles.map((p) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default BoutiqueCliente;