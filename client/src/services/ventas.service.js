import api from "./api";

export const getVentas = async (desde, hasta) => {
  const { data } = await api.get("/ventas", { params: { desde, hasta } });
  return data.data;
};