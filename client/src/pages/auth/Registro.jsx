import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { rutaPorRol } from "../../routes/rutaPorRol";
import AuthLayout from "../../components/AuthLayout";
import Campo from "../../components/Campo";

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
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Regístrate para agendar tus citas"
      activa="registro"
    >
      <form onSubmit={enviar}>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="grid gap-x-3 sm:grid-cols-2">
          <Campo id="nombre" name="nombre" etiqueta="Nombre" required value={form.nombre} onChange={cambiar} />
          <Campo id="apellidos" name="apellidos" etiqueta="Apellidos" required value={form.apellidos} onChange={cambiar} />
        </div>
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
          id="telefono"
          name="telefono"
          type="tel"
          etiqueta="Teléfono (opcional)"
          value={form.telefono}
          onChange={cambiar}
        />
        <Campo
          id="password"
          name="password"
          type="password"
          etiqueta="Contraseña (mínimo 8 caracteres)"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={cambiar}
        />
        <Campo
          id="confirmar"
          name="confirmar"
          type="password"
          etiqueta="Confirmar contraseña"
          autoComplete="new-password"
          required
          value={form.confirmar}
          onChange={cambiar}
        />

        <button type="submit" disabled={enviando} className="btn-primario w-full py-3">
          <Sparkles size={16} />
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Registro;