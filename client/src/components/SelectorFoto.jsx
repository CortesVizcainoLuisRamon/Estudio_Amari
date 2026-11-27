import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Loader2 } from "lucide-react";

const MAX_MB = 12;

const claseBoton =
  "inline-flex items-center gap-1.5 rounded-full border border-amari-borde px-4 py-2 text-sm font-semibold text-amari-primario transition hover:bg-amari-bg-soft disabled:opacity-50";

const claseBotonPerfil =
  "inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-pink-200 bg-white py-3 text-sm font-semibold text-amari-primario-oscuro transition hover:bg-pink-50 disabled:opacity-50";

// Variantes:
//  - normal (productos): zona punteada con botones debajo
//  - redonda: igual pero circular y chica
//  - perfil: avatar grande con insignia de cámara. Lo que pongas como `children`
//    (nombre, etiquetas, estadísticas) queda entre el avatar y los botones.
function SelectorFoto({
  url,
  alSubir,
  alQuitar,
  onOcupado,
  redonda = false,
  perfil = false,
  iniciales = "",
  camara = "environment",
  children,
}) {
  const galeria = useRef(null);
  const tomar = useRef(null);
  const [ocupado, setOcupado] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");

  const ejecutar = async (accion) => {
    setError("");
    setOcupado(true);
    onOcupado?.(true);
    try {
      await accion();
    } catch (err) {
      setError(err.response?.data?.mensaje ?? "No se pudo completar la acción");
    } finally {
      setOcupado(false);
      onOcupado?.(false);
    }
  };

  const recibir = (archivo) => {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return setError("Elige un archivo de imagen");
    if (archivo.size > MAX_MB * 1024 * 1024) return setError(`La imagen pesa más de ${MAX_MB} MB`);
    ejecutar(() => alSubir(archivo));
  };

  const alElegir = (e) => {
    recibir(e.target.files?.[0]);
    e.target.value = ""; // permite volver a elegir el mismo archivo
  };

  const alSoltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    recibir(e.dataTransfer.files?.[0]);
  };

  const zonaSoltar = {
    onDragOver: (e) => {
      e.preventDefault();
      setArrastrando(true);
    },
    onDragLeave: () => setArrastrando(false),
    onDrop: alSoltar,
  };

  const entradas = (
    <>
      <input
        ref={galeria}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={alElegir}
        className="hidden"
      />
      <input
        ref={tomar}
        type="file"
        accept="image/*"
        capture={camara}
        onChange={alElegir}
        className="hidden"
      />
    </>
  );

  if (perfil) {
    return (
      <div className="flex flex-col items-center">
        <div {...zonaSoltar} className="relative h-33 w-33">
          <div
            className={`h-full w-full rounded-full bg-linear-to-br from-pink-200 to-amari-primario p-1 transition ${
              arrastrando ? "scale-105 ring-4 ring-amari-primario/30" : ""
            }`}
          >
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-linear-to-br from-amari-bg-soft to-amari-borde">
              {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-4xl font-semibold text-amari-primario-oscuro">
                  {iniciales}
                </span>
              )}
              {ocupado && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 size={24} className="animate-spin text-amari-primario" />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={ocupado}
            aria-label="Cambiar foto de perfil"
            onClick={() => galeria.current?.click()}
            className="absolute bottom-0.5 right-0 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/40 transition hover:brightness-110 disabled:opacity-60"
          >
            <Camera size={18} />
          </button>
        </div>

        {children}

        <div className="mt-6 flex w-full flex-col gap-2.5 px-5">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => galeria.current?.click()}
            className={claseBotonPerfil}
          >
            <ImagePlus size={17} /> {url ? "Cambiar foto" : "Subir foto"}
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => tomar.current?.click()}
            className={`${claseBotonPerfil} sm:hidden`}
          >
            <Camera size={17} /> Tomar foto
          </button>
          {url && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => ejecutar(alQuitar)}
              className="py-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
        </div>

        {error && <p className="mt-3 px-5 text-sm text-red-600">{error}</p>}
        {entradas}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...zonaSoltar}
        className={`relative flex items-center justify-center overflow-hidden border-2 border-dashed bg-amari-bg-soft transition ${
          redonda ? "h-28 w-28 rounded-full" : "h-40 w-full rounded-2xl"
        } ${arrastrando ? "border-amari-primario" : "border-amari-borde"}`}
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : redonda ? (
          <span className="font-display text-2xl font-semibold text-amari-primario">{iniciales}</span>
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-amari-acento">
            <ImagePlus size={28} />
            Elige o suelta una foto aquí
          </span>
        )}

        {ocupado && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 size={24} className="animate-spin text-amari-primario" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={ocupado} onClick={() => tomar.current?.click()} className={`${claseBoton} sm:hidden`}>
          <Camera size={16} /> Tomar foto
        </button>
        <button type="button" disabled={ocupado} onClick={() => galeria.current?.click()} className={claseBoton}>
          <ImagePlus size={16} /> {url ? "Cambiar foto" : "Elegir foto"}
        </button>
        {url && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => ejecutar(alQuitar)}
            className={`${claseBoton} border-red-200 text-red-600 hover:bg-red-50`}
          >
            <Trash2 size={16} /> Quitar
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {entradas}
    </div>
  );
}

export default SelectorFoto;