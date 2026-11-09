import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { MENUS } from "../config/menus";
import { rutaPorRol } from "../routes/rutaPorRol";
import logo from "../assets/branding/logo-amari-cuadrado.png";

const ETIQUETA_ROL = { admin: "Admin", empleado: "Empleado", cliente: "Cliente" };

const claseEnlace = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "text-amari-texto hover:bg-amari-bg-soft"
  }`;

function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const menu = MENUS[usuario.rol] ?? [];
  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellidos[0] ?? ""}`.toUpperCase();

  const cerrarMenu = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-amari-bg">
      {/* Fondo oscuro detrás del menú (solo celular) */}
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
          className="fixed inset-0 z-30 bg-amari-titulo/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-amari-borde bg-white transition-transform duration-200 lg:sticky lg:inset-y-auto lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex-1 leading-tight">
            <p className="font-display text-lg italic text-amari-titulo">Amari</p>
            <p className="text-[10px] tracking-[0.2em] text-amari-acento">ESTUDIO DE BELLEZA</p>
          </div>
          <button
            type="button"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
            className="text-amari-acento hover:text-amari-primario-oscuro lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-3 mb-3 flex items-center gap-3 border-y border-amari-borde px-1 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amari-primario text-xs font-bold text-white">
            {iniciales}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-amari-titulo">
              {usuario.nombre} {usuario.apellidos}
            </p>
            <p className="text-xs text-amari-acento">{ETIQUETA_ROL[usuario.rol]}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {menu.map(({ to, texto, icono: Icono, end }) => (
            <NavLink key={to} to={to} end={end} onClick={cerrarMenu} className={claseEnlace}>
              <Icono size={18} />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-amari-borde p-3">
          <NavLink
            to={`${rutaPorRol(usuario.rol)}/configuracion`}
            onClick={cerrarMenu}
            className={claseEnlace}
          >
            <Settings size={18} />
            Configuración
          </NavLink>
          <button
            onClick={salir}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-amari-acento transition hover:bg-amari-bg-soft"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior (solo celular) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-amari-borde bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-amari-primario hover:bg-amari-bg-soft"
          >
            <Menu size={22} />
          </button>
          <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />
          <p className="font-display text-lg italic text-amari-titulo">Amari</p>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;