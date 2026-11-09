import api from "./api";

export const getClientes = async () => {
  const { data } = await api.get("/clientes");
  return data.data;
};

export const crearCliente = async (datos) => {
  const { data } = await api.post("/clientes", datos);
  return data.data;
};

export const actualizarCliente = async (id, datos) => {
  const { data } = await api.put(`/clientes/${id}`, datos);
  return data.data;
};