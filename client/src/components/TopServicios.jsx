// Barras con los servicios más pedidos. `servicios` = [{ nombre, veces }]
function TopServicios({ titulo, servicios, vacio = "Aún no hay citas este mes." }) {
  const maximo = servicios[0]?.veces ?? 1;

  return (
    <section className="tarjeta p-6">
      <h2 className="font-display text-2xl font-semibold text-amari-titulo">{titulo}</h2>

      {servicios.length === 0 ? (
        <p className="mt-4 text-sm">{vacio}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {servicios.map((s) => (
            <li key={s.nombre}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-amari-titulo">{s.nombre}</span>
                <span className="shrink-0">
                  {s.veces} {s.veces === 1 ? "vez" : "veces"}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amari-bg-soft">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amari-acento to-amari-primario"
                  style={{ width: `${(s.veces / maximo) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TopServicios;