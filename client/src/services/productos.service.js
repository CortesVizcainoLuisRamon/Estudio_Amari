import api from "./api";

export const getProductosGestion = async () => {
  const { data } = await api.get("/productos/gestion");
  return data.data;
};

export const crearProducto = async (datos) => {
  const { data } = await api.post("/productos", datos);
  return data.data;
};

export const actualizarProducto = async (id, datos) => {
  const { data } = await api.put(`/productos/${id}`, datos);
  return data.data;
};

export const getCatalogo = async () => {
  const { data } = await api.get("/productos");
  return data.data;
};