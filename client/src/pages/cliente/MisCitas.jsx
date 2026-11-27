import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Bell, CalendarHeart, ChevronRight, ClipboardList, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAhora } from "../../hooks/useAhora";
import { useCarrito } from "../../hooks/useCarrito";
import { getMisCitas, getMiFidelidad } from "../../services/citas.service";
import TarjetaFidelidad from "../../components/TarjetaFidelidad";
import ModalCitaCliente from "../../components/ModalCitaCliente";
import TarjetaCita from "../../components/TarjetaCita";
import TarjetaNivel from "../../components/TarjetaNivel";
import { aTexto, diaYMes } from "../../utils/fechas";

const dos = (n) => String(n).padStart(2, "0");

// "2026-11-23 14:30", para compararlo con el inicio de las citas
const textoDe = (fecha) => `${aTexto(fecha)} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;

const FILTROS = [
  { id: "todas", texto: "Todas" },
  { id: "completadas", texto: "Completadas" },
  { id: "canceladas", texto: "Canceladas" },
];

const pasaFiltro = (cita, filtro) => {
  if (filtro === "completadas") return cita.estado === "completada";
  if (filtro === "canceladas") return ["cancelada", "no_asistio"].includes(cita.estado);
  return true;
};

// Atajos a lo demás que puede hacer la clienta (en celular están en la barra de abajo)
function Atajos() {
  const { noLeidas } = useOutletContext();
  const { cantidad: enCarrito } = useCarrito();

  const atajos = [
    {
      to: "/cliente/boutique",
      icono: ShoppingBag,
      titulo: "Boutique Amari",
      detalle: "Mira los productos del estudio y pídelos desde aquí.",
    },
    {
      to: "/cliente/pedidos",
      icono: ClipboardList,
      titulo: "Mis pedidos",
      detalle: "Sigue el estado de tus compras.",
    },
    {
      to: "/cliente/notificaciones",
      icono: Bell,
      titulo: "Mis notificaciones",
      detalle: noLeidas > 0 ? `${noLeidas} sin leer` : "Estás al día.",
      cuenta: noLeidas,
    },
    {
      to: "/cliente/carrito",
      icono: ShoppingCart,
      titulo: "Mi carrito",
      detalle: enCarrito > 0 ? `${enCarrito} ${enCarrito === 1 ? "artículo" : "artículos"}` : "Está vacío.",
      cuenta: enCarrito,
    },
  ];

  return (
    <section className="tarjeta p-3">
      <ul className="space-y-1">
        {atajos.map(({ to, icono: Icono, titulo, detalle, cuenta }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex items-center gap-3.5 rounded-2xl p-3 transition hover:bg-amari-bg-soft"
            >
              <span className="icono-tarjeta h-11 w-11">
                <Icono size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-amari-titulo">{titulo}</span>
                <span className="block text-sm leading-snug">{detalle}</span>
              </span>
              {cuenta > 0 && (
                <span className="rounded-full bg-amari-primario px-2 py-0.5 text-[11px] font-bold text-white">
                  {cuenta > 9 ? "9+" : cuenta}
                </span>
              )}
              <ChevronRight
                size={18}
                className="shrink-0 text-amari-acento transition group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MisCitas() {
  const { usuario } = useAuth();
  const ahoraFecha = useAhora();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [modal, setModal] = useState(false);
  const [aviso, setAviso] = useState("");
  const [fidelidad, setFidelidad] = useState(null);
  const [filtro, setFiltro] = useState("todas");

  const clave = String(version);
  const ahora = textoDe(ahoraFecha);

  useEffect(() => {
    let activo = true;

    getMisCitas()
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

  useEffect(() => {
    let activo = true;

    getMiFidelidad()
      .then((data) => {
        if (activo) setFidelidad(data);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, [clave]);

  const cargando = resultado?.clave !== clave;
  const error = !cargando && resultado.error;
  const citas = !cargando && !error ? resultado.data : [];

  const esProxima = (c) =>
    (c.estado === "pendiente" || c.estado === "confirmada") && c.inicio >= ahora;

  // El servidor las manda de la más reciente a la más antigua
  const proximas = citas.filter(esProxima).reverse();
  const historial = citas.filter((c) => !esProxima(c));
  const historialVisible = historial.filter((c) => pasaFiltro(c, filtro));

  const completadas = citas.filter((c) => c.estado === "completada");
  const ultimaVisita = completadas.length > 0 ? diaYMes(completadas[0].inicio) : null;

  const recargar = () => setVersion((v) => v + 1);

  const tarjetaNivel = !cargando && !error && (
    <TarjetaNivel visitas={completadas.length} ultimaVisita={ultimaVisita} />
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-amari-acento">Aquí están tus citas en Estudio Amari.</p>
        </div>
        <button
          onClick={() => {
            setAviso("");
            setModal(true);
          }}
          className="btn-primario w-full px-6 sm:w-auto"
        >
          <Plus size={18} /> Agendar cita
        </button>
      </div>

      {aviso && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{aviso}</p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {fidelidad && <TarjetaFidelidad fidelidad={fidelidad} />}
          {cargando && <p className="text-center text-amari-primario">Cargando tus citas...</p>}
          {error && <p className="text-center text-red-600">No se pudieron cargar tus citas.</p>}

          {!cargando && !error && (
            <>
              <h2 className="mb-3 font-display text-2xl font-semibold text-amari-titulo">
                Próximas citas
              </h2>

              {proximas.length === 0 ? (
                <div className="tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <CalendarHeart size={36} className="text-amari-acento" />
                  <p className="text-amari-texto">No tienes citas próximas.</p>
                  <button
                    onClick={() => {
                      setAviso("");
                      setModal(true);
                    }}
                    className="btn-primario"
                  >
                    <Plus size={18} /> Agendar mi cita
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximas.map((c, i) => (
                    <TarjetaCita
                      key={c.id}
                      cita={c}
                      ahora={ahoraFecha}
                      destacada={i === 0}
                      puedeCancelar
                      onCambio={recargar}
                    />
                  ))}
                </div>
              )}

              {historial.length > 0 && (
                <>
                  <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-2xl font-semibold text-amari-titulo">
                      Historial
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {FILTROS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltro(f.id)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                            filtro === f.id
                              ? "bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
                              : "border border-amari-borde bg-white text-amari-primario-oscuro hover:bg-amari-bg-soft"
                          }`}
                        >
                          {f.texto}
                        </button>
                      ))}
                    </div>
                  </div>

                  {historialVisible.length === 0 ? (
                    <p className="text-sm">No hay citas en esta sección.</p>
                  ) : (
                    <div className="space-y-4">
                      {historialVisible.map((c) => (
                        <TarjetaCita
                          key={c.id}
                          cita={c}
                          puedeCancelar={false}
                          onCambio={recargar}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {tarjetaNivel && <div className="mt-8 xl:hidden">{tarjetaNivel}</div>}
            </>
          )}
        </div>

        <div className="hidden space-y-6 xl:block">
          {tarjetaNivel}
          <Atajos />
        </div>
      </div>

      {modal && (
        <ModalCitaCliente
          onCerrar={() => setModal(false)}
          onGuardado={() => {
            setModal(false);
            setAviso(
              "¡Listo! Tu cita quedó registrada y está pendiente de confirmación por el estudio."
            );
            recargar();
          }}
        />
      )}
    </>
  );
}

export default MisCitas;