import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { MENUS } from "../config/menus";
import { rutaPorRol } from "../routes/rutaPorRol";
import logo from "../assets/branding/logo-amari-cuadrado.png";
import { useCarrito } from "../hooks/useCarrito";
import { obtenerPerfil } from "../services/auth.service";
import { getContadorNotificaciones } from "../services/notificaciones.service";
import NavInferior from "../components/NavInferior";

const ETIQUETA_ROL = { admin: "Admin", empleado: "Empleado", cliente: "Cliente" };
const RUTA_NOTIFICACIONES_CLIENTE = "/cliente/notificaciones";

const claseEnlace = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-linear-to-r from-amari-primario to-amari-primario-oscuro text-white shadow-md shadow-amari-primario/30"
      : "text-amari-texto hover:bg-amari-bg-soft"
  }`;

function AppLayout() {
  const { usuario, logout } = useAuth();
  const { cantidad: enCarrito } = useCarrito();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [version, setVersion] = useState(0);
  const [noLeidas, setNoLeidas] = useState(0);
  const [versionContador, setVersionContador] = useState(0);

  const esCliente = usuario.rol === "cliente";
  const menu = MENUS[usuario.rol] ?? [];
  const nombre = perfil?.nombre ?? usuario.nombre;
  const apellidos = perfil?.apellidos ?? usuario.apellidos;
  const iniciales = `${nombre[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
  const rutaConfiguracion = `${rutaPorRol(usuario.rol)}/configuracion`;

  // Barra de abajo (celular, solo clienta): los primeros 5 accesos del menú, con sus avisos
  const accesosInferiores = menu.slice(0, 5).map((m) => ({
    ...m,
    cuenta:
      m.insignia === "carrito" ? enCarrito : m.to === RUTA_NOTIFICACIONES_CLIENTE ? noLeidas : 0,
  }));

  const cerrarMenu = () => setAbierto(false);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  // Perfil fresco desde el servidor: nombre, foto y aviso de contraseña temporal
  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((p) => {
        if (activo) setPerfil(p);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [version]);

  // Avisos sin leer de la clienta: al navegar, cada minuto y cuando se marcan como leídos
  useEffect(() => {
    if (!esCliente) return;
    let activo = true;

    const cargar = () =>
      getContadorNotificaciones()
        .then((total) => {
          if (activo) setNoLeidas(total);
        })
        .catch(() => {});

    cargar();
    const temporizador = setInterval(cargar, 60000);

    return () => {
      activo = false;
      clearInterval(temporizador);
    };
  }, [esCliente, pathname, versionContador]);

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Con contraseña temporal, solo se puede estar en Configuración
  if (perfil?.debe_cambiar_clave && pathname !== rutaConfiguracion) {
    return <Navigate to={rutaConfiguracion} replace />;
  }

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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amari-primario text-xs font-bold text-white">
            {perfil?.foto ? (
              <img src={perfil.foto} alt="" className="h-full w-full object-cover" />
            ) : (
              iniciales
            )}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="line-clamp-2 break-words text-sm font-semibold text-amari-titulo">
              {nombre} {apellidos}
            </p>
            <p className="text-xs text-amari-acento">{ETIQUETA_ROL[usuario.rol]}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {menu.map(({ to, texto, icono: Icono, end, insignia }) => {
            const cuenta =
              insignia === "carrito"
                ? enCarrito
                : esCliente && to === RUTA_NOTIFICACIONES_CLIENTE
                  ? noLeidas
                  : 0;

            return (
              <NavLink key={to} to={to} end={end} onClick={cerrarMenu} className={claseEnlace}>
                <Icono size={18} />
                {texto}
                {cuenta > 0 && (
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amari-primario ring-1 ring-amari-primario/30">
                    {cuenta > 9 ? "9+" : cuenta}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-amari-borde p-3">
          <NavLink to={rutaConfiguracion} onClick={cerrarMenu} className={claseEnlace}>
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
          <Outlet
            context={{
              recargarPerfil: () => setVersion((v) => v + 1),
              recargarContador: () => setVersionContador((v) => v + 1),
              debeCambiarClave: Boolean(perfil?.debe_cambiar_clave),
              noLeidas,
            }}
          />
          {/* Deja libre el espacio de la barra de abajo en celular */}
          {esCliente && <div aria-hidden className="h-20 lg:hidden" />}
        </main>
      </div>

      {esCliente && <NavInferior items={accesosInferiores} />}
    </div>
  );
}

export default AppLayout;