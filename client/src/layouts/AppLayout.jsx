import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
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

  const menu = MENUS[usuario.rol] ?? [];
  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellidos[0] ?? ""}`.toUpperCase();

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-amari-bg">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-amari-borde bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="font-display text-lg italic text-amari-titulo">Amari</p>
            <p className="text-[10px] tracking-[0.2em] text-amari-acento">ESTUDIO DE BELLEZA</p>
          </div>
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
            <NavLink key={to} to={to} end={end} className={claseEnlace}>
              <Icono size={18} />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-amari-borde p-3">
          <NavLink to={`${rutaPorRol(usuario.rol)}/configuracion`} className={claseEnlace}>
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

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;