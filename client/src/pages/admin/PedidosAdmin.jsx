import { useEffect, useState } from "react";
import { MessageCircle, PackageOpen } from "lucide-react";
import { getPedidos, cambiarEstadoPedido } from "../../services/pedidos.service";
import { ESTADOS_PEDIDO, METODOS_PAGO, enlaceWhatsApp } from "../../config/pedidos";
import { fechaLarga } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";

const PESTANAS = [
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "confirmado", texto: "Confirmados" },
  { valor: "entregado", texto: "Entregados" },
  { valor: "cancelado", texto: "Cancelados" },
  { valor: "", texto: "Todos" },
];

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

function TarjetaPedido({ pedido, onCambio }) {
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const estado = ESTADOS_PEDIDO[pedido.estado];
  const nombre = pedido.cliente.split(" ")[0];

  const mensaje = `Hola ${nombre} 🌸 Recibimos tu pedido #${pedido.id} en Estudio Amari por ${formatearMoneda(
    pedido.total
  )}. Para coordinar el pago (${METODOS_PAGO[pedido.metodo_pago]}) y la entrega o recogida en tienda, ¿qué día y horario te acomoda? ¡Gracias por tu compra! 💕`;
  const enlace = enlaceWhatsApp(pedido.telefono, mensaje);

  const mover = async (nuevo) => {
    setError("");
    setEnviando(true);

    try {
      await cambiarEstadoPedido(pedido.id, nuevo);
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo actualizar el pedido");
      setEnviando(false);
      setConfirmandoCancelar(false);
    }
  };

  const puedeConfirmar = pedido.estado === "pendiente";
  const puedeEntregar = pedido.estado === "confirmado";
  const puedeCancelar = pedido.estado === "pendiente" || pedido.estado === "confirmado";

  return (
    <article className="tarjeta p-4 text-sm text-amari-titulo">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            Pedido #{pedido.id} · {pedido.cliente}
          </p>
          <p className="text-xs text-amari-acento">
            {fechaLarga(pedido.creado_en.slice(0, 10))} · {pedido.creado_en.slice(11)}
            {pedido.telefono && ` · ${pedido.telefono}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {pedido.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3">
            <span className="min-w-0">
              {i.producto} <span className="text-amari-acento">({i.variante})</span> ×{i.cantidad}
            </span>
            <span className="shrink-0 text-amari-primario-oscuro">
              {formatearMoneda(i.precio * i.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-amari-borde pt-3">
        <div>
          <p className="font-display text-base font-semibold">
            Total: {formatearMoneda(pedido.total)}
          </p>
          <p className="text-xs text-amari-acento">{METODOS_PAGO[pedido.metodo_pago]}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {enlace && (
            <a
              href={enlace}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}

          {puedeConfirmar && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => mover("confirmado")}
              className="rounded-full bg-amari-primario px-4 py-1.5 text-xs font-semibold text-white hover:bg-amari-primario-oscuro disabled:opacity-60"
            >
              Confirmar
            </button>
          )}
          {puedeEntregar && (
            <button
              type="button"
              disabled={enviando}
              onClick={() => mover("entregado")}
              className="rounded-full bg-amari-primario px-4 py-1.5 text-xs font-semibold text-white hover:bg-amari-primario-oscuro disabled:opacity-60"
            >
              Marcar entregado
            </button>
          )}

          {puedeCancelar && !confirmandoCancelar && (
            <button
              type="button"
              onClick={() => setConfirmandoCancelar(true)}
              className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Cancelar
            </button>
          )}
          {confirmandoCancelar && (
            <>
              <span className="text-xs text-amari-acento">¿Cancelar y devolver al stock?</span>
              <button
                type="button"
                disabled={enviando}
                onClick={() => mover("cancelado")}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Sí
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={() => setConfirmandoCancelar(false)}
                className="rounded-full border border-amari-borde px-4 py-1.5 text-xs font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
              >
                No
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}
    </article>
  );
}

function PedidosAdmin() {
  const [estado, setEstado] = useState("pendiente");
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);

  const clave = `${estado}|${version}`;

  useEffect(() => {
    let activo = true;

    getPedidos(estado)
      .then((data) => {
        if (activo) setResultado({ clave, data });
      })
      .catch(() => {
        if (activo) setResultado({ clave, error: true });
      });

    return () => {
      activo = false;
    };
  }, [estado, clave]);

  const cargando = resultado?.clave !== clave;
  const error = !cargando && resultado.error;
  const pedidos = !cargando && !error ? resultado.data : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Pedidos</h1>
        <p className="mt-1 text-sm text-amari-acento">Compras de la boutique hechas por clientas</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PESTANAS.map((p) => (
          <button key={p.valor} onClick={() => setEstado(p.valor)} className={chip(estado === p.valor)}>
            {p.texto}
          </button>
        ))}
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando pedidos...</p>}
      {error && <p className="text-center text-red-600">No se pudieron cargar los pedidos.</p>}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
          <PackageOpen size={36} className="text-amari-acento" />
          <p className="text-amari-texto">No hay pedidos en esta sección.</p>
        </div>
      )}

      {!cargando && !error && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} onCambio={() => setVersion((v) => v + 1)} />
          ))}
        </div>
      )}
    </>
  );
}

export default PedidosAdmin;