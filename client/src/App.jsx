import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import RutaProtegida from "./routes/RutaProtegida";
import AppLayout from "./layouts/AppLayout";
import Servicios from "./pages/Servicios";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import Panel from "./pages/Panel";
import Proximamente from "./pages/Proximamente";

const ROLES = ["admin", "empleado", "cliente"];

function LayoutPublico() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route path="/" element={<Servicios />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {ROLES.map((rol) => (
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