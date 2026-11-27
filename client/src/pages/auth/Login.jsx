import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { rutaPorRol } from "../../routes/rutaPorRol";
import AuthLayout from "../../components/AuthLayout";
import Campo from "../../components/Campo";
import ModalOlvideClave from "../../components/ModalOlvideClave";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [olvide, setOlvide] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const usuario = await login(form, recordar);
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
          icono={Mail}
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
          icono={Lock}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={cambiar}
        />

        <div className="-mt-1 mb-5 flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-amari-texto">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
              className="h-4.5 w-4.5 rounded accent-amari-primario"
            />
            Recordarme
          </label>
          <button
            type="button"
            onClick={() => setOlvide(true)}
            className="font-semibold text-amari-primario transition hover:text-amari-primario-oscuro hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={enviando} className="btn-primario w-full py-3.5 text-base">
          <Sparkles size={18} />
          {enviando ? "Entrando..." : "Iniciar sesión"}
        </button>
      </form>

      <ModalOlvideClave abierto={olvide} correo={form.email} onCerrar={() => setOlvide(false)} />
    </AuthLayout>
  );
}

export default Login;