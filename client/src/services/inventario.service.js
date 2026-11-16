import api from "./api";

export const getInsumos = async () => {
  const { data } = await api.get("/inventario");
  return data.data;
};

export const crearInsumo = async (datos) => {
  const { data } = await api.post("/inventario", datos);
  return data.data;
};

export const actualizarInsumo = async (id, datos) => {
  const { data } = await api.put(`/inventario/${id}`, datos);
  return data.data;
};

export const registrarMovimiento = async (id, datos) => {
  const { data } = await api.post(`/inventario/${id}/movimientos`, datos);
  return data.data;
};