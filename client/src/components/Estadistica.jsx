import { Link } from "react-router-dom";

function Estadistica({ icono: Icono, titulo, valor, detalle, alerta = false, to }) {
  const clases = `tarjeta flex items-start gap-4 p-5 ${
    alerta ? "border-amber-300 bg-amber-50" : ""
  } ${to ? "transition hover:shadow-md" : ""}`;

  const contenido = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          alerta ? "bg-amber-100 text-amber-700" : "bg-amari-bg-soft text-amari-primario"
        }`}
      >
        <Icono size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-amari-acento">{titulo}</p>
        <p className="font-display text-3xl font-semibold text-amari-titulo">{valor}</p>
        {detalle && <p className="text-xs text-amari-texto">{detalle}</p>}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

export default Estadistica;