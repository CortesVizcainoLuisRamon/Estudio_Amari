import { Link } from "react-router-dom";
import { KeyRound, Flower2 } from "lucide-react";
import logo from "../assets/branding/logo-amari-cuadrado.png";

function AuthLayout({ titulo, subtitulo, activa, children }) {
  const pestana = (nombre) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${
      activa === nombre
        ? "bg-white text-amari-primario-oscuro shadow-sm"
        : "text-amari-primario/80 hover:text-amari-primario-oscuro"
    }`;

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden flex-col items-center justify-center overflow-hidden bg-linear-to-br from-amari-primario to-amari-primario-oscuro p-10 text-center text-white md:flex">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-black/10" />
        <img
          src={logo}
          alt="Estudio Amari"
          className="relative h-44 w-44 rounded-full border-4 border-white/70 object-cover shadow-xl"
        />
        <div className="relative my-6 h-px w-16 bg-white/50" />
        <p className="relative font-display text-2xl italic leading-snug">
          “Tu belleza es única,
          <br />
          merece atención especial.”
        </p>
        <p className="relative mt-6 text-xs tracking-[0.25em] text-white/80">
          NAILS · HAIR · LASHES
        </p>
      </section>

      <section className="flex flex-col items-center justify-center bg-amari-bg-soft px-6 py-10">
        <div className="w-full max-w-md">
          <img
            src={logo}
            alt="Estudio Amari"
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover md:hidden"
          />
          <h1 className="text-center font-display text-3xl font-semibold text-amari-titulo">
            {titulo}
          </h1>
          <p className="mb-6 mt-1 text-center text-sm text-amari-acento">{subtitulo}</p>

          <div className="mb-4 flex gap-1 rounded-2xl border border-amari-borde bg-amari-bg-soft p-1">
            <Link to="/login" className={pestana("login")}>
              <KeyRound size={16} /> Iniciar sesión
            </Link>
            <Link to="/registro" className={pestana("registro")}>
              <Flower2 size={16} /> Registrarse
            </Link>
          </div>

          <div className="tarjeta p-6">{children}</div>

          <p className="mt-6 text-center text-xs text-amari-acento">
            Estudio Amari · Av. Ticomán 839, Col. Ticomán · (55) 8252-4200
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;