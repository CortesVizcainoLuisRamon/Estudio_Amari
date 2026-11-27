import { Link } from "react-router-dom";

// Tarjeta de dato: icono, número grande y un detalle.
// `chip` es una etiqueta corta arriba a la derecha; `alerta` la pinta en ámbar;
// `to` convierte toda la tarjeta en enlace; `children` va al final (barra de avance, etc.).
function Estadistica({ icono: Icono, titulo, valor, detalle, chip, alerta = false, to, children }) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${
            alerta ? "bg-amber-100 text-amber-700" : "bg-pink-50 text-amari-primario-oscuro"
          }`}
        >
          <Icono size={20} />
        </span>
        {chip && (
          <span
            className={`hidden rounded-full px-2.5 py-1 text-xs font-bold sm:inline-block ${
              alerta ? "bg-amber-100 text-amber-800" : "bg-pink-50 text-amari-primario-oscuro"
            }`}
          >
            {chip}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm sm:mt-4">{titulo}</p>
      <p className="mt-0.5 font-display text-2xl font-semibold leading-tight text-amari-titulo sm:text-3xl">
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-amari-acento">{detalle}</p>}
      {children}
    </>
  );

  const clase = `tarjeta block p-4 sm:p-5 ${alerta ? "border-amber-200 bg-amber-50/60" : ""}`;

  return to ? (
    <Link to={to} className={`${clase} transition hover:-translate-y-0.5 hover:shadow-xl`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

export default Estadistica;
