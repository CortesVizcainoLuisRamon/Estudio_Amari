import { useEffect, useState } from "react";
import { Plus, Pencil, Search, Star, Sprout, Gift, KeyRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getClientes, crearAcceso } from "../../services/clientes.service";
import { getFidelidadTodos } from "../../services/citas.service";
import ModalCliente from "../../components/ModalCliente";
import ModalClaveTemporal from "../../components/ModalClaveTemporal";

// Regla provisional: desde 3 visitas completadas, la clienta es "Regular"
const VISITAS_REGULAR = 3;
// Tarjeta de fidelidad: 5 visitas y el sexto servicio es gratis
const VISITAS_PREMIO = 5;

const normalizar = (t) =>
  (t ?? "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function ClientesAdmin() {
  const { usuario } = useAuth();
  const esAdmin = usuario.rol === "admin";

  const [clientes, setClientes] = useState([]);
  const [fidelidad, setFidelidad] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [modal, setModal] = useState(null); // null = cerrado, { cliente } = abierto
  const [clave, setClave] = useState(null); // contraseña temporal por mostrar
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    // Si la fidelidad falla, la lista se muestra igual (sin sellos)
    Promise.all([getClientes(), getFidelidadTodos().catch(() => [])])
      .then(([datos, sellos]) => {
        if (!activo) return;
        setClientes(datos);
        setFidelidad(Object.fromEntries(sellos.map((f) => [f.cliente_id, f])));
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

  const alGuardar = (guardado) => {
    setModal(null);
    setVersion((v) => v + 1);

    if (guardado?.clave_temporal) {
      setClave({
        nombre: `${guardado.nombre} ${guardado.apellidos}`,
        email: guardado.email,
        clave: guardado.clave_temporal,
        nuevo: true,
      });
    }
  };

  const darAcceso = async (c) => {
    const restablecer = c.tiene_acceso;

    if (
      restablecer &&
      !window.confirm(`¿Restablecer la contraseña de ${c.nombre}? Su contraseña actual dejará de funcionar.`)
    ) {
      return;
    }

    setAviso("");
    try {
      const resultado = await crearAcceso(c.id);
      setClave({
        nombre: `${c.nombre} ${c.apellidos}`,
        email: c.email,
        clave: resultado.clave_temporal,
        nuevo: !restablecer,
      });
      setVersion((v) => v + 1);
    } catch (err) {
      setAviso(err.response?.data?.mensaje ?? "No se pudo generar el acceso");
    }
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

      {aviso && (
        <p
          onClick={() => setAviso("")}
          className="mb-4 cursor-pointer rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {aviso}
        </p>
      )}

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
            const sellos = fidelidad[c.id]?.sellos ?? 0;
            const premio = fidelidad[c.id]?.premio ?? false;

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
                  {esAdmin && !c.tiene_acceso && (
                    <p className="mt-0.5 text-[11px] font-medium text-amber-700">Sin acceso al sistema</p>
                  )}
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
                  {premio ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <Gift size={12} /> Premio disponible
                    </p>
                  ) : (
                    <p className="text-[11px] text-amari-acento">
                      {sellos}/{VISITAS_PREMIO} sellos
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  {esAdmin && (
                    <button
                      onClick={() => darAcceso(c)}
                      aria-label={
                        c.tiene_acceso ? `Restablecer contraseña de ${c.nombre}` : `Crear acceso a ${c.nombre}`
                      }
                      title={c.tiene_acceso ? "Restablecer contraseña" : "Crear acceso"}
                      className="rounded-lg p-1.5 text-amari-acento transition hover:bg-amari-bg-soft focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <KeyRound size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ cliente: c })}
                    aria-label={`Editar a ${c.nombre}`}
                    className="rounded-lg p-1.5 text-amari-acento transition hover:bg-amari-bg-soft focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalCliente cliente={modal.cliente} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}

      {clave && <ModalClaveTemporal {...clave} onCerrar={() => setClave(null)} />}
    </>
  );
}

export default ClientesAdmin;