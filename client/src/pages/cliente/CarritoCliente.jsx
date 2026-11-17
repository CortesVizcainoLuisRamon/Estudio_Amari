import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, PartyPopper } from "lucide-react";
import { useCarrito } from "../../hooks/useCarrito";
import { crearPedido } from "../../services/pedidos.service";
import { METODOS_PAGO } from "../../config/pedidos";
import { formatearMoneda } from "../../utils/formato";

function CarritoCliente() {
  const { items, cantidad, total, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [metodo, setMetodo] = useState("transferencia");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [pedido, setPedido] = useState(null);

  const confirmar = async () => {
    setError("");
    setEnviando(true);

    try {
      const creado = await crearPedido({
        metodo_pago: metodo,
        items: items.map((i) => ({ variante_id: i.varianteId, cantidad: i.cantidad })),
      });
      vaciar();
      setPedido(creado);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo confirmar el pedido");
      setEnviando(false);
    }
  };

  if (pedido) {
    return (
      <div className="tarjeta mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center">
        <PartyPopper size={40} className="text-amari-primario" />
        <h1 className="font-display text-2xl font-semibold text-amari-titulo">
          ¡Pedido recibido!
        </h1>
        <p className="text-sm text-amari-texto">
          Tu pedido <span className="font-semibold">#{pedido.id}</span> por{" "}
          <span className="font-semibold">{formatearMoneda(pedido.total)}</span> quedó registrado.
          Una de nuestras chicas te contactará por WhatsApp para coordinar el pago y la entrega.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link to="/cliente/pedidos" className="btn-primario">
            Ver mis pedidos
          </Link>
          <Link
            to="/cliente/boutique"
            className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/cliente/boutique"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-amari-primario hover:underline"
        >
          <ArrowLeft size={16} /> Volver
        </Link>
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Mi carrito</h1>
        <p className="mt-1 text-sm text-amari-acento">
          {cantidad} {cantidad === 1 ? "artículo" : "artículos"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
          <ShoppingBag size={36} className="text-amari-acento" />
          <p className="text-amari-texto">Tu carrito está vacío.</p>
          <Link to="/cliente/boutique" className="btn-primario">
            Ir a la boutique
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
            {items.map((i) => (
              <article key={i.varianteId} className="tarjeta flex flex-wrap items-center gap-4 p-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amari-bg-soft">
                  {i.imagen_url ? (
                    <img
                      src={i.imagen_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <ShoppingBag size={22} className="text-amari-borde" />
                </div>

                <div className="min-w-0 flex-1 basis-40">
                  <p className="break-words font-semibold text-amari-titulo">{i.producto}</p>
                  <p className="text-xs text-amari-acento">
                    {i.tipo}: {i.variante}
                  </p>
                  <p className="text-sm font-semibold text-amari-primario-oscuro">
                    {formatearMoneda(i.precio)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.varianteId, i.cantidad - 1)}
                    disabled={i.cantidad <= 1}
                    aria-label="Quitar una pieza"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-amari-borde text-amari-primario hover:bg-amari-bg-soft disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{i.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.varianteId, i.cantidad + 1)}
                    disabled={i.cantidad >= i.stock}
                    aria-label="Agregar una pieza"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-amari-borde text-amari-primario hover:bg-amari-bg-soft disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="w-24 text-right font-display text-lg font-semibold text-amari-titulo">
                  {formatearMoneda(i.precio * i.cantidad)}
                </p>

                <button
                  type="button"
                  onClick={() => quitar(i.varianteId)}
                  aria-label={`Quitar ${i.producto}`}
                  className="rounded-lg p-2 text-amari-acento hover:bg-amari-bg-soft"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}

            <button
              type="button"
              onClick={vaciar}
              className="flex items-center gap-1.5 text-sm text-amari-acento hover:text-red-600"
            >
              <Trash2 size={14} /> Vaciar carrito
            </button>
          </section>

          <aside className="tarjeta h-fit p-5">
            <h2 className="mb-3 font-display text-lg font-semibold text-amari-titulo">
              Resumen del pedido
            </h2>

            <ul className="space-y-1 text-sm text-amari-texto">
              {items.map((i) => (
                <li key={i.varianteId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {i.producto} ×{i.cantidad}
                  </span>
                  <span className="shrink-0">{formatearMoneda(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-amari-borde pt-3">
              <span className="font-semibold text-amari-titulo">Total</span>
              <span className="font-display text-2xl font-semibold text-amari-titulo">
                {formatearMoneda(total)}
              </span>
            </div>

            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-amari-primario">
              Método de pago preferido
            </p>
            <div className="space-y-2">
              {Object.entries(METODOS_PAGO).map(([valor, texto]) => (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                    metodo === valor
                      ? "border-amari-primario bg-amari-bg-soft"
                      : "border-amari-borde hover:bg-amari-bg-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo"
                    checked={metodo === valor}
                    onChange={() => setMetodo(valor)}
                    className="accent-amari-primario"
                  />
                  {texto}
                </label>
              ))}
            </div>

            <p className="mt-4 rounded-xl bg-amari-bg-soft p-3 text-xs text-amari-texto">
              Al confirmar tu pedido, una de nuestras chicas te contactará por{" "}
              <span className="font-semibold">WhatsApp</span> para coordinar el pago y la entrega
              o recogida en tienda.
            </p>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              className="btn-primario mt-4 w-full"
            >
              {enviando ? "Confirmando..." : "Confirmar pedido"}
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

export default CarritoCliente;