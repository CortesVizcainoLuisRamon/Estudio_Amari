import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
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

const chip = (activo) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    activo
      ? "border-transparent bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "border-amari-borde bg-white text-amari-primario hover:bg-amari-bg-soft"
  }`;

function ServiciosAdmin() {
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

  const visibles = filtro ? servicios.filter((s) => s.categoria_id === filtro) : servicios;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">
            Catálogo de Servicios
          </h1>
          <p className="mt-1 text-sm text-amari-acento">
            Gestiona los servicios que ofrece el estudio
          </p>
        </div>
        <button
          onClick={() => setModal({ servicio: null })}
          disabled={cargando || Boolean(error)}
          className="btn-primario"
        >
          <Plus size={18} /> Nuevo servicio
        </button>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando servicios...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!cargando && !error && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setFiltro(null)} className={chip(filtro === null)}>
              ✨ Todos
            </button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setFiltro(c.id)} className={chip(filtro === c.id)}>
                {iconoCategoria(c.nombre)} {c.nombre}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="tarjeta p-10 text-center text-sm text-amari-acento">
              No hay servicios en esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((s) => (
                <article
                  key={s.id}
                  className={`tarjeta group min-w-0 p-4 transition hover:shadow-md ${
                    s.activo ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-xl">{iconoCategoria(s.categoria)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold leading-snug text-amari-titulo">
                        {s.nombre}
                      </h3>
                      <p className="text-xs text-amari-acento">
                        {s.categoria}
                        {!s.activo && " · Inactivo"}
                      </p>
                    </div>
                    <button
                      onClick={() => setModal({ servicio: s })}
                      aria-label={`Editar ${s.nombre}`}
                      className="shrink-0 rounded-lg p-1.5 text-amari-acento transition hover:bg-amari-bg-soft focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="shrink-0 text-xs text-amari-acento">{s.duracion_min} min</span>
                    <span className="text-right font-display text-xl font-semibold text-amari-titulo">
                      {formatearPrecio(s)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {modal && (
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