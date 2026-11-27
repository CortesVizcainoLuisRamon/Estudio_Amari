import { useEffect, useState } from "react";
import { TrendingUp, Scissors, ShoppingBag, Gift, ReceiptText, BadgePercent } from "lucide-react";
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
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            className={`chip ${periodo === p.valor ? "chip-activo" : ""}`}
          >
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
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-amari-primario"
              >
                {etiqueta}
              </label>
              <input
                id={`v-${campo}`}
                type="date"
                value={personal[campo]}
                onChange={(e) => setPersonal((x) => ({ ...x, [campo]: e.target.value }))}
                className="entrada w-auto"
              />
            </div>
          ))}
        </div>
      )}

      {!valido && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Elige un rango válido: la fecha inicial no puede ser posterior a la final y el máximo es de un año.
        </p>
      )}
      {cargando && <p className="text-center text-amari-primario">Calculando ventas...</p>}
      {error && <p className="text-center text-red-600">No se pudieron calcular las ventas.</p>}

      {d && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <section className="tarjeta mb-6 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-amari-titulo">
                Ingresos por día
              </h2>
              <div className="flex gap-4 text-xs font-semibold text-amari-texto">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amari-primario" /> Servicios
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-amber-400" /> Boutique
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div style={{ minWidth: `${d.por_dia.length * 12}px` }}>
                <div className="flex h-44 items-end gap-1 border-b border-amari-borde">
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
                        className="rounded-t-md bg-linear-to-t from-amari-primario to-amari-acento"
                        style={{ height: `${(x.servicios / maxDia) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>

                {d.por_dia.length <= 31 && (
                  <div className="mt-1.5 flex gap-1">
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

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="tarjeta p-5 sm:p-6">
              <h2 className="mb-4 font-display text-2xl font-semibold text-amari-titulo">
                Servicios más pedidos
              </h2>
              {d.servicios_top.length === 0 ? (
                <p className="text-sm text-amari-texto">Sin citas completadas en este periodo.</p>
              ) : (
                <ul className="space-y-4">
                  {d.servicios_top.map((s) => (
                    <li key={s.nombre}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-amari-titulo">
                          {s.nombre}
                        </span>
                        <span className="shrink-0">
                          {s.veces}x · {formatearMoneda(s.valor)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amari-bg-soft">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amari-acento to-amari-primario"
                          style={{ width: `${(s.veces / d.servicios_top[0].veces) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tarjeta p-5 sm:p-6">
              <h2 className="mb-4 font-display text-2xl font-semibold text-amari-titulo">
                Productos más vendidos
              </h2>
              {d.productos_top.length === 0 ? (
                <p className="text-sm text-amari-texto">Sin pedidos entregados en este periodo.</p>
              ) : (
                <ul className="space-y-4">
                  {d.productos_top.map((x) => (
                    <li key={x.nombre}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-amari-titulo">
                          {x.nombre}
                        </span>
                        <span className="shrink-0">
                          {x.piezas} pz · {formatearMoneda(x.valor)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amari-bg-soft">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${(x.piezas / d.productos_top[0].piezas) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="tarjeta mb-6 p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-3.5">
              <span className="icono-tarjeta">
                <BadgePercent size={20} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-amari-titulo">
                Comisiones por especialista
              </h2>
            </div>

            <div className="divide-y divide-amari-borde/60">
              {d.comisiones.length === 0 ? (
                <p className="py-3 text-sm text-amari-texto">No hay especialistas registradas.</p>
              ) : (
                d.comisiones.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="min-w-0 flex-1 basis-40">
                      <span className="block truncate font-bold text-amari-titulo">{e.nombre}</span>
                      <span className="block text-xs text-amari-acento">
                        {e.citas} {e.citas === 1 ? "cita" : "citas"} · {formatearMoneda(e.ingresos)} cobrados ·{" "}
                        {e.comision_pct}%
                      </span>
                    </span>
                    <span className="font-display text-xl font-semibold text-amari-titulo">
                      {formatearMoneda(e.comision)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {d.comisiones.length > 0 && (
              <div className="mt-1 flex items-center justify-between rounded-2xl bg-amari-bg-soft px-4 py-3.5 text-sm font-bold text-amari-titulo">
                <span>Total de comisiones</span>
                <span className="font-display text-xl">{formatearMoneda(totalComisiones)}</span>
              </div>
            )}
          </section>

          <section className="tarjeta p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-3.5">
              <span className="icono-tarjeta">
                <ReceiptText size={20} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-amari-titulo">Movimientos</h2>
            </div>

            {d.movimientos.length === 0 ? (
              <div className="vacio border-0 bg-transparent py-8">
                <ReceiptText size={36} className="text-amari-acento" />
                <p className="text-amari-texto">No hay ventas en este periodo.</p>
              </div>
            ) : (
              <div className="divide-y divide-amari-borde/60">
                {d.movimientos.map((mv) => {
                  const Icono = mv.tipo === "servicio" ? Scissors : ShoppingBag;

                  return (
                    <article key={mv.referencia} className="flex items-center gap-3.5 py-3 text-sm">
                      <span className="icono-tarjeta h-10 w-10">
                        <Icono size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-amari-titulo">
                          {mv.cliente} · {mv.referencia}
                        </span>
                        <span className="block truncate text-xs text-amari-acento">
                          {mv.fecha} · {mv.concepto}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-lg font-semibold text-amari-titulo">
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
                  <p className="pt-3 text-center text-xs text-amari-acento">
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