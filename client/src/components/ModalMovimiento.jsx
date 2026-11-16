import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import Campo from "./Campo";
import { registrarMovimiento } from "../services/inventario.service";
import { formatearCantidad } from "../config/inventario";

const TEXTOS = {
  entrada: {
    titulo: "Registrar entrada",
    etiqueta: "Cantidad que entra",
    motivo: "Ej: Compra a proveedor",
    boton: "Registrar entrada",
  },
  salida: {
    titulo: "Registrar salida",
    etiqueta: "Cantidad que sale",
    motivo: "Ej: Uso en servicio, merma",
    boton: "Registrar salida",
  },
  ajuste: {
    titulo: "Ajustar stock",
    etiqueta: "Stock real contado",
    motivo: "Ej: Conteo físico del mes",
    boton: "Guardar ajuste",
  },
};

function ModalMovimiento({ insumo, tipo, onCerrar, onGuardado }) {
  const texto = TEXTOS[tipo];
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const valor = Number(cantidad);
  const valido = cantidad !== "" && Number.isFinite(valor) && (tipo === "ajuste" ? valor >= 0 : valor > 0);

  const quedara =
    tipo === "entrada" ? insumo.stock + valor : tipo === "salida" ? insumo.stock - valor : valor;

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const actualizado = await registrarMovimiento(insumo.id, { tipo, cantidad, motivo });
      onGuardado(actualizado);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo registrar el movimiento");
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm">
      <div className="tarjeta w-full max-w-md">
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            {texto.titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-amari-acento hover:text-amari-primario-oscuro"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4 px-6 py-5">
          <div className="rounded-xl bg-amari-bg-soft p-3 text-sm text-amari-titulo">
            <p className="font-semibold">{insumo.nombre}</p>
            <p className="text-amari-acento">
              Disponible: {formatearCantidad(insumo.stock)} {insumo.unidad}
            </p>
          </div>

          <Campo
            id="cantidad"
            type="number"
            etiqueta={`${texto.etiqueta} (${insumo.unidad})`}
            min="0"
            step="0.01"
            autoFocus
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />

          <Campo
            id="motivo"
            etiqueta="Motivo (opcional)"
            placeholder={texto.motivo}
            maxLength={200}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {valido && (
            <p className="text-sm text-amari-texto">
              Quedará en{" "}
              <span className={`font-semibold ${quedara < 0 ? "text-red-600" : "text-amari-titulo"}`}>
                {formatearCantidad(quedara)} {insumo.unidad}
              </span>
            </p>
          )}

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft disabled:opacity-60"
            >
              Cancelar
            </button>
            <button type="submit" disabled={!valido || quedara < 0 || enviando} className="btn-primario">
              {enviando ? "Guardando..." : texto.boton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalMovimiento;