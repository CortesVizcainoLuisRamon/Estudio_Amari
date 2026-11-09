import api from "./api";

export const getCitas = async (desde, hasta) => {
  const { data } = await api.get("/citas", { params: { desde, hasta } });
  return data.data;
};

export const getDisponibilidad = async (fecha, serviciosIds) => {
  const { data } = await api.get("/citas/disponibilidad", {
    params: { fecha, servicios: serviciosIds.join(",") },
  });
  return data.data;
};

export const crearCita = async (datos) => {
  const { data } = await api.post("/citas", datos);
  return data.data;
};

export const cambiarEstado = async (id, estado) => {
  const { data } = await api.patch(`/citas/${id}/estado`, { estado });
  return data.data;
};

export const getMisCitas = async () => {
  const { data } = await api.get("/citas/mis-citas");
  return data.data;
};

export const cancelarMiCita = async (id) => {
  const { data } = await api.patch(`/citas/${id}/cancelar`);
  return data.data;
};