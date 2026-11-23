import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import multer from "multer";
import sharp from "sharp";
import { pool } from "../config/db.js";
import { RAIZ_SUBIDAS, URL_SUBIDAS } from "../config/subidas.js";

const MAX_BYTES = 12 * 1024 * 1024;
const FORMATOS = ["jpeg", "png", "webp"];
const OPCIONES_SHARP = { limitInputPixels: 50_000_000 };

class ErrorImagen extends Error {}

const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single("imagen");

// multer con respuestas JSON en lugar de la página de error por defecto
export const recibirImagen = (req, res, next) => {
  subir(req, res, (err) => {
    if (!err) return next();
    const mensaje =
      err.code === "LIMIT_FILE_SIZE" ? "La imagen pesa más de 12 MB" : "No se pudo recibir la imagen";
    res.status(400).json({ ok: false, mensaje });
  });
};

// Valida que sea una imagen real, la endereza, la recorta y la guarda como WebP
const procesar = async (buffer, carpeta, ancho, alto) => {
  let meta;
  try {
    meta = await sharp(buffer, OPCIONES_SHARP).metadata();
  } catch {
    throw new ErrorImagen("El archivo no es una imagen válida");
  }
  if (!FORMATOS.includes(meta.format)) {
    throw new ErrorImagen("Usa una imagen JPG, PNG o WebP");
  }

  const nombre = `${randomUUID()}.webp`;
  const carpetaDisco = path.join(RAIZ_SUBIDAS, carpeta);
  await fs.mkdir(carpetaDisco, { recursive: true });

  await sharp(buffer, OPCIONES_SHARP)
    .rotate()
    .resize(ancho, alto, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toFile(path.join(carpetaDisco, nombre));

  return `${URL_SUBIDAS}/${carpeta}/${nombre}`;
};

const borrarArchivo = async (url, carpeta) => {
  if (typeof url !== "string" || !url.startsWith(`${URL_SUBIDAS}/${carpeta}/`)) return;
  // basename evita rutas con ../
  await fs.unlink(path.join(RAIZ_SUBIDAS, carpeta, path.basename(url))).catch(() => {});
};

const responderError = (res, err, mensajeGeneral) => {
  if (err instanceof ErrorImagen) {
    return res.status(400).json({ ok: false, mensaje: err.message });
  }
  console.error(`${mensajeGeneral}:`, err.message);
  res.status(500).json({ ok: false, mensaje: mensajeGeneral });
};

export const subirImagenProducto = async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, mensaje: "Elige una imagen" });

  try {
    const url = await procesar(req.file.buffer, "productos", 800, 600);
    res.status(201).json({ ok: true, data: { url } });
  } catch (err) {
    responderError(res, err, "Error al guardar la imagen");
  }
};

export const subirFotoPerfil = async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, mensaje: "Elige una imagen" });

  try {
    const url = await procesar(req.file.buffer, "perfiles", 320, 320);

    const [[anterior]] = await pool.query("SELECT foto FROM usuarios WHERE id = ?", [req.usuario.id]);
    await pool.query("UPDATE usuarios SET foto = ? WHERE id = ?", [url, req.usuario.id]);
    await borrarArchivo(anterior?.foto, "perfiles");

    res.status(201).json({ ok: true, data: { url } });
  } catch (err) {
    responderError(res, err, "Error al guardar la foto de perfil");
  }
};

export const quitarFotoPerfil = async (req, res) => {
  try {
    const [[anterior]] = await pool.query("SELECT foto FROM usuarios WHERE id = ?", [req.usuario.id]);
    await pool.query("UPDATE usuarios SET foto = NULL WHERE id = ?", [req.usuario.id]);
    await borrarArchivo(anterior?.foto, "perfiles");

    res.json({ ok: true });
  } catch (err) {
    responderError(res, err, "Error al quitar la foto de perfil");
  }
};