import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { rutaPorRol } from "../../routes/rutaPorRol";

const inputClase =
  "mb-4 w-full rounded border border-pink-200 px-3 py-2 focus:border-pink-500 focus:outline-none";

function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmar: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setEnviando(true);
    try {
      const usuario = await registro({
  nombre: form.nombre,
  apellidos: form.apellidos,
  email: form.email,
  telefono: form.telefono,
  password: form.password,
});
      navigate(rutaPorRol(usuario.rol), { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo completar el registro");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-pink-50 px-4 py-10">
      <form onSubmit={enviar} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold text-pink-700">Crear cuenta</h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <input name="nombre" placeholder="Nombre" required value={form.nombre} onChange={cambiar} className={inputClase} />
        <input name="apellidos" placeholder="Apellidos" required value={form.apellidos} onChange={cambiar} className={inputClase} />
        <input name="email" type="email" placeholder="Correo" required value={form.email} onChange={cambiar} className={inputClase} />
        <input name="telefono" type="tel" placeholder="Teléfono (opcional)" value={form.telefono} onChange={cambiar} className={inputClase} />
        <input name="password" type="password" placeholder="Contraseña (mínimo 8 caracteres)" required minLength={8} value={form.password} onChange={cambiar} className={inputClase} />
        <input name="confirmar" type="password" placeholder="Confirmar contraseña" required value={form.confirmar} onChange={cambiar} className={inputClase} />

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-pink-600 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-60"
        >
          {enviando ? "Creando cuenta..." : "Registrarme"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-pink-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </main>
  );
}

export default Registro;