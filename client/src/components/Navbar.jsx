import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { rutaPorRol } from "../routes/rutaPorRol";

function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex h-16 items-center justify-between bg-white px-6 shadow">
      <Link to="/" className="text-xl font-bold text-pink-700">Estudio Amari</Link>

      <div className="flex items-center gap-4 text-sm">
        {usuario ? (
          <>
            <Link to={rutaPorRol(usuario.rol)} className="text-gray-700 hover:text-pink-700">
              Hola, {usuario.nombre}
            </Link>
            <button onClick={salir} className="rounded bg-pink-600 px-3 py-1.5 text-white hover:bg-pink-700">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-pink-700">Iniciar sesión</Link>
            <Link to="/registro" className="rounded bg-pink-600 px-3 py-1.5 text-white hover:bg-pink-700">
              Registrarme
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;