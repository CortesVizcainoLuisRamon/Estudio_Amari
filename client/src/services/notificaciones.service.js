import api from "./api";

export const getNotificaciones = async () => (await api.get("/notificaciones")).data.data;
export const crearPromocion = async (mensaje) =>
  (await api.post("/notificaciones/promocion", { mensaje })).data.data;
export const marcarEnviada = (id) => api.patch(`/notificaciones/${id}/enviada`);
export const descartarNotificacion = (id) => api.delete(`/notificaciones/${id}`);

export const getMisNotificaciones = async () => (await api.get("/notificaciones/mias")).data.data;
export const marcarLeida = (id) => api.patch(`/notificaciones/mias/${id}/leida`);
export const marcarTodasLeidas = () => api.patch("/notificaciones/mias/leidas");