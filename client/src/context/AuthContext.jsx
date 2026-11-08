import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { iniciarSesion, registrar, obtenerPerfil } from "../services/auth.service";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(localStorage.getItem("token")));

  // Al abrir la app, si hay un token guardado, se valida con el servidor
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    obtenerPerfil()
      .then(setUsuario)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setCargando(false));
  }, []);

  const login = async (credenciales) => {
    const data = await iniciarSesion(credenciales);
    localStorage.setItem("token", data.token);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const registro = async (datos) => {
    const data = await registrar(datos);
    localStorage.setItem("token", data.token);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}