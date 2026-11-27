import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));

// server/uploads (se crea sola al subir la primera foto)
export const RAIZ_SUBIDAS = path.resolve(aqui, "../../uploads");

// Se sirve bajo /api para que el proxy de Vite también la alcance
export const URL_SUBIDAS = "/api/uploads";

// Con CLOUDINARY_URL las fotos viven en Cloudinary (necesario en Render, donde el disco se borra
// en cada reinicio). Sin esa variable se guardan en server/uploads, como en desarrollo.
// Se lee al momento de usarse, no al importar, para no depender del orden en que carga dotenv.
export const usaCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

export const CARPETA_CLOUDINARY = "estudio-amari";
