import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const verificarToken = async (req, res, next) => {
  const encabezado = req.headers.authorization || "";
  const [tipo, token] = encabezado.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, mensaje: "Se requiere iniciar sesión" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Sesión inválida o expirada" });
  }

  try {
    // Se vuelve a consultar al usuario: el token solo prueba quién era al iniciar sesión,
    // no que su cuenta siga activa ni que conserve el mismo rol.
    const [filas] = await pool.query(
      `SELECT u.*, e.activo AS empleada_activa
       FROM usuarios u
       LEFT JOIN empleados e ON e.usuario_id = u.id
       WHERE u.id = ?`,
      [payload.id]
    );

    const usuario = filas[0];

    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: "Sesión inválida o expirada" });
    }

    const cuentaInactiva = "activo" in usuario && !usuario.activo;
    const empleadaInactiva = usuario.rol === "empleado" && usuario.empleada_activa === 0;

    if (cuentaInactiva || empleadaInactiva) {
      return res.status(401).json({ ok: false, mensaje: "Tu cuenta está desactivada" });
    }

    // El rol se toma de la base de datos, no del token
    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  } catch (err) {
    console.error("Error al validar la sesión:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al validar la sesión" });
  }
};

export const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ ok: false, mensaje: "No tienes permiso para esta acción" });
  }
  next();
};