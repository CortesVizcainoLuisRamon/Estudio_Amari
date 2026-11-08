import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { rutaPorRol } from "./rutaPorRol";

function RedirigirInicio() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="p-8 text-center text-amari-primario">Cargando...</p>;
  }

  return <Navigate to={usuario ? rutaPorRol(usuario.rol) : "/login"} replace />;
}

export default RedirigirInicio;