import { useEffect, useState } from "react";
import { Plus, Pencil, Search, Star, Sprout, Gift, KeyRound, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getClientes, crearAcceso } from "../../services/clientes.service";
import { getFidelidadTodos } from "../../services/citas.service";
import ModalCliente from "../../components/ModalCliente";
import ModalClaveTemporal from "../../components/ModalClaveTemporal";
import { VISITAS_REGULAR, VISITAS_PREMIO } from "../../config/fidelidad";
import { normalizarTexto as normalizar } from "../../utils/formato";

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
          className="btn-primario px-6"
        >
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amari-acento" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          aria-label="Buscar clientes"
          className="entrada rounded-full pl-11 shadow-sm"
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
        <div className="vacio text-sm">
          <Users size={30} className="text-amari-acento" />
          {clientes.length === 0
            ? "Aún no hay clientes registrados."
            : "No se encontraron clientes con esa búsqueda."}
        </div>
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
                className="tarjeta group flex flex-wrap items-center gap-x-4 gap-y-3 p-4 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-50 text-sm font-bold text-amari-primario-oscuro ring-1 ring-amari-borde">
                  {`${c.nombre?.[0] ?? ""}${c.apellidos?.[0] ?? ""}`.toUpperCase()}
                </span>

                <div className="min-w-0 flex-1 basis-40">
                  <h3 className="truncate font-bold text-amari-titulo">
                    {c.nombre} {c.apellidos}
                  </h3>
                  <p className="truncate text-sm">
                    {c.telefono || c.email || "Sin datos de contacto"}
                  </p>
                  {esAdmin && !c.tiene_acceso && (
                    <p className="mt-1 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                      Sin acceso al sistema
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <p
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
                      regular ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700"
                    }`}
                  >
                    <NivelIcono size={15} className={regular ? "text-amber-500" : "text-green-500"} />
                    {regular ? "Regular" : "Nuevo"}
                  </p>
                  <p className="text-xs text-amari-acento">
                    {c.visitas} {c.visitas === 1 ? "visita" : "visitas"}
                  </p>
                  {premio ? (
                    <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                      <Gift size={12} /> Premio disponible
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-[11px] text-amari-acento">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-amari-borde/70">
                        <span
                          className="block h-full rounded-full bg-amari-primario"
                          style={{ width: `${(sellos / VISITAS_PREMIO) * 100}%` }}
                        />
                      </span>
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
                      className="rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <KeyRound size={17} />
                    </button>
                  )}
                  <button
                    onClick={() => setModal({ cliente: c })}
                    aria-label={`Editar a ${c.nombre}`}
                    className="rounded-xl p-2 text-amari-primario-oscuro transition hover:bg-pink-50 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Pencil size={17} />
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