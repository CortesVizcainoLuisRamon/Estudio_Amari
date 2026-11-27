import { v2 as cloudinary } from "cloudinary";

let configurado = false;

// CLOUDINARY_URL tiene la forma cloudinary://API_KEY:API_SECRET@CLOUD_NAME
const leerCredenciales = () => {
  const url = new URL(process.env.CLOUDINARY_URL);
  return {
    cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password),
    secure: true,
  };
};

export const obtenerCloudinary = () => {
  if (!configurado) {
    cloudinary.config(leerCredenciales());
    configurado = true;
  }
  return cloudinary;
};

export const nombreDeNube = () => leerCredenciales().cloud_name;
