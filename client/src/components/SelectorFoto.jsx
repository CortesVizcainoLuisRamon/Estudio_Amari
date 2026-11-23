import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Loader2 } from "lucide-react";

const MAX_MB = 12;

const claseBoton =
  "inline-flex items-center gap-1.5 rounded-xl border border-amari-borde px-3 py-2 text-sm font-semibold text-amari-primario transition hover:bg-amari-bg-soft disabled:opacity-50";

function SelectorFoto({
  url,
  alSubir,
  alQuitar,
  onOcupado,
  redonda = false,
  iniciales = "",
  camara = "environment",
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

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`relative flex items-center justify-center overflow-hidden border-2 border-dashed bg-amari-bg-soft transition ${
          redonda ? "h-28 w-28 rounded-full" : "h-40 w-full rounded-xl"
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
    </div>
  );
}

export default SelectorFoto;