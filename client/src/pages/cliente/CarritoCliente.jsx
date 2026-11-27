import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Receipt, Trash2, ShoppingBag, PartyPopper } from "lucide-react";
import { useCarrito } from "../../hooks/useCarrito";
import { crearPedido } from "../../services/pedidos.service";
import { METODOS_PAGO } from "../../config/pedidos";
import { formatearMoneda } from "../../utils/formato";
import FotoProducto from "../../components/FotoProducto";

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
      <div className="tarjeta mx-auto max-w-lg overflow-hidden text-center">
        <div className="relative h-24 overflow-hidden bg-linear-to-br from-pink-100 via-amari-bg-soft to-amari-borde">
          <div className="absolute -right-12 -top-24 h-52 w-52 rounded-full border border-amari-acento/25" />
          <div className="absolute -left-10 top-6 h-32 w-32 rounded-full border border-amari-acento/25" />
        </div>
        <div className="-mt-10 flex flex-col items-center gap-3 px-6 pb-10">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-amari-primario shadow-lg shadow-amari-primario/20 ring-4 ring-amari-borde">
            <PartyPopper size={36} />
          </span>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">¡Pedido recibido!</h1>
          <p className="text-sm leading-relaxed text-amari-texto">
            Tu pedido <span className="font-semibold">#{pedido.id}</span> por{" "}
            <span className="font-semibold">{formatearMoneda(pedido.total)}</span> quedó registrado.
            Una de nuestras chicas te contactará por WhatsApp para coordinar el pago y la entrega.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link to="/cliente/pedidos" className="btn-primario px-6">
              Ver mis pedidos
            </Link>
            <Link to="/cliente/boutique" className="btn-secundario">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/cliente/boutique"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amari-primario-oscuro hover:underline"
        >
          <ArrowLeft size={16} /> Volver
        </Link>
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Mi carrito</h1>
        <p className="mt-1 text-sm text-amari-acento">
          {cantidad} {cantidad === 1 ? "artículo" : "artículos"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="vacio">
          <ShoppingBag size={36} className="text-amari-acento" />
          <p className="text-amari-texto">Tu carrito está vacío.</p>
          <Link to="/cliente/boutique" className="btn-primario mt-1 px-6">
            Ir a la boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-2">
            {items.map((i) => (
              <article
                key={i.varianteId}
                className="tarjeta flex flex-wrap items-center gap-4 p-4 sm:p-5"
              >
                <FotoProducto
                  url={i.imagen_url}
                  nombre={i.producto}
                  icono={24}
                  className="h-20 w-20 shrink-0 rounded-2xl"
                />

                <div className="min-w-0 flex-1 basis-40">
                  <p className="break-words font-bold text-amari-titulo">{i.producto}</p>
                  <p className="text-xs text-amari-acento">
                    {i.tipo}: {i.variante}
                  </p>
                  <p className="text-sm font-semibold text-amari-primario-oscuro">
                    {formatearMoneda(i.precio)} c/u
                  </p>
                </div>

                <div className="flex items-center rounded-full border border-amari-borde bg-amari-bg-soft p-1">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.varianteId, i.cantidad - 1)}
                    disabled={i.cantidad <= 1}
                    aria-label="Quitar una pieza"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-amari-primario-oscuro transition hover:bg-white disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-amari-titulo">{i.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(i.varianteId, i.cantidad + 1)}
                    disabled={i.cantidad >= i.stock}
                    aria-label="Agregar una pieza"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-amari-primario-oscuro transition hover:bg-white disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="w-24 text-right font-display text-xl font-semibold text-amari-titulo">
                  {formatearMoneda(i.precio * i.cantidad)}
                </p>

                <button
                  type="button"
                  onClick={() => quitar(i.varianteId)}
                  aria-label={`Quitar ${i.producto}`}
                  className="rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}

            <button
              type="button"
              onClick={vaciar}
              className="flex items-center gap-1.5 px-1 text-sm font-medium text-amari-acento transition hover:text-red-600"
            >
              <Trash2 size={14} /> Vaciar carrito
            </button>
          </section>

          <aside className="tarjeta h-fit p-6 lg:sticky lg:top-8">
            <div className="mb-4 flex items-center gap-3.5">
              <span className="icono-tarjeta">
                <Receipt size={20} />
              </span>
              <h2 className="font-display text-xl font-semibold text-amari-titulo">
                Resumen del pedido
              </h2>
            </div>

            <ul className="space-y-1.5 text-sm text-amari-texto">
              {items.map((i) => (
                <li key={i.varianteId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {i.producto} ×{i.cantidad}
                  </span>
                  <span className="shrink-0">{formatearMoneda(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-amari-borde/70 pt-4">
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
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm font-medium text-amari-titulo transition ${
                    metodo === valor
                      ? "border-amari-primario bg-pink-50 ring-4 ring-amari-primario/10"
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

            <p className="mt-4 rounded-2xl bg-amari-bg-soft p-4 text-xs leading-relaxed text-amari-texto">
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
              className="btn-primario mt-4 w-full py-3"
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