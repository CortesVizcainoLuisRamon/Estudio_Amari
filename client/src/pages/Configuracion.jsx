import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Cake,
  CircleAlert,
  CircleCheck,
  Gift,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPerfilCompleto, actualizarPerfil, cambiarClave } from "../services/perfil.service";
import { subirFotoPerfil, quitarFotoPerfil } from "../services/imagenes.service";
import { ESTUDIO } from "../config/estudio";
import { VISITAS_REGULAR, VISITAS_PREMIO } from "../config/fidelidad";
import { WHATSAPP_ESTUDIO } from "../config/notificaciones";
import Campo from "../components/Campo";
import SelectorFoto from "../components/SelectorFoto";

// Mientras WHATSAPP_ESTUDIO siga con el número de ejemplo, no se muestra el botón.
const HAY_WHATSAPP = Boolean(WHATSAPP_ESTUDIO) && WHATSAPP_ESTUDIO !== "520000000000";

const ETIQUETA_ROL = { admin: "Admin", empleado: "Empleada", cliente: "Cliente" };

const botonSecundario =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-amari-primario-oscuro transition hover:bg-pink-50 disabled:opacity-50";

const mensajeDeError = (err, defecto) => err.response?.data?.mensaje ?? defecto;

// "2026-03-14" -> "marzo de 2026"
const mesYAnio = (fecha) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

// 1 = muy corta, 2 = regular, 3 = buena, 4 = segura
function fuerzaClave(clave) {
  if (!clave) return 0;
  if (clave.length < 8) return 1;
  let nivel = 2;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) nivel++;
  if ((/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) || clave.length >= 12) nivel++;
  return Math.min(nivel, 4);
}
const FUERZA = {
  1: { texto: "Muy corta", barra: "bg-red-400" },
  2: { texto: "Regular", barra: "bg-amber-400" },
  3: { texto: "Buena", barra: "bg-amari-acento" },
  4: { texto: "Segura", barra: "bg-green-500" },
};

function Mensaje({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p
      className={`mt-5 rounded-xl px-4 py-3 text-sm ${
        mensaje.error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      {mensaje.texto}
    </p>
  );
}

function EncabezadoTarjeta({ icono: Icono, titulo, detalle }) {
  return (
    <div className="mb-6 flex items-center gap-3.5">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-pink-50 text-amari-primario-oscuro">
        <Icono size={20} />
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold leading-tight text-amari-titulo sm:text-2xl">
          {titulo}
        </h2>
        <p className="text-sm">{detalle}</p>
      </div>
    </div>
  );
}

const tarjeta = "tarjeta rounded-3xl p-6 shadow-lg shadow-amari-primario/10 sm:p-7";

function TarjetaPerfil({ datos, rol, foto, alCambiarFoto, recargarPerfil }) {
  const resumen = datos.resumen; // solo clientes: { visitas, sellos, premio }
  const nombreCompleto = `${datos.nombre} ${datos.apellidos}`.trim();
  const iniciales = `${datos.nombre[0] ?? ""}${datos.apellidos[0] ?? ""}`.toUpperCase();

  const estadisticas = resumen && [
    { valor: resumen.visitas, etiqueta: resumen.visitas === 1 ? "Visita" : "Visitas" },
    { valor: resumen.visitas >= VISITAS_REGULAR ? "Regular" : "Nuevo", etiqueta: "Nivel" },
    { valor: `${resumen.sellos}/${VISITAS_PREMIO}`, etiqueta: "Sellos" },
  ];

  return (
    <section className="tarjeta overflow-hidden rounded-3xl pb-6 text-center shadow-lg shadow-amari-primario/10">
      <div className="relative h-28 overflow-hidden bg-linear-to-br from-pink-100 via-amari-bg-soft to-amari-borde">
        <div className="absolute -right-16 -top-28 h-60 w-60 rounded-full border border-amari-acento/25" />
        <div className="absolute -left-12 top-8 h-40 w-40 rounded-full border border-amari-acento/25" />
        <div className="absolute -top-10 left-28 h-24 w-24 rounded-full border border-amari-acento/25" />
      </div>

      <div className="-mt-16">
        <SelectorFoto
          perfil
          camara="user"
          url={foto}
          iniciales={iniciales}
          alSubir={async (archivo) => {
            alCambiarFoto(await subirFotoPerfil(archivo));
            recargarPerfil();
          }}
          alQuitar={async () => {
            await quitarFotoPerfil();
            alCambiarFoto(null);
            recargarPerfil();
          }}
        >
          <h2 className="mt-4 px-6 font-display text-2xl font-semibold leading-tight text-amari-titulo">
            {nombreCompleto}
          </h2>
          <span className="mt-2.5 inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-amari-primario-oscuro">
            {ETIQUETA_ROL[rol] ?? rol}
          </span>
          {datos.miembro_desde && (
            <p className="mt-2.5 text-sm">Miembro desde {mesYAnio(datos.miembro_desde)}</p>
          )}

          {estadisticas && (
            <div className="mx-5 mt-5 flex self-stretch rounded-2xl border border-amari-borde bg-amari-bg-soft">
              {estadisticas.map((e, i) => (
                <div
                  key={e.etiqueta}
                  className={`flex-1 px-1 py-3.5 ${i > 0 ? "border-l border-amari-borde" : ""}`}
                >
                  <p className="font-display text-xl font-semibold leading-tight text-amari-titulo">
                    {e.valor}
                  </p>
                  <p className="text-xs">{e.etiqueta}</p>
                </div>
              ))}
            </div>
          )}

          {resumen?.premio && (
            <p className="mx-5 mt-3 flex items-center justify-center gap-2 self-stretch rounded-2xl bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
              <Gift size={16} /> Tienes un premio disponible
            </p>
          )}
        </SelectorFoto>
      </div>
    </section>
  );
}

function TarjetaAyuda() {
  return (
    <section className="tarjeta rounded-3xl bg-linear-to-br from-white to-amari-bg-soft p-6">
      <div className="flex items-start gap-3.5">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-pink-50 text-amari-primario-oscuro">
          <MessageCircle size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-amari-titulo">¿Necesitas ayuda?</h2>
          <p className="mt-1 text-sm leading-relaxed">
            Escríbenos y el estudio te responde en horario de atención.
          </p>
        </div>
      </div>
      <a
        href={
          HAY_WHATSAPP
            ? `https://wa.me/${WHATSAPP_ESTUDIO}?text=${encodeURIComponent(`Hola, necesito ayuda con mi cuenta de ${ESTUDIO.nombre}.`)}`
            : `tel:${ESTUDIO.telefonoLink}`
        }
        target={HAY_WHATSAPP ? "_blank" : undefined}
        rel="noreferrer"
        className={`${botonSecundario} mt-4 w-full`}
      >
        {HAY_WHATSAPP ? <MessageCircle size={16} /> : <Phone size={16} />}
        {HAY_WHATSAPP ? "Abrir WhatsApp" : `Llamar al ${ESTUDIO.telefono}`}
      </a>
    </section>
  );
}

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
    <form onSubmit={guardar} className={tarjeta}>
      <EncabezadoTarjeta
        icono={UserRound}
        titulo="Datos personales"
        detalle={
          esCliente
            ? "Así te ve el estudio al agendar tus citas."
            : "Tus datos de contacto dentro del sistema."
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo claseRaiz="" id="p-nombre" etiqueta="Nombre" value={form.nombre} onChange={cambia("nombre")} required />
        <Campo
          claseRaiz=""
          id="p-apellidos"
          etiqueta="Apellidos"
          value={form.apellidos}
          onChange={cambia("apellidos")}
          required
        />
        <Campo
          claseRaiz=""
          id="p-telefono"
          etiqueta="Teléfono"
          type="tel"
          icono={Phone}
          value={form.telefono}
          onChange={cambia("telefono")}
        />
        <Campo
          claseRaiz=""
          id="p-email"
          etiqueta="Correo (con el que inicias sesión)"
          type="email"
          icono={Mail}
          value={form.email}
          onChange={cambia("email")}
          required
        />
        {esCliente && (
          <>
            <Campo
              claseRaiz=""
              id="p-fecha"
              etiqueta="Fecha de nacimiento"
              type="date"
              icono={Cake}
              value={form.fecha_nacimiento}
              onChange={cambia("fecha_nacimiento")}
            />
            <p className="self-end pb-3 text-sm leading-relaxed">Es opcional y solo la ve el estudio.</p>
          </>
        )}
        {cambioCorreo && (
          <div className="sm:col-span-2">
            <Campo
              claseRaiz=""
              id="p-clave-correo"
              etiqueta="Contraseña actual (necesaria para cambiar el correo)"
              type="password"
              icono={Lock}
              autoComplete="current-password"
              value={form.password_actual}
              onChange={cambia("password_actual")}
            />
          </div>
        )}
      </div>

      <Mensaje mensaje={mensaje} />

      <div className="mt-6 flex flex-col gap-4 border-t border-amari-borde/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm">
          <ShieldCheck size={17} />{" "}
          {esCliente ? "Tus datos solo los ve el estudio." : "Tus datos solo los ve la administración."}
        </p>
        <button type="submit" disabled={guardando} className="btn-primario px-8 py-3">
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function FormClave({ alCambiar }) {
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cambia = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const fuerza = fuerzaClave(form.nueva);
  const coinciden = form.confirmar !== "" && form.nueva === form.confirmar;

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
    <form onSubmit={guardar} className={tarjeta}>
      <EncabezadoTarjeta
        icono={Lock}
        titulo="Seguridad"
        detalle="Cambia tu contraseña cuando quieras. Usa mínimo 8 caracteres."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Campo
          claseRaiz=""
          id="c-actual"
          etiqueta="Contraseña actual"
          type="password"
          autoComplete="current-password"
          value={form.actual}
          onChange={cambia("actual")}
          required
        />
        <div>
          <Campo
            claseRaiz=""
            id="c-nueva"
            etiqueta="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            value={form.nueva}
            onChange={cambia("nueva")}
            required
          />
          {fuerza > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${n <= fuerza ? FUERZA[fuerza].barra : "bg-amari-borde/70"}`}
                />
              ))}
              <span className="ml-1.5 whitespace-nowrap text-xs font-bold text-amari-primario-oscuro">
                {FUERZA[fuerza].texto}
              </span>
            </div>
          )}
        </div>
        <Campo
          claseRaiz=""
          id="c-confirmar"
          etiqueta="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={form.confirmar}
          onChange={cambia("confirmar")}
          required
        />
      </div>

      <Mensaje mensaje={mensaje} />

      <div className="mt-6 flex flex-col gap-4 border-t border-amari-borde/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`flex items-center gap-2 text-sm ${
            form.confirmar === "" ? "" : coinciden ? "text-green-700" : "text-amber-700"
          }`}
        >
          {form.confirmar === "" ? (
            <ShieldCheck size={17} />
          ) : coinciden ? (
            <CircleCheck size={17} />
          ) : (
            <CircleAlert size={17} />
          )}
          {form.confirmar === ""
            ? "Después de cambiarla, usa la nueva para iniciar sesión."
            : coinciden
              ? "Las contraseñas coinciden."
              : "Las contraseñas aún no coinciden."}
        </p>
        <button type="submit" disabled={guardando} className={botonSecundario}>
          {guardando ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </div>
    </form>
  );
}

function Configuracion() {
  const { usuario } = useAuth();
  const { recargarPerfil, debeCambiarClave } = useOutletContext();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [foto, setFoto] = useState(undefined); // undefined = usar la que viene del servidor

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

  const esCliente = usuario.rol === "cliente";

  return (
    <>
      <div className="mb-6 hidden md:block">
        <h1 className="font-display text-3xl font-semibold text-amari-titulo">Configuración</h1>
        <p className="mt-1 text-sm text-amari-acento">Tu perfil y la seguridad de tu cuenta</p>
      </div>

      {debeCambiarClave && (
        <div className="mb-6 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
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
        <div className="grid max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-[21rem_1fr]">
          <div className="space-y-6">
            <TarjetaPerfil
              datos={resultado.data}
              rol={usuario.rol}
              foto={foto !== undefined ? foto : resultado.data.foto}
              alCambiarFoto={setFoto}
              recargarPerfil={recargarPerfil}
            />
            {esCliente && (
              <div className="hidden lg:block">
                <TarjetaAyuda />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <FormDatos
              key={version}
              inicial={resultado.data}
              esCliente={esCliente}
              alGuardar={datosGuardados}
            />
            <FormClave alCambiar={recargarPerfil} />
            {esCliente && (
              <div className="lg:hidden">
                <TarjetaAyuda />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Configuracion;