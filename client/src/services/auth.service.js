import api from "./api";

export const registrar = async (datos) => {
  const { data } = await api.post("/auth/registro", datos);
  return data;
};

export const iniciarSesion = async (credenciales) => {
  const { data } = await api.post("/auth/login", credenciales);
  return data;
};

export const obtenerPerfil = async () => {
  const { data } = await api.get("/auth/me");
  return data.usuario;
};