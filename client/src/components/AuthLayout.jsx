import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brush,
  Eye,
  Flower2,
  Hand,
  KeyRound,
  MapPin,
  PenLine,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react";
import logo from "../assets/branding/logo-amari-cuadrado.png";
import { ESTUDIO, estadoHoy, saludo } from "../config/estudio";

const SERVICIOS = [
  { nombre: "Nails", Icono: Hand },
  { nombre: "Hair", Icono: Scissors },
  { nombre: "Lashes", Icono: Eye },
  { nombre: "Eyebrows", Icono: PenLine },
  { nombre: "Make-up", Icono: Brush },
];

function AuthLayout({ titulo, subtitulo, activa, children }) {
  // Se refresca cada minuto para que el saludo y el "abierto/cerrado" no se queden viejos
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const estado = estadoHoy(ahora);

  const pestana = (nombre) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
      activa === nombre
        ? "bg-white text-amari-titulo shadow-md shadow-amari-primario/15 ring-1 ring-amari-borde [&>svg]:text-amari-primario"
        : "text-amari-primario/80 hover:text-amari-primario-oscuro"
    }`;

  return (
    <main className="flex min-h-screen flex-col md:grid md:grid-cols-2">
      {/* Panel rosa: encabezado en celular, mitad izquierda en laptop */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-amari-primario to-amari-primario-oscuro px-6 pb-16 pt-10 text-center text-white md:min-h-screen md:p-10">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 md:-left-24 md:-top-24 md:h-96 md:w-96" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 md:-bottom-36 md:-right-24 md:h-136 md:w-136" />
        <div className="absolute left-1/2 top-1/2 hidden h-160 w-160 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 md:block" />
        <div className="absolute -right-20 top-20 hidden h-72 w-72 rounded-full border border-white/15 md:block" />

        <Sparkles size={22} strokeWidth={1.6} className="absolute left-10 top-36 text-white/50 md:left-20 md:top-1/3" />
        <Sparkles size={14} strokeWidth={1.6} className="absolute right-10 top-20 text-white/40 md:right-28 md:top-1/2" />
        <Sparkles size={26} strokeWidth={1.6} className="absolute bottom-1/3 right-16 hidden text-white/50 md:block" />
        <Sparkles size={14} strokeWidth={1.6} className="absolute bottom-1/4 left-32 hidden text-white/35 md:block" />

        <div className="relative mt-6 flex h-28 w-28 items-center justify-center md:mt-0 md:h-44 md:w-44">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_45%,transparent_70%)] md:h-104 md:w-104" />
          <div className="absolute -inset-4 rounded-full border border-white/35 md:-inset-5" />
          <div className="absolute -inset-8 rounded-full border border-dashed border-white/25 md:-inset-11" />
          <img
            src={logo}
            alt="Estudio Amari"
            className="relative h-full w-full rounded-full border-4 border-white/70 object-cover shadow-xl"
          />
        </div>

        <div className="relative mt-8 hidden h-0.5 w-16 rounded-full bg-white/50 md:mb-7 md:mt-14 md:block" />
        <p className="relative mt-6 font-display text-xl italic leading-snug md:mt-0 md:text-3xl md:leading-snug">
          “Tu belleza es única,
          <br />
          merece atención especial.”
        </p>

        <ul className="relative mt-6 flex max-w-xs flex-wrap justify-center gap-2 md:mt-8 md:max-w-md md:gap-2.5">
          {SERVICIOS.map(({ nombre, Icono }) => (
            <li
              key={nombre}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm md:gap-2 md:px-4 md:py-2 md:text-xs md:tracking-[0.14em]"
            >
              <Icono size={13} className="md:h-[15px] md:w-[15px]" />
              {nombre}
            </li>
          ))}
        </ul>
      </section>

      {/* Formulario: hoja que sube sobre el rosa en celular */}
      <section className="relative -mt-8 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-t-[2rem] bg-amari-bg-soft px-5 pb-10 pt-8 md:mt-0 md:rounded-none md:px-6 md:py-10">
        <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-amari-acento/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-amari-acento/10 blur-3xl" />

        <div className="relative w-full max-w-lg">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amari-primario">
            <Sparkles size={14} />
            {saludo(ahora)}
          </p>
          <h1 className="mt-2 text-center font-display text-3xl font-semibold text-amari-titulo md:text-4xl">
            {titulo}
          </h1>
          <p className="mb-6 mt-1.5 text-center text-sm text-amari-acento md:text-base">{subtitulo}</p>

          <div className="mb-4 flex gap-1.5 rounded-2xl border border-amari-borde bg-white p-1.5">
            <Link to="/login" className={pestana("login")}>
              <KeyRound size={16} /> Iniciar sesión
            </Link>
            <Link to="/registro" className={pestana("registro")}>
              <Flower2 size={16} /> Registrarse
            </Link>
          </div>

          <div className="rounded-3xl border border-amari-borde bg-white p-5 shadow-xl shadow-amari-primario/10 sm:p-7">
            {children}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2.5 text-xs text-amari-primario md:flex-row md:flex-wrap md:justify-center md:gap-x-5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {ESTUDIO.direccion}
            </span>
            <a href={`tel:${ESTUDIO.telefonoLink}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone size={14} /> {ESTUDIO.telefono}
            </a>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${
                estado.abierto
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {estado.abierto && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    estado.abierto ? "bg-green-500" : "bg-rose-500"
                  }`}
                />
              </span>
              {estado.texto}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;