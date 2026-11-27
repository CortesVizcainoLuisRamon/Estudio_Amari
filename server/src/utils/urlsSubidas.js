import { URL_SUBIDAS, CARPETA_CLOUDINARY, usaCloudinary } from "../config/subidas.js";
import { nombreDeNube } from "../config/cloudinary.js";

const UUID = "[0-9a-f-]{36}";

// ¿Esta URL la generó nuestra propia subida de fotos? (evita aceptar cualquier enlace como foto)
export const esSubidaPropia = (url, carpeta) => {
  if (typeof url !== "string") return false;

  if (new RegExp(`^${URL_SUBIDAS}/${carpeta}/${UUID}\\.webp$`, "i").test(url)) return true;

  if (!usaCloudinary()) return false;
  const base = `https://res\\.cloudinary\\.com/${nombreDeNube()}/image/upload/(?:v\\d+/)?`;
  return new RegExp(`^${base}${CARPETA_CLOUDINARY}/${carpeta}/${UUID}\\.webp$`, "i").test(url);
};

// De la URL de Cloudinary saca el identificador con el que se borra la imagen
export const idPublicoNube = (url, carpeta) => {
  if (!usaCloudinary() || !esSubidaPropia(url, carpeta) || url.startsWith(URL_SUBIDAS)) return null;
  const m = url.match(new RegExp(`/(${CARPETA_CLOUDINARY}/${carpeta}/${UUID})\\.webp$`, "i"));
  return m ? m[1] : null;
};
