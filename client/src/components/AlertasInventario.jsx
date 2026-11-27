import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import { ESTADOS_INSUMO, formatearCantidad } from "../config/inventario";

// Insumos agotados o con poco stock. `alertas` = { total, items: [{ nombre, unidad, stock, stock_minimo, estado }] }
function AlertasInventario({ alertas, to }) {
  const sinAlertas = alertas.total === 0;

  return (
    <section className="tarjeta p-6">
      <div className="mb-4 flex items-center gap-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            sinAlertas ? "bg-green-50 text-green-600" : "bg-amber-100 text-amber-700"
          }`}
        >
          {sinAlertas ? <CircleCheck size={20} /> : <TriangleAlert size={20} />}
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight text-amari-titulo sm:text-2xl">
            Alertas de inventario
          </h2>
          {!sinAlertas && (
            <p className="text-sm">
              {alertas.total === 1 ? "1 insumo necesita atención" : `${alertas.total} insumos necesitan atención`}
            </p>
          )}
        </div>
      </div>

      {sinAlertas ? (
        <p className="rounded-2xl bg-green-50 px-4 py-4 text-center text-sm font-semibold text-green-700">
          Todo el inventario está bien
        </p>
      ) : (
        <>
          <ul className="divide-y divide-amari-borde/60">
            {alertas.items.map((i) => {
              const estado = ESTADOS_INSUMO[i.estado];

              return (
                <li key={i.nombre} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-amari-titulo">{i.nombre}</span>
                    <span className="block text-xs text-amari-acento">
                      {formatearCantidad(i.stock)} {i.unidad} · mín. {formatearCantidad(i.stock_minimo)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${estado.clase}`}
                  >
                    {estado.texto}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            to={to}
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amari-primario-oscuro hover:underline"
          >
            Ver {alertas.total === 1 ? "la alerta" : `las ${alertas.total} alertas`} <ArrowRight size={15} />
          </Link>
        </>
      )}
    </section>
  );
}

export default AlertasInventario;
