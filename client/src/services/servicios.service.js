import api from "./api";

export const getServicios = async () => {
  const { data } = await api.get("/servicios");
  return data.data;
};

export const getServiciosGestion = async () => {
  const { data } = await api.get("/servicios/gestion");
  return data.data;
};

export const getCategorias = async () => {
  const { data } = await api.get("/servicios/categorias");
  return data.data;
};

export const crearServicio = async (datos) => {
  const { data } = await api.post("/servicios", datos);
  return data.data;
};

export const actualizarServicio = async (id, datos) => {
  const { data } = await api.put(`/servicios/${id}`, datos);
  return data.data;
};