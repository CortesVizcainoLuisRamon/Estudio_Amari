import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { ESTADOS_INSUMO, formatearCantidad } from "../config/inventario";

function AlertasInventario({ alertas, to }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
        Alertas de inventario
      </h2>

      <div className="tarjeta p-5">
        {alertas.total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-amari-texto">
            <CircleCheck size={28} className="text-green-500" />
            Todo el inventario está bien
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {alertas.items.map((i) => {
                const estado = ESTADOS_INSUMO[i.estado];

                return (
                  <li key={i.nombre} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-amari-titulo">
                        {i.nombre}
                      </span>
                      <span className="block text-xs text-amari-acento">
                        {formatearCantidad(i.stock)} {i.unidad} · mín. {formatearCantidad(i.stock_minimo)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${estado.clase}`}
                    >
                      {estado.texto}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Link
              to={to}
              className="mt-4 block text-center text-sm font-semibold text-amari-primario hover:underline"
            >
              Ver {alertas.total === 1 ? "la alerta" : `las ${alertas.total} alertas`} →
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default AlertasInventario;