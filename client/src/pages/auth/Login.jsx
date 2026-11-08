import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { rutaPorRol } from "../../routes/rutaPorRol";
import AuthLayout from "../../components/AuthLayout";
import Campo from "../../components/Campo";

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
    <AuthLayout
      titulo="Bienvenida de vuelta"
      subtitulo="Inicia sesión para continuar"
      activa="login"
    >
      <form onSubmit={enviar}>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Campo
          id="email"
          name="email"
          type="email"
          etiqueta="Correo electrónico"
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          value={form.email}
          onChange={cambiar}
        />
        <Campo
          id="password"
          name="password"
          type="password"
          etiqueta="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={cambiar}
        />

        <button type="submit" disabled={enviando} className="btn-primario w-full py-3">
          <Sparkles size={16} />
          {enviando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;