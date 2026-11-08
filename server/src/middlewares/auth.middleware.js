import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const encabezado = req.headers.authorization || "";
  const [tipo, token] = encabezado.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, mensaje: "Se requiere iniciar sesión" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, rol: payload.rol };
    next();
  } catch {
    res.status(401).json({ ok: false, mensaje: "Sesión inválida o expirada" });
  }
};

export const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ ok: false, mensaje: "No tienes permiso para esta acción" });
  }
  next();
};