import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function RutaProtegida({ roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="p-8 text-center text-pink-700">Cargando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RutaProtegida;