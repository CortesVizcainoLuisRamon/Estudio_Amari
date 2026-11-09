import { useEffect, useState } from "react";
import { X, Flower2 } from "lucide-react";
import Campo from "./Campo";
import { crearCliente, actualizarCliente } from "../services/clientes.service";

function ModalCliente({ cliente, onCerrar, onGuardado }) {
  const editando = Boolean(cliente);

  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? "",
    apellidos: cliente?.apellidos ?? "",
    email: cliente?.email ?? "",
    telefono: cliente?.telefono ?? "",
    fecha_nacimiento: cliente?.fecha_nacimiento ?? "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      if (editando) await actualizarCliente(cliente.id, form);
      else await crearCliente(form);
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el cliente");
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amari-titulo/40 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="tarjeta max-h-[90vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amari-borde px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-amari-titulo">
            <Flower2 size={18} className="text-amari-primario" />
            {editando ? "Editar Cliente" : "Nuevo Cliente"}
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

        <form onSubmit={enviar} className="px-6 py-5">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Campo id="nombre" name="nombre" etiqueta="Nombre *" required value={form.nombre} onChange={cambiar} />
            <Campo id="apellidos" name="apellidos" etiqueta="Apellido *" required value={form.apellidos} onChange={cambiar} />
            <Campo id="email" name="email" type="email" etiqueta="Email" value={form.email} onChange={cambiar} />
            <Campo id="telefono" name="telefono" type="tel" etiqueta="Teléfono" value={form.telefono} onChange={cambiar} />
          </div>
          <Campo
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            etiqueta="Fecha nacimiento"
            max={new Date().toISOString().slice(0, 10)}
            value={form.fecha_nacimiento}
            onChange={cambiar}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-full border border-amari-borde px-5 py-2.5 text-sm font-semibold text-amari-primario-oscuro hover:bg-amari-bg-soft"
            >
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primario">
              {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCliente;