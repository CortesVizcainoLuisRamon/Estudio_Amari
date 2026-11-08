import { useEffect, useState } from "react";
import { getServicios } from "../services/servicios.service";

const formatearDuracion = (min) => {
  const horas = Math.floor(min / 60);
  const resto = min % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
};

const formatearPrecio = (servicio) => {
  if (servicio.precio === null) return "Consultar precio";
  const monto = Number(servicio.precio).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
  return servicio.precio_desde ? `Desde ${monto}` : monto;
};

function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    getServicios()
      .then((datos) => {
        if (activo) setServicios(datos);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  if (cargando) return <p className="p-8 text-center text-amari-primario">Cargando servicios...</p>;
  if (error) return <p className="p-8 text-center text-red-600">{error}</p>;

  const porCategoria = servicios.reduce((grupos, servicio) => {
    if (!grupos[servicio.categoria]) grupos[servicio.categoria] = [];
    grupos[servicio.categoria].push(servicio);
    return grupos;
  }, {});

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-amari-bg px-4 py-10">
      <h1 className="text-center font-display text-3xl font-semibold text-amari-titulo">
        Servicios de Estudio Amari
      </h1>
      <p className="mb-10 mt-1 text-center text-sm text-amari-acento">
        Conoce lo que ofrecemos para tu belleza
      </p>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        {Object.entries(porCategoria).map(([categoria, lista]) => (
          <section key={categoria} className="tarjeta p-6">
            <h2 className="mb-4 font-display text-xl font-semibold text-amari-titulo">
              {categoria}
            </h2>
            <ul className="divide-y divide-amari-borde">
              {lista.map((servicio) => (
                <li key={servicio.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-amari-titulo">{servicio.nombre}</p>
                    <p className="text-sm text-amari-texto">
                      {formatearDuracion(servicio.duracion_min)}
                    </p>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-amari-primario">
                    {formatearPrecio(servicio)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

export default Servicios;