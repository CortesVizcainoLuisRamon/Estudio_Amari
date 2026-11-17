import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  Package,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  Bell,
  ShoppingCart,
} from "lucide-react";

export const MENUS = {
  admin: [
    { to: "/admin", texto: "Dashboard", icono: LayoutDashboard, end: true },
    { to: "/admin/citas", texto: "Mis Citas", icono: CalendarDays },
    { to: "/admin/clientes", texto: "Clientes", icono: Users },
    { to: "/admin/servicios", texto: "Servicios", icono: Scissors },
    { to: "/admin/empleados", texto: "Empleadas", icono: UserCog },
    { to: "/admin/inventario", texto: "Inventario", icono: Package },
    { to: "/admin/boutique", texto: "Boutique", icono: ShoppingBag },
    { to: "/admin/pedidos", texto: "Pedidos", icono: ClipboardList },
    { to: "/admin/ventas", texto: "Ventas", icono: BarChart3 },
    { to: "/admin/notificaciones", texto: "Notificaciones", icono: Bell },
  ],
  empleado: [
    { to: "/empleado", texto: "Dashboard", icono: LayoutDashboard, end: true },
    { to: "/empleado/citas", texto: "Mis Citas", icono: CalendarDays },
    { to: "/empleado/clientes", texto: "Clientes", icono: Users },
    { to: "/empleado/servicios", texto: "Servicios", icono: Scissors },
    { to: "/empleado/inventario", texto: "Inventario", icono: Package },
  ],
  cliente: [
    { to: "/cliente", texto: "Mis Citas", icono: CalendarDays, end: true },
    { to: "/cliente/boutique", texto: "Boutique", icono: ShoppingBag },
    { to: "/cliente/pedidos", texto: "Mis Pedidos", icono: ClipboardList },
    { to: "/cliente/notificaciones", texto: "Mis Notificaciones", icono: Bell },
    { to: "/cliente/carrito", texto: "Mi carrito", icono: ShoppingCart, insignia: "carrito" },
  ],
};