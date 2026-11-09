import { useEffect, useState } from "react";
import { Plus, Pencil, Search, Star, Sprout } from "lucide-react";
import { getClientes } from "../../services/clientes.service";
import ModalCliente from "../../components/ModalCliente";

// Regla provisional: desde 3 visitas completadas, la clienta es "Regular"
const VISITAS_REGULAR = 3;

const normalizar = (t) =>
  (t ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null = cerrado, { cliente } = abierto
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    getClientes()
      .then((datos) => {
        if (!activo) return;
        setClientes(datos);
        setError("");
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la lista de clientes.");
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

  const texto = normalizar(busqueda);
  const visibles = clientes.filter((c) =>
    normalizar(`${c.nombre} ${c.apellidos} ${c.telefono} ${c.email}`).includes(texto)
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Clientes</h1>
          <p className="mt-1 text-sm text-amari-acento">
            {clientes.length} {clientes.length === 1 ? "registrado" : "registrados"}
          </p>
        </div>
        <button
          onClick={() => setModal({ cliente: null })}
          disabled={cargando || Boolean(error)}
          className="btn-primario"
        >
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amari-acento" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          aria-label="Buscar clientes"
          className="w-full rounded-full border border-amari-borde bg-white py-3 pl-11 pr-4 text-sm text-amari-titulo placeholder:text-amari-acento/60 focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20"
        />
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando clientes...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!cargando && !error && visibles.length === 0 && (
        <p className="tarjeta p-10 text-center text-sm text-amari-acento">
          {clientes.length === 0
            ? "Aún no hay clientes registrados."
            : "No se encontraron clientes con esa búsqueda."}
        </p>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <div className="space-y-3">
          {visibles.map((c) => {
            const regular = c.visitas >= VISITAS_REGULAR;
            const NivelIcono = regular ? Star : Sprout;

            return (
              <article
                key={c.id}
                className="tarjeta group flex items-center gap-4 p-4 transition hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amari-bg-soft text-sm font-bold text-amari-primario">
                  {`${c.nombre?.[0] ?? ""}${c.apellidos?.[0] ?? ""}`.toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-amari-titulo">
                    {c.nombre} {c.apellidos}
                  </h3>
                  <p className="truncate text-xs text-amari-acento">
                    {c.telefono || c.email || "Sin datos de contacto"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 font-display text-lg text-amari-titulo">
                    <NivelIcono
                      size={16}
                      className={regular ? "text-amber-400" : "text-green-500"}
                    />
                    {regular ? "Regular" : "Nuevo"}
                  </p>
                  <p className="text-xs text-amari-acento">
                    {c.visitas} {c.visitas === 1 ? "visita" : "visitas"}
                  </p>
                </div>

                <button
                  onClick={() => setModal({ cliente: c })}
                  aria-label={`Editar a ${c.nombre}`}
                  className="rounded-lg p-1.5 text-amari-acento transition hover:bg-amari-bg-soft focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Pencil size={16} />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalCliente cliente={modal.cliente} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}
    </>
  );
}

export default ClientesAdmin;