import axios from "axios";
import { leerToken } from "../utils/sesion";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;