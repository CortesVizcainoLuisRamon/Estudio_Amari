import api from "./api";

export const getDashboard = async () => {
  const { data } = await api.get("/dashboard");
  return data.data;
};

export const getDashboardEmpleada = async () => {
  const { data } = await api.get("/dashboard/empleada");
  return data.data;
};