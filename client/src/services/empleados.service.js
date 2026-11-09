import api from "./api";

export const getEmpleados = async () => {
  const { data } = await api.get("/empleados");
  return data.data;
};

export const crearEmpleado = async (datos) => {
  const { data } = await api.post("/empleados", datos);
  return data.data;
};

export const actualizarEmpleado = async (id, datos) => {
  const { data } = await api.put(`/empleados/${id}`, datos);
  return data.data;
};