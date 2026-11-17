import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{7,20}$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

class ErrorPerfil extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

const texto = (v) => (typeof v === "string" ? v.trim() : "");

export const obtenerPerfilCompleto = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.telefono, u.rol,
              DATE_FORMAT(c.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento
       FROM usuarios u
       LEFT JOIN clientes c ON c.usuario_id = u.id
       WHERE u.id = ?`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error("Error al obtener el perfil:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener el perfil" });
  }
};

export const actualizarPerfil = async (req, res) => {
  const d = req.body ?? {};
  const nombre = texto(d.nombre);
  const apellidos = texto(d.apellidos);
  const email = texto(d.email).toLowerCase();
  const telefono = texto(d.telefono);
  const fecha = texto(d.fecha_nacimiento);
  const passwordActual = typeof d.password_actual === "string" ? d.password_actual : "";
  const esCliente = req.usuario.rol === "cliente";

  if (nombre.length < 2 || nombre.length > 80) {
    return res.status(400).json({ ok: false, mensaje: "El nombre debe tener entre 2 y 80 caracteres" });
  }
  if (apellidos.length < 2 || apellidos.length > 100) {
    return res.status(400).json({ ok: false, mensaje: "El apellido debe tener entre 2 y 100 caracteres" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ ok: false, mensaje: "El correo no es válido" });
  }
  if (telefono && !TELEFONO_REGEX.test(telefono)) {
    return res.status(400).json({ ok: false, mensaje: "El teléfono no es válido" });
  }
  if (esCliente && fecha) {
    const valida = FECHA_REGEX.test(fecha) && !Number.isNaN(new Date(fecha).getTime());
    if (!valida || fecha > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ ok: false, mensaje: "La fecha de nacimiento no es válida" });
    }
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [[actual]] = await conexion.query(
      "SELECT email, password_hash FROM usuarios WHERE id = ? FOR UPDATE",
      [req.usuario.id]
    );

    if (email !== actual.email) {
      const correcta = passwordActual && (await bcrypt.compare(passwordActual, actual.password_hash));
      if (!correcta) {
        throw new ErrorPerfil("Para cambiar tu correo escribe tu contraseña actual");
      }

      const [enUsuarios] = await conexion.query(
        "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
        [email, req.usuario.id]
      );
      const [enClientes] = await conexion.query(
        "SELECT id FROM clientes WHERE email = ? AND (usuario_id IS NULL OR usuario_id <> ?)",
        [email, req.usuario.id]
      );
      if (enUsuarios.length > 0 || enClientes.length > 0) {
        throw new ErrorPerfil("Ese correo ya está registrado", 409);
      }
    }

    await conexion.query(
      "UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ? WHERE id = ?",
      [nombre, apellidos, email, telefono || null, req.usuario.id]
    );

    if (esCliente) {
      await conexion.query(
        `UPDATE clientes
         SET nombre = ?, apellidos = ?, email = ?, telefono = ?, fecha_nacimiento = ?
         WHERE usuario_id = ?`,
        [nombre, apellidos, email, telefono || null, fecha || null, req.usuario.id]
      );
    }

    await conexion.commit();
    res.json({ ok: true });
  } catch (err) {
    await conexion.rollback();

    if (err instanceof ErrorPerfil) {
      return res.status(err.estado).json({ ok: false, mensaje: err.message });
    }
    console.error("Error al actualizar el perfil:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar el perfil" });
  } finally {
    conexion.release();
  }
};

export const cambiarClave = async (req, res) => {
  const { actual, nueva } = req.body ?? {};

  if (typeof actual !== "string" || typeof nueva !== "string" || !actual || !nueva) {
    return res.status(400).json({ ok: false, mensaje: "Escribe tu contraseña actual y la nueva" });
  }
  if (nueva.length < 8 || nueva.length > 72) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "La contraseña nueva debe tener entre 8 y 72 caracteres" });
  }
  if (nueva === actual) {
    return res.status(400).json({ ok: false, mensaje: "La contraseña nueva debe ser distinta a la actual" });
  }

  try {
    const [rows] = await pool.query("SELECT password_hash FROM usuarios WHERE id = ?", [req.usuario.id]);

    // Se responde 400 (no 401) para que el interceptor del cliente no cierre la sesión
    if (rows.length === 0 || !(await bcrypt.compare(actual, rows[0].password_hash))) {
      return res.status(400).json({ ok: false, mensaje: "La contraseña actual no es correcta" });
    }

    const hash = await bcrypt.hash(nueva, 10);
    await pool.query("UPDATE usuarios SET password_hash = ?, debe_cambiar_clave = FALSE WHERE id = ?", [
      hash,
      req.usuario.id,
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al cambiar la contraseña:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cambiar la contraseña" });
  }
};