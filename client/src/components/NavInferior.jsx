import { NavLink } from "react-router-dom";

// Nombres cortos para que quepan en la barra de abajo
const ETIQUETAS_CORTAS = {
  "/cliente": "Citas",
  "/cliente/boutique": "Boutique",
  "/cliente/pedidos": "Pedidos",
  "/cliente/notificaciones": "Avisos",
  "/cliente/carrito": "Carrito",
};

// Barra de navegación fija abajo (solo celular). `items` = [{ to, texto, icono, end, cuenta }]
function NavInferior({ items }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-amari-borde bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px] shadow-amari-primario/20 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch px-2 py-1.5">
        {items.map(({ to, texto, icono: Icono, end, cuenta }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition ${
                  isActive ? "text-amari-primario-oscuro" : "text-amari-texto"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative flex h-8 w-14 items-center justify-center rounded-full transition ${
                      isActive ? "bg-pink-100" : ""
                    }`}
                  >
                    <Icono size={20} />
                    {cuenta > 0 && (
                      <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amari-primario px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {cuenta > 9 ? "9+" : cuenta}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{ETIQUETAS_CORTAS[to] ?? texto}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavInferior;
