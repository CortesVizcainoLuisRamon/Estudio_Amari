import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  Package,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getInsumos } from "../../services/inventario.service";
import ModalInsumo from "../../components/ModalInsumo";
import ModalMovimiento from "../../components/ModalMovimiento";
import { ESTADOS_INSUMO, formatearCantidad } from "../../config/inventario";
import { useSearchParams } from "react-router-dom";

const botonAccion =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-amari-primario-oscuro transition hover:bg-pink-50";

const porcentajeBarra = (i) => {
  if (i.stock <= 0) return 0;
  if (i.stock_minimo <= 0) return 100;
  return Math.min(100, Math.max(4, (i.stock / (i.stock_minimo * 3)) * 100));
};

function InventarioAdmin() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "admin";

  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [params] = useSearchParams();
  const [soloAlertas, setSoloAlertas] = useState(params.get("filtro") === "alertas");
  const [categoria, setCategoria] = useState(null);
  const [modalInsumo, setModalInsumo] = useState(null); // { insumo }
  const [movimiento, setMovimiento] = useState(null); // { insumo, tipo }

  const clave = String(version);

  useEffect(() => {
    let activo = true;

    getInsumos()
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
  const insumos = !cargando && !error ? resultado.data : [];

  const recargar = () => setVersion((v) => v + 1);

  const alertas = insumos.filter((i) => i.estado !== "ok").length;
  const categorias = [...new Set(insumos.map((i) => i.categoria))];

  const visibles = insumos
    .filter((i) => !soloAlertas || i.estado !== "ok")
    .filter((i) => !categoria || i.categoria === categoria);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Inventario de Insumos
          </h1>
          <p className="mt-1 text-sm text-amari-acento">Control de stock de productos de belleza</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSoloAlertas((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition ${
              soloAlertas
                ? "border-transparent bg-amber-500 text-white shadow-md shadow-amber-500/30"
                : "border-pink-200 bg-white text-amari-primario-oscuro hover:bg-pink-50"
            }`}
          >
            <TriangleAlert size={16} /> Solo alertas{alertas > 0 && ` (${alertas})`}
          </button>

          {esAdmin && (
            <button onClick={() => setModalInsumo({ insumo: null })} className="btn-primario px-6">
              <Plus size={18} /> Nuevo insumo
            </button>
          )}
        </div>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando inventario...</p>}
      {error && <p className="text-center text-red-600">No se pudo cargar el inventario.</p>}

      {!cargando && !error && (
        <>
          {categorias.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setCategoria(null)}
                className={`chip ${categoria === null ? "chip-activo" : ""}`}
              >
                Todos
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
              <Package size={30} className="text-amari-acento" />
              {soloAlertas
                ? "No hay alertas de inventario. ¡Todo está en orden!"
                : "Aún no hay insumos registrados."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((i) => {
                const estado = ESTADOS_INSUMO[i.estado];

                return (
                  <article key={i.id} className="tarjeta min-w-0 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold leading-snug text-amari-titulo">
                          {i.nombre}
                        </h3>
                        <p className="text-xs text-amari-acento">{i.categoria}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {estado.texto && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        )}
                        {esAdmin && (
                          <button
                            onClick={() => setModalInsumo({ insumo: i })}
                            aria-label={`Editar ${i.nombre}`}
                            className="rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50"
                          >
                            <Pencil size={17} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 font-display text-4xl font-semibold text-amari-titulo">
                      {formatearCantidad(i.stock)}
                    </p>
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs text-amari-acento">
                      <span>{i.unidad} disponibles</span>
                      <span>mín. {formatearCantidad(i.stock_minimo)}</span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-amari-bg-soft">
                      <div
                        className={`h-full rounded-full ${estado.barra}`}
                        style={{ width: `${porcentajeBarra(i)}%` }}
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setMovimiento({ insumo: i, tipo: "entrada" })}
                        className={botonAccion}
                      >
                        <ArrowDown size={14} /> Entrada
                      </button>
                      <button
                        onClick={() => setMovimiento({ insumo: i, tipo: "salida" })}
                        className={botonAccion}
                      >
                        <ArrowUp size={14} /> Salida
                      </button>
                      {esAdmin && (
                        <button
                          onClick={() => setMovimiento({ insumo: i, tipo: "ajuste" })}
                          aria-label={`Ajustar stock de ${i.nombre}`}
                          className="flex shrink-0 items-center justify-center rounded-full border-2 border-pink-200 bg-white px-3.5 py-2 text-amari-primario-oscuro transition hover:bg-pink-50"
                        >
                          <SlidersHorizontal size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {modalInsumo && (
        <ModalInsumo
          insumo={modalInsumo.insumo}
          onCerrar={() => setModalInsumo(null)}
          onGuardado={() => {
            setModalInsumo(null);
            recargar();
          }}
        />
      )}

      {movimiento && (
        <ModalMovimiento
          insumo={movimiento.insumo}
          tipo={movimiento.tipo}
          onCerrar={() => setMovimiento(null)}
          onGuardado={() => {
            setMovimiento(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

export default InventarioAdmin;