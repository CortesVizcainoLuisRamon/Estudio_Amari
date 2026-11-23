import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));

// server/uploads (se crea sola al subir la primera foto)
export const RAIZ_SUBIDAS = path.resolve(aqui, "../../uploads");

// Se sirve bajo /api para que el proxy de Vite también la alcance
export const URL_SUBIDAS = "/api/uploads";