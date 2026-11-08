import { useAuth } from "../hooks/useAuth";

const saludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "¡Buenos días";
  if (hora < 19) return "¡Buenas tardes";
  return "¡Buenas noches";
};

function Panel() {
  const { usuario } = useAuth();
  const fecha = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-amari-titulo">
        {saludo()}, {usuario.nombre}!
      </h1>
      <p className="mt-1 text-sm capitalize text-amari-acento">{fecha}</p>

      <div className="tarjeta mt-8 p-10 text-center text-sm text-amari-acento">
        El resumen de tu panel aparecerá aquí.
      </div>
    </>
  );
}

export default Panel;