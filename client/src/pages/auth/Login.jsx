import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { rutaPorRol } from "../../routes/rutaPorRol";
import logo from "../../assets/branding/logo-amari-cuadrado.png";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const usuario = await login(form);
      navigate(rutaPorRol(usuario.rol), { replace: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-pink-50 px-4 py-10">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <img src={logo} alt="Estudio Amari" className="mx-auto mb-4 h-24 w-24 rounded-full object-cover" />
        <h1 className="mb-6 text-center text-2xl font-bold text-pink-700">Iniciar sesión</h1>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <label className="mb-1 block text-sm text-gray-600" htmlFor="email">Correo</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={cambiar}
          className="mb-4 w-full rounded border border-pink-200 px-3 py-2 focus:border-pink-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm text-gray-600" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={form.password}
          onChange={cambiar}
          className="mb-6 w-full rounded border border-pink-200 px-3 py-2 focus:border-pink-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-pink-600 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-60"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-pink-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </main>
  );
}

export default Login;