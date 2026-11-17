import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { UserRound, KeyRound, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPerfilCompleto, actualizarPerfil, cambiarClave } from "../services/perfil.service";

const entrada =
  "w-full rounded-xl border border-amari-borde bg-white px-4 py-2.5 text-sm text-amari-titulo focus:border-amari-primario focus:outline-none focus:ring-2 focus:ring-amari-primario/20";

function Campo({ id, etiqueta, ...props }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amari-primario"
      >
        {etiqueta}
      </label>
      <input id={id} className={entrada} {...props} />
    </div>
  );
}

function Mensaje({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm ${
        mensaje.error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      {mensaje.texto}
    </p>
  );
}

const mensajeDeError = (err, defecto) => err.response?.data?.mensaje ?? defecto;

function FormDatos({ inicial, esCliente, alGuardar }) {
  const [form, setForm] = useState({
    nombre: inicial.nombre ?? "",
    apellidos: inicial.apellidos ?? "",
    telefono: inicial.telefono ?? "",
    email: inicial.email ?? "",
    fecha_nacimiento: inicial.fecha_nacimiento ?? "",
    password_actual: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cambia = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const cambioCorreo = form.email.trim().toLowerCase() !== inicial.email;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarPerfil(form);
      setForm((f) => ({ ...f, password_actual: "" }));
      setMensaje({ texto: "Tus datos se guardaron correctamente." });
      alGuardar();
    } catch (err) {
      setMensaje({ error: true, texto: mensajeDeError(err, "No se pudieron guardar los datos") });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4 p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amari-titulo">
        <UserRound size={20} /> Datos personales
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo id="p-nombre" etiqueta="Nombre" value={form.nombre} onChange={cambia("nombre")} required />
        <Campo
          id="p-apellidos"
          etiqueta="Apellidos"
          value={form.apellidos}
          onChange={cambia("apellidos")}
          required
        />
        <Campo
          id="p-telefono"
          etiqueta="Teléfono"
          type="tel"
          value={form.telefono}
          onChange={cambia("telefono")}
        />
        {esCliente && (
          <Campo
            id="p-fecha"
            etiqueta="Fecha de nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={cambia("fecha_nacimiento")}
          />
        )}
      </div>

      <Campo
        id="p-email"
        etiqueta="Correo (con el que inicias sesión)"
        type="email"
        value={form.email}
        onChange={cambia("email")}
        required
      />

      {cambioCorreo && (
        <Campo
          id="p-clave-correo"
          etiqueta="Contraseña actual (necesaria para cambiar el correo)"
          type="password"
          autoComplete="current-password"
          value={form.password_actual}
          onChange={cambia("password_actual")}
        />
      )}

      <Mensaje mensaje={mensaje} />

      <button type="submit" disabled={guardando} className="btn-primario disabled:opacity-50">
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function FormClave({ alCambiar }) {
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cambia = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (form.nueva.length < 8) {
      return setMensaje({ error: true, texto: "La contraseña nueva debe tener al menos 8 caracteres" });
    }
    if (form.nueva !== form.confirmar) {
      return setMensaje({ error: true, texto: "La confirmación no coincide con la contraseña nueva" });
    }

    setGuardando(true);
    try {
      await cambiarClave(form.actual, form.nueva);
      setForm({ actual: "", nueva: "", confirmar: "" });
      setMensaje({ texto: "Tu contraseña se actualizó." });
      alCambiar();
    } catch (err) {
      setMensaje({ error: true, texto: mensajeDeError(err, "No se pudo cambiar la contraseña") });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4 p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amari-titulo">
        <KeyRound size={20} /> Cambiar contraseña
      </h2>

      <Campo
        id="c-actual"
        etiqueta="Contraseña actual"
        type="password"
        autoComplete="current-password"
        value={form.actual}
        onChange={cambia("actual")}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          id="c-nueva"
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={form.nueva}
          onChange={cambia("nueva")}
          required
        />
        <Campo
          id="c-confirmar"
          etiqueta="Confirmar contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={form.confirmar}
          onChange={cambia("confirmar")}
          required
        />
      </div>

      <Mensaje mensaje={mensaje} />

      <button type="submit" disabled={guardando} className="btn-primario disabled:opacity-50">
        {guardando ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}

function Configuracion() {
  const { usuario } = useAuth();
  const { recargarPerfil, debeCambiarClave } = useOutletContext();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let activo = true;
    getPerfilCompleto()
      .then((data) => activo && setResultado({ data }))
      .catch(() => activo && setResultado({ error: true }));
    return () => {
      activo = false;
    };
  }, [version]);

  const datosGuardados = () => {
    recargarPerfil();
    setVersion((v) => v + 1);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Configuración</h1>
        <p className="mt-1 text-sm text-amari-acento">Tu perfil y la seguridad de tu cuenta</p>
      </div>

      {debeCambiarClave && (
        <div className="mb-6 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <p>
            Estás usando una <strong>contraseña temporal</strong>. Por seguridad, cámbiala por una propia
            para poder seguir usando el sistema.
          </p>
        </div>
      )}

      {!resultado && <p className="text-center text-amari-primario">Cargando tu perfil...</p>}
      {resultado?.error && <p className="text-center text-red-600">No se pudo cargar tu perfil.</p>}

      {resultado?.data && (
        <div className="grid max-w-3xl grid-cols-1 gap-6">
          <FormClave alCambiar={recargarPerfil} />
          <FormDatos
            key={version}
            inicial={resultado.data}
            esCliente={usuario.rol === "cliente"}
            alGuardar={datosGuardados}
          />
        </div>
      )}
    </>
  );
}

export default Configuracion;