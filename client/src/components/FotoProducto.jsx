import { ShoppingBag } from "lucide-react";

// Foto de un producto. Si todavía no tiene imagen, muestra un fondo rosa con un bolsito.
// `atenuada` apaga la foto (producto agotado); `children` son las etiquetas encima (categoría, "Agotado").
function FotoProducto({ url, nombre, atenuada = false, className = "h-44 sm:h-48", icono = 40, children }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br from-pink-100 via-amari-bg-soft to-amari-borde ${className}`}
    >
      <span
        aria-hidden
        className="absolute -right-10 -top-16 h-40 w-40 rounded-full border border-amari-acento/25"
      />
      <span
        aria-hidden
        className="absolute -bottom-14 -left-8 hidden h-32 w-32 rounded-full border border-amari-acento/25 sm:block"
      />
      <ShoppingBag size={icono} className="relative text-amari-acento/50" />
      {url && (
        <img
          src={url}
          alt={nombre}
          className={`absolute inset-0 h-full w-full object-cover ${atenuada ? "opacity-70 grayscale" : ""}`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      {children}
    </div>
  );
}

export default FotoProducto;
