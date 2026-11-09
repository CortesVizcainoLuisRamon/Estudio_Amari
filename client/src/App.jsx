import { Routes, Route } from "react-router-dom";
import RutaProtegida from "./routes/RutaProtegida";
import RedirigirInicio from "./routes/RedirigirInicio";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import Panel from "./pages/Panel";
import Proximamente from "./pages/Proximamente";
import AgendaAdmin from "./pages/admin/AgendaAdmin";
import ClientesAdmin from "./pages/admin/ClientesAdmin";
import ServiciosAdmin from "./pages/admin/ServiciosAdmin";
import EmpleadosAdmin from "./pages/admin/EmpleadosAdmin";
import MisCitas from "./pages/cliente/MisCitas";

const ROLES_SIMPLES = ["empleado"];

function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirigirInicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<Panel />} />
          <Route path="/admin/citas" element={<AgendaAdmin />} />
          <Route path="/admin/clientes" element={<ClientesAdmin />} />
          <Route path="/admin/servicios" element={<ServiciosAdmin />} />
          <Route path="/admin/empleados" element={<EmpleadosAdmin />} />
          <Route path="/admin/*" element={<Proximamente />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida roles={["cliente"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/cliente" element={<MisCitas />} />
          <Route path="/cliente/*" element={<Proximamente />} />
        </Route>
      </Route>

      {ROLES_SIMPLES.map((rol) => (
        <Route key={rol} element={<RutaProtegida roles={[rol]} />}>
          <Route element={<AppLayout />}>
            <Route path={`/${rol}`} element={<Panel />} />
            <Route path={`/${rol}/*`} element={<Proximamente />} />
          </Route>
        </Route>
      ))}

      <Route path="*" element={<p className="p-8 text-center">Página no encontrada</p>} />
    </Routes>
  );
}

export default App;