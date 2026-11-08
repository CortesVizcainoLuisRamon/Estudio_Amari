import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import RutaProtegida from "./routes/RutaProtegida";
import Servicios from "./pages/Servicios";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import Panel from "./pages/Panel";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Servicios />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route element={<RutaProtegida roles={["admin"]} />}>
          <Route path="/admin" element={<Panel titulo="Panel del administrador" />} />
        </Route>

        <Route element={<RutaProtegida roles={["empleado"]} />}>
          <Route path="/empleado" element={<Panel titulo="Panel del empleado" />} />
        </Route>

        <Route element={<RutaProtegida roles={["cliente"]} />}>
          <Route path="/cliente" element={<Panel titulo="Mi cuenta" />} />
        </Route>

        <Route path="*" element={<p className="p-8 text-center">Página no encontrada</p>} />
      </Routes>
    </>
  );
}

export default App;