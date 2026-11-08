import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { rutaPorRol } from "../routes/rutaPorRol";
import logo from "../assets/branding/logo-amari-cuadrado.png";

function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex h-16 items-center justify-between border-b border-amari-borde bg-white px-6">
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
        <span className="font-display text-xl italic text-amari-titulo">Amari</span>
        <span className="hidden text-[10px] tracking-[0.2em] text-amari-acento sm:inline">
          ESTUDIO DE BELLEZA
        </span>
      </Link>

      <div className="flex items-center gap-4 text-sm">
        {usuario ? (
          <>
            <Link
              to={rutaPorRol(usuario.rol)}
              className="font-medium text-amari-texto hover:text-amari-primario"
            >
              Hola, {usuario.nombre}
            </Link>
            <button onClick={salir} className="btn-primario">
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="font-medium text-amari-texto hover:text-amari-primario">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="btn-primario">
              Registrarme
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;