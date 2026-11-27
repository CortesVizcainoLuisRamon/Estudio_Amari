import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Check, Search } from "lucide-react";
import FotoProducto from "../../components/FotoProducto";
import { getCatalogo } from "../../services/productos.service";
import { useCarrito } from "../../hooks/useCarrito";
import { STOCK_BAJO } from "../../config/boutique";
import { formatearMoneda, normalizarTexto as normalizar } from "../../utils/formato";

const estaAgotado = (producto) => producto.variantes.every((v) => v.stock <= 0);

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
    <article className="tarjeta flex min-w-0 flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
      <FotoProducto url={producto.imagen_url} nombre={producto.nombre} atenuada={agotado}>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amari-primario-oscuro shadow-sm">
          {producto.categoria}
        </span>
        {agotado && (
          <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
            Agotado
          </span>
        )}
      </FotoProducto>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="break-words font-bold leading-snug text-amari-titulo">
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
                  ? "border-transparent bg-amari-primario text-white shadow-md shadow-amari-primario/30"
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
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("catalogo");

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
  const texto = normalizar(busqueda);

  // Los agotados siempre van al final; dentro de cada grupo se aplica el orden elegido
  const visibles = productos
    .filter(
      (p) =>
        (!categoria || p.categoria === categoria) &&
        normalizar(`${p.nombre} ${p.descripcion} ${p.categoria}`).includes(texto)
    )
    .sort((a, b) => {
      const porAgotado = Number(estaAgotado(a)) - Number(estaAgotado(b));
      if (porAgotado !== 0) return porAgotado;
      if (orden === "menor") return a.precio - b.precio;
      if (orden === "mayor") return b.precio - a.precio;
      return 0;
    });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Boutique</h1>
          <p className="mt-1 text-sm text-amari-acento">Ropa, tenis y accesorios disponibles</p>
        </div>

        <Link to="/cliente/carrito" className="btn-primario relative px-6">
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
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-0 flex-1 basis-60">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-amari-acento"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en la boutique..."
                aria-label="Buscar productos"
                className="entrada rounded-full pl-11 shadow-sm"
              />
            </div>

            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              aria-label="Ordenar productos"
              className="entrada w-auto rounded-full pr-8 shadow-sm"
            >
              <option value="catalogo">Orden del catálogo</option>
              <option value="menor">Precio: menor a mayor</option>
              <option value="mayor">Precio: mayor a menor</option>
            </select>
          </div>

          {categorias.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
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
            </div>
          )}

          {visibles.length === 0 ? (
            <div className="vacio text-sm">
              <ShoppingBag size={30} className="text-amari-acento" />
              {productos.length === 0
                ? "Por ahora no hay productos disponibles."
                : "No se encontraron productos con esa búsqueda."}
            </div>
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