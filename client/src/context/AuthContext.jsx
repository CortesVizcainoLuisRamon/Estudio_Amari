import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { iniciarSesion, registrar, obtenerPerfil } from "../services/auth.service";
import { borrarToken, guardarToken, leerToken } from "../utils/sesion";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(leerToken()));

  // Al abrir la app, si hay un token guardado, se valida con el servidor
  useEffect(() => {
    if (!leerToken()) return;

    obtenerPerfil()
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  const login = async (credenciales, recordar = true) => {
    const data = await iniciarSesion(credenciales);
    guardarToken(data.token, recordar);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const registro = async (datos) => {
    const data = await registrar(datos);
    guardarToken(data.token, true);
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = () => {
    borrarToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}