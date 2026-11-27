import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { getMisPedidos, cancelarMiPedido } from "../../services/pedidos.service";
import { ESTADOS_PEDIDO, METODOS_PAGO } from "../../config/pedidos";
import { fechaLarga } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";

function TarjetaPedido({ pedido, onCambio }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const estado = ESTADOS_PEDIDO[pedido.estado];

  const cancelar = async () => {
    setError("");
    setEnviando(true);

    try {
      await cancelarMiPedido(pedido.id);
      onCambio();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cancelar el pedido");
      setEnviando(false);
      setConfirmando(false);
    }
  };

  return (
    <article className="tarjeta p-5 text-sm text-amari-titulo sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">Pedido #{pedido.id}</p>
          <p className="text-xs text-amari-acento">
            {fechaLarga(pedido.creado_en.slice(0, 10))} · {pedido.creado_en.slice(11)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5 rounded-2xl border border-amari-borde/70 bg-amari-bg-soft/60 p-4">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amari-borde/70 pt-4">
        <div>
          <p className="font-display text-lg font-semibold">
            Total: {formatearMoneda(pedido.total)}
          </p>
          <p className="text-xs text-amari-acento">{METODOS_PAGO[pedido.metodo_pago]}</p>
        </div>

        {pedido.estado === "pendiente" && !confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="btn-peligro py-2 text-xs"
          >
            Cancelar pedido
          </button>
        )}

        {confirmando && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amari-acento">¿Seguro?</span>
            <button
              type="button"
              disabled={enviando}
              onClick={cancelar}
              className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {enviando ? "Cancelando..." : "Sí, cancelar"}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setConfirmando(false)}
              className="btn-secundario px-4 py-2 text-xs"
            >
              No
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-red-600">{error}</p>}
    </article>
  );
}

function MisPedidos() {
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getMisPedidos()
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
  const pedidos = !cargando && !error ? resultado.data : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Mis pedidos</h1>
        <p className="mt-1 text-sm text-amari-acento">Compras que hiciste en la boutique</p>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando tus pedidos...</p>}
      {error && <p className="text-center text-red-600">No se pudieron cargar tus pedidos.</p>}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="vacio">
          <PackageOpen size={36} className="text-amari-acento" />
          <p className="text-amari-texto">Aún no has hecho ningún pedido.</p>
          <Link to="/cliente/boutique" className="btn-primario mt-1 px-6">
            Ir a la boutique
          </Link>
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

export default MisPedidos;