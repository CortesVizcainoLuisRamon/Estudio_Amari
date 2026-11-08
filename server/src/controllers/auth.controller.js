import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const crearToken = (usuario) =>
  jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const datosPublicos = (u) => ({
  id: u.id,
  nombre: u.nombre,
  apellidos: u.apellidos,
  email: u.email,
  telefono: u.telefono,
  rol: u.rol,
});

export const registro = async (req, res) => {
  const { nombre, apellidos, email, telefono, password } = req.body ?? {};

  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof apellidos !== "string" || !apellidos.trim() ||
    typeof email !== "string" || typeof password !== "string"
  ) {
    return res.status(400).json({ ok: false, mensaje: "Faltan datos obligatorios" });
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ ok: false, mensaje: "El correo no es válido" });
  }

  if (password.length < 8 || password.length > 72) {
    return res
      .status(400)
      .json({ ok: false, mensaje: "La contraseña debe tener entre 8 y 72 caracteres" });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const passwordHash = await bcrypt.hash(password, 10);

    const [resultado] = await conexion.query(
      `INSERT INTO usuarios (nombre, apellidos, email, telefono, password_hash, rol)
       VALUES (?, ?, ?, ?, ?, 'cliente')`,
      [nombre.trim(), apellidos.trim(), emailNormalizado, telefono || null, passwordHash]
    );

    await conexion.query(
      `INSERT INTO clientes (usuario_id, nombre, apellidos, telefono, email)
       VALUES (?, ?, ?, ?, ?)`,
      [resultado.insertId, nombre.trim(), apellidos.trim(), telefono || null, emailNormalizado]
    );

    await conexion.commit();

    const usuario = {
      id: resultado.insertId,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: emailNormalizado,
      telefono: telefono || null,
      rol: "cliente",
    };

    res.status(201).json({ ok: true, token: crearToken(usuario), usuario });
  } catch (error) {
    await conexion.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, mensaje: "Ese correo ya está registrado" });
    }

    console.error("Error en registro:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al registrar el usuario" });
  } finally {
    conexion.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ ok: false, mensaje: "Correo y contraseña son obligatorios" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellidos, email, telefono, password_hash, rol, activo
       FROM usuarios WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const usuario = rows[0];
    const coincide = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;

    if (!usuario || !coincide || !usuario.activo) {
      return res.status(401).json({ ok: false, mensaje: "Correo o contraseña incorrectos" });
    }

    res.json({ ok: true, token: crearToken(usuario), usuario: datosPublicos(usuario) });
  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al iniciar sesión" });
  }
};

export const perfil = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellidos, email, telefono, rol
       FROM usuarios WHERE id = ? AND activo = TRUE`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    res.json({ ok: true, usuario: rows[0] });
  } catch (error) {
    console.error("Error al obtener el perfil:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener el perfil" });
  }
};