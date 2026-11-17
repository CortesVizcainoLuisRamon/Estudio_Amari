import api from "./api";

export const crearPedido = async (datos) => {
  const { data } = await api.post("/pedidos", datos);
  return data.data;
};

export const getMisPedidos = async () => {
  const { data } = await api.get("/pedidos/mis-pedidos");
  return data.data;
};

export const cancelarMiPedido = async (id) => {
  const { data } = await api.patch(`/pedidos/${id}/cancelar`);
  return data.data;
};

export const getPedidos = async (estado) => {
  const { data } = await api.get("/pedidos", { params: estado ? { estado } : {} });
  return data.data;
};

export const cambiarEstadoPedido = async (id, estado) => {
  const { data } = await api.patch(`/pedidos/${id}/estado`, { estado });
  return data.data;
};