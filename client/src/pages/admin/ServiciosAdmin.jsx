import { useEffect, useState } from "react";
import { Clock, Plus, Pencil, Scissors } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getServiciosGestion, getCategorias } from "../../services/servicios.service";
import { iconoCategoria } from "../../config/categorias";
import ModalServicio from "../../components/ModalServicio";

const formatearPrecio = (s) => {
  if (s.precio === null) return "Sin precio";
  const monto = s.precio.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  });
  return s.precio_desde ? `Desde ${monto}` : monto;
};

function ServiciosAdmin() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "admin";

  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null = cerrado, { servicio } = abierto
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    Promise.all([getServiciosGestion(), getCategorias()])
      .then(([serv, cats]) => {
        if (!activo) return;
        setServicios(serv);
        setCategorias(cats);
        setError("");
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar el catálogo de servicios.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [version]);

  const cerrarModal = () => setModal(null);

  const alGuardar = () => {
    setModal(null);
    setVersion((v) => v + 1);
  };

  // La empleada solo ve los servicios activos
  const catalogo = esAdmin ? servicios : servicios.filter((s) => s.activo);
  const visibles = filtro ? catalogo.filter((s) => s.categoria_id === filtro) : catalogo;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Catálogo de Servicios
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            {esAdmin
              ? "Gestiona los servicios que ofrece el estudio"
              : "Servicios del estudio, con su duración y precio"}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setModal({ servicio: null })}
            disabled={cargando || Boolean(error)}
            className="btn-primario px-6"
          >
            <Plus size={18} /> Nuevo servicio
          </button>
        )}
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando servicios...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setFiltro(null)} className={`chip ${filtro === null ? "chip-activo" : ""}`}>
              ✨ Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => setFiltro(c.id)}
                className={`chip ${filtro === c.id ? "chip-activo" : ""}`}
              >
                {iconoCategoria(c.nombre)} {c.nombre}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <div className="vacio text-sm">
              <Scissors size={30} className="text-amari-acento" />
              No hay servicios en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((s) => (
                <article
                  key={s.id}
                  className={`tarjeta group flex min-w-0 flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-xl ${
                    s.activo ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-xl">
                      {iconoCategoria(s.categoria)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold leading-snug text-amari-titulo">
                        {s.nombre}
                      </h3>
                      <p className="text-xs text-amari-acento">
                        {s.categoria}
                        {!s.activo && " · Inactivo"}
                      </p>
                    </div>
                    {esAdmin && (
                      <button
                        onClick={() => setModal({ servicio: s })}
                        aria-label={`Editar ${s.nombre}`}
                        className="shrink-0 rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Pencil size={17} />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-amari-borde/60 pt-4">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amari-bg-soft px-3 py-1 text-xs font-semibold text-amari-primario-oscuro">
                      <Clock size={13} /> {s.duracion_min} min
                    </span>
                    <span className="text-right font-display text-2xl font-semibold text-amari-titulo">
                      {formatearPrecio(s)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {esAdmin && modal && (
        <ModalServicio
          servicio={modal.servicio}
          categorias={categorias}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </>
  );
}

export default ServiciosAdmin;