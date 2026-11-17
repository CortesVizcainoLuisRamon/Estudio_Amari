import { useEffect, useState } from "react";
import { TrendingUp, Scissors, ShoppingBag, Gift, ReceiptText } from "lucide-react";
import { getVentas } from "../../services/ventas.service";
import Estadistica from "../../components/Estadistica";
import { aTexto, deTexto, sumarDias, inicioSemana, fechaLarga } from "../../utils/fechas";
import { formatearMoneda } from "../../utils/formato";

const PERIODOS = [
  { valor: "hoy", texto: "Hoy" },
  { valor: "semana", texto: "Esta semana" },
  { valor: "mes", texto: "Este mes" },
  { valor: "mes_pasado", texto: "Mes pasado" },
  { valor: "personalizado", texto: "Personalizado" },
];

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

const rangoDe = (periodo, base, personal) => {
  const a = base.getFullYear();
  const m = base.getMonth();

  if (periodo === "hoy") return { desde: aTexto(base), hasta: aTexto(base) };

  if (periodo === "semana") {
    const lunes = inicioSemana(base);
    return { desde: aTexto(lunes), hasta: aTexto(sumarDias(lunes, 6)) };
  }
  if (periodo === "mes") {
    return { desde: aTexto(new Date(a, m, 1)), hasta: aTexto(new Date(a, m + 1, 0)) };
  }
  if (periodo === "mes_pasado") {
    return { desde: aTexto(new Date(a, m - 1, 1)), hasta: aTexto(new Date(a, m, 0)) };
  }
  return personal;
};

const rangoValido = ({ desde, hasta }) =>
  Boolean(desde && hasta && desde <= hasta && (deTexto(hasta) - deTexto(desde)) / 86400000 <= 365);

function VentasAdmin() {
  const [base] = useState(() => new Date());
  const [periodo, setPeriodo] = useState("mes");
  const [personal, setPersonal] = useState(() => ({
    desde: aTexto(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    hasta: aTexto(new Date()),
  }));
  const [resultado, setResultado] = useState(null);

  const rango = rangoDe(periodo, base, personal);
  const valido = rangoValido(rango);
  const clave = `${rango.desde}|${rango.hasta}`;

  useEffect(() => {
    if (!valido) return;
    let activo = true;

    getVentas(rango.desde, rango.hasta)
      .then((data) => {
        if (activo) setResultado({ clave, data });
      })
      .catch(() => {
        if (activo) setResultado({ clave, error: true });
      });

    return () => {
      activo = false;
    };
  }, [valido, rango.desde, rango.hasta, clave]);

  const cargando = valido && resultado?.clave !== clave;
  const error = valido && !cargando && Boolean(resultado?.error);
  const d = valido && !cargando && !error ? resultado.data : null;

  const maxDia = Math.max(1, ...(d?.por_dia.map((x) => x.servicios + x.boutique) ?? [1]));
  const totalComisiones = d?.comisiones.reduce((suma, e) => suma + e.comision, 0) ?? 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Ventas</h1>
        <p className="mt-1 text-sm text-amari-acento">
          {rango.desde && rango.hasta
            ? rango.desde === rango.hasta
              ? fechaLarga(rango.desde)
              : `${fechaLarga(rango.desde)} – ${fechaLarga(rango.hasta)}`
            : "Elige un periodo"}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button key={p.valor} onClick={() => setPeriodo(p.valor)} className={chip(periodo === p.valor)}>
            {p.texto}
          </button>
        ))}
      </div>

      {periodo === "personalizado" && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {[
            ["desde", "Desde"],
            ["hasta", "Hasta"],
          ].map(([campo, etiqueta]) => (
            <div key={campo}>
              <label
                htmlFor={`v-${campo}`}
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario"
              >
                {etiqueta}
              </label>
              <input
                id={`v-${campo}`}
                type="date"
                value={personal[campo]}
                onChange={(e) => setPersonal((x) => ({ ...x, [campo]: e.target.value }))}
                className="rounded-xl border border-amari-borde bg-white px-4 py-2 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
              />
            </div>
          ))}
        </div>
      )}

      {!valido && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Elige un rango válido: la fecha inicial no puede ser posterior a la final y el máximo es de un año.
        </p>
      )}
      {cargando && <p className="text-center text-amari-primario">Calculando ventas...</p>}
      {error && <p className="text-center text-red-600">No se pudieron calcular las ventas.</p>}

      {d && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Estadistica
              icono={TrendingUp}
              titulo="Ingresos totales"
              valor={formatearMoneda(d.resumen.total)}
              detalle="servicios + boutique"
            />
            <Estadistica
              icono={Scissors}
              titulo="Servicios"
              valor={formatearMoneda(d.resumen.servicios)}
              detalle={`${d.resumen.citas} ${d.resumen.citas === 1 ? "cita completada" : "citas completadas"}`}
            />
            <Estadistica
              icono={ShoppingBag}
              titulo="Boutique"
              valor={formatearMoneda(d.resumen.boutique)}
              detalle={`${d.resumen.pedidos} ${d.resumen.pedidos === 1 ? "pedido entregado" : "pedidos entregados"}`}
            />
            <Estadistica
              icono={Gift}
              titulo="Regalado en premios"
              valor={formatearMoneda(d.resumen.descuentos)}
              detalle="tarjeta de fidelidad"
            />
          </div>

          <section className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold text-amari-titulo">
                Ingresos por día
              </h2>
              <div className="flex gap-4 text-xs text-amari-texto">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amari-primario" /> Servicios
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amber-400" /> Boutique
                </span>
              </div>
            </div>

            <div className="tarjeta overflow-x-auto p-5">
              <div style={{ minWidth: `${d.por_dia.length * 12}px` }}>
                <div className="flex h-40 items-end gap-1 border-b border-amari-borde">
                  {d.por_dia.map((x) => (
                    <div
                      key={x.dia}
                      title={`${fechaLarga(x.dia)}: ${formatearMoneda(x.servicios + x.boutique)}`}
                      className="flex h-full min-w-2 flex-1 flex-col justify-end"
                    >
                      <div
                        className="bg-amber-400"
                        style={{ height: `${(x.boutique / maxDia) * 100}%` }}
                      />
                      <div
                        className="rounded-t bg-amari-primario"
                        style={{ height: `${(x.servicios / maxDia) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>

                {d.por_dia.length <= 31 && (
                  <div className="mt-1 flex gap-1">
                    {d.por_dia.map((x) => (
                      <p
                        key={x.dia}
                        className="min-w-2 flex-1 text-center text-[10px] text-amari-acento"
                      >
                        {Number(x.dia.slice(8))}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Servicios más pedidos
              </h2>
              <div className="tarjeta space-y-3 p-5">
                {d.servicios_top.length === 0 ? (
                  <p className="text-sm text-amari-texto">Sin citas completadas en este periodo.</p>
                ) : (
                  d.servicios_top.map((s) => (
                    <div key={s.nombre} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-amari-titulo">
                        {s.nombre}
                      </span>
                      <span className="shrink-0 text-amari-acento">
                        {s.veces}x · {formatearMoneda(s.valor)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
                Productos más vendidos
              </h2>
              <div className="tarjeta space-y-3 p-5">
                {d.productos_top.length === 0 ? (
                  <p className="text-sm text-amari-texto">Sin pedidos entregados en este periodo.</p>
                ) : (
                  d.productos_top.map((x) => (
                    <div key={x.nombre} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-amari-titulo">
                        {x.nombre}
                      </span>
                      <span className="shrink-0 text-amari-acento">
                        {x.piezas} pz · {formatearMoneda(x.valor)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="mb-6">
            <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
              Comisiones por especialista
            </h2>
            <div className="tarjeta divide-y divide-amari-borde">
              {d.comisiones.length === 0 ? (
                <p className="p-5 text-sm text-amari-texto">No hay especialistas registradas.</p>
              ) : (
                d.comisiones.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="min-w-0 flex-1 basis-40">
                      <span className="block truncate font-semibold text-amari-titulo">{e.nombre}</span>
                      <span className="block text-xs text-amari-acento">
                        {e.citas} {e.citas === 1 ? "cita" : "citas"} · {formatearMoneda(e.ingresos)} cobrados ·{" "}
                        {e.comision_pct}%
                      </span>
                    </span>
                    <span className="font-display text-lg font-semibold text-amari-titulo">
                      {formatearMoneda(e.comision)}
                    </span>
                  </div>
                ))
              )}
              {d.comisiones.length > 0 && (
                <div className="flex justify-between bg-amari-bg-soft p-4 text-sm font-semibold text-amari-titulo">
                  <span>Total de comisiones</span>
                  <span className="font-display text-lg">{formatearMoneda(totalComisiones)}</span>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-amari-titulo">
              Movimientos
            </h2>

            {d.movimientos.length === 0 ? (
              <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
                <ReceiptText size={36} className="text-amari-acento" />
                <p className="text-amari-texto">No hay ventas en este periodo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {d.movimientos.map((mv) => {
                  const Icono = mv.tipo === "servicio" ? Scissors : ShoppingBag;

                  return (
                    <article
                      key={mv.referencia}
                      className="tarjeta flex items-center gap-3 p-3 text-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amari-bg-soft text-amari-primario">
                        <Icono size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-amari-titulo">
                          {mv.cliente} · {mv.referencia}
                        </span>
                        <span className="block truncate text-xs text-amari-acento">
                          {mv.fecha} · {mv.concepto}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-base font-semibold text-amari-titulo">
                          {formatearMoneda(mv.total)}
                        </span>
                        {mv.descuento > 0 && (
                          <span className="block text-[11px] font-semibold text-green-700">
                            Premio −{formatearMoneda(mv.descuento)}
                          </span>
                        )}
                      </span>
                    </article>
                  );
                })}
                {d.movimientos.length === 100 && (
                  <p className="text-center text-xs text-amari-acento">
                    Se muestran los 100 movimientos más recientes del periodo.
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default VentasAdmin;