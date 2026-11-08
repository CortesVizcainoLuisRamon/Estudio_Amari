const RUTAS = {
  admin: "/admin",
  empleado: "/empleado",
  cliente: "/cliente",
};

export const rutaPorRol = (rol) => RUTAS[rol] ?? "/";