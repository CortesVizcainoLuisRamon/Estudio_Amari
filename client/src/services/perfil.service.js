import api from "./api";

export const getPerfilCompleto = async () => (await api.get("/perfil")).data.data;
export const actualizarPerfil = (datos) => api.put("/perfil", datos);
export const cambiarClave = (actual, nueva) => api.put("/perfil/clave", { actual, nueva });