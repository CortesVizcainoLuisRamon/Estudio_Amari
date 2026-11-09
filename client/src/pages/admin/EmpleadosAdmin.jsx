import { useEffect, useState } from "react";
import { Plus, Pencil, Percent, Scissors } from "lucide-react";
import { getEmpleados } from "../../services/empleados.service";
import { getServicios } from "../../services/servicios.service";
import { DIAS } from "../../config/empleados";
import ModalEmpleado from "../../components/ModalEmpleado";

function EmpleadosAdmin() {
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null = cerrado, { empleado } = abierto
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    Promise.all([getEmpleados(), getServicios()])
      .then(([emp, serv]) => {
        if (!activo) return;
        setEmpleados(emp);
        setServicios(serv);
        setError("");
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar el equipo de trabajo.");
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

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-amari-titulo">Empleadas</h1>
          <p className="mt-1 text-sm text-amari-acento">Equipo de trabajo del estudio</p>
        </div>
        <button
          onClick={() => setModal({ empleado: null })}
          disabled={cargando || Boolean(error)}
          className="btn-primario"
        >
          <Plus size={18} /> Nueva empleada
        </button>
      </div>

      {cargando && <p className="text-center text-amari-primario">Cargando equipo...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!cargando && !error && empleados.length === 0 && (
        <p className="tarjeta p-10 text-center text-sm text-amari-acento">
          Aún no hay empleadas registradas.
        </p>
      )}

      {!cargando && !error && empleados.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {empleados.map((e) => (
            <article
              key={e.id}
              className={`tarjeta group p-5 transition hover:shadow-md ${
                e.activo ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: e.color }}
                >
                  {`${e.nombre[0]}${e.apellidos[0]}`.toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg font-semibold text-amari-titulo">
                    {e.nombre} {e.apellidos}
                  </h3>
                  <p className="text-sm text-amari-acento">
                    {e.puesto || "Sin especialidad"}
                    {!e.activo && " · Inactiva"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amari-texto">
                    <span className="flex items-center gap-1">
                      <Percent size={12} /> {e.comision_pct.toFixed(2)}% comisión
                    </span>
                    <span className="flex items-center gap-1">
                      <Scissors size={12} /> {e.servicios_ids.length} servicios
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {DIAS.filter((d) => e.dias_laborales.includes(d.valor)).map((d) => (
                      <span
                        key={d.valor}
                        className="rounded-full border border-amari-borde bg-amari-bg-soft px-2 py-0.5 text-[11px] text-amari-primario"
                      >
                        {d.corto}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setModal({ empleado: e })}
                  aria-label={`Editar a ${e.nombre}`}
                  className="rounded-lg p-1.5 text-amari-acento transition hover:bg-amari-bg-soft focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <ModalEmpleado
          empleado={modal.empleado}
          servicios={servicios}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}
    </>
  );
}

export default EmpleadosAdmin;