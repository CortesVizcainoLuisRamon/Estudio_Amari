import { Routes, Route } from "react-router-dom";
import RutaProtegida from "./routes/RutaProtegida";
import RedirigirInicio from "./routes/RedirigirInicio";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import Proximamente from "./pages/Proximamente";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AgendaAdmin from "./pages/admin/AgendaAdmin";
import ClientesAdmin from "./pages/admin/ClientesAdmin";
import ServiciosAdmin from "./pages/admin/ServiciosAdmin";
import EmpleadosAdmin from "./pages/admin/EmpleadosAdmin";
import InventarioAdmin from "./pages/admin/InventarioAdmin";
import BoutiqueAdmin from "./pages/admin/BoutiqueAdmin";
import PedidosAdmin from "./pages/admin/PedidosAdmin";
import VentasAdmin from "./pages/admin/VentasAdmin";
import NotificacionesAdmin from "./pages/admin/NotificacionesAdmin";
import DashboardEmpleada from "./pages/empleado/DashboardEmpleada";
import MisCitas from "./pages/cliente/MisCitas";
import BoutiqueCliente from "./pages/cliente/BoutiqueCliente";
import CarritoCliente from "./pages/cliente/CarritoCliente";
import MisPedidos from "./pages/cliente/MisPedidos";
import MisNotificaciones from "./pages/cliente/MisNotificaciones";
import Configuracion from "./pages/Configuracion";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirigirInicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/admin/citas" element={<AgendaAdmin />} />
          <Route path="/admin/clientes" element={<ClientesAdmin />} />
          <Route path="/admin/servicios" element={<ServiciosAdmin />} />
          <Route path="/admin/empleados" element={<EmpleadosAdmin />} />
          <Route path="/admin/inventario" element={<InventarioAdmin />} />
          <Route path="/admin/boutique" element={<BoutiqueAdmin />} />
          <Route path="/admin/pedidos" element={<PedidosAdmin />} />
          <Route path="/admin/ventas" element={<VentasAdmin />} />
          <Route path="/admin/notificaciones" element={<NotificacionesAdmin />} />
          <Route path="/admin/configuracion" element={<Configuracion />} />
          <Route path="/admin/*" element={<Proximamente />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida roles={["empleado"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/empleado" element={<DashboardEmpleada />} />
          <Route path="/empleado/citas" element={<AgendaAdmin />} />
          <Route path="/empleado/clientes" element={<ClientesAdmin />} />
          <Route path="/empleado/inventario" element={<InventarioAdmin />} />
          <Route path="/empleado/configuracion" element={<Configuracion />} />
          <Route path="/empleado/*" element={<Proximamente />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida roles={["cliente"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/cliente" element={<MisCitas />} />
          <Route path="/cliente/boutique" element={<BoutiqueCliente />} />
          <Route path="/cliente/carrito" element={<CarritoCliente />} />
          <Route path="/cliente/pedidos" element={<MisPedidos />} />
          <Route path="/cliente/notificaciones" element={<MisNotificaciones />} />
          <Route path="/cliente/configuracion" element={<Configuracion />} />
          <Route path="/cliente/*" element={<Proximamente />} />
        </Route>
      </Route>

      <Route path="*" element={<p className="p-8 text-center">Página no encontrada</p>} />
    </Routes>
  );
}

export default App;