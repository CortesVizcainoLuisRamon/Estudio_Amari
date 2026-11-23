import { randomInt } from "node:crypto";

// Sin caracteres que se confunden al leerlos (0/O, 1/l/I)
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export const generarClaveTemporal = (largo = 10) =>
  Array.from({ length: largo }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");