import api from "./api";

export const getServicios = async () => {
  const { data } = await api.get("/servicios");
  return data.data;
};