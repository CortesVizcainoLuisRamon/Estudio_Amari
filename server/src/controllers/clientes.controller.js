import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { generarClaveTemporal } from "../utils/claves.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{7,20}$/;
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const SELECT_CLIENTES = `
  SELECT c.id, c.usuario_id, c.nombre, c.apellidos, c.telefono, c.email, c.notas,
         DATE_FORMAT(c.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
         COUNT(ci.id) AS visitas
  FROM clientes c
  LEFT JOIN citas ci ON ci.cliente_id = c.id AND ci.estado = 'completada'
`;

class ErrorCliente extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

const formatear = (c) => ({
  ...c,
  visitas: Number(c.visitas),
  tiene_acceso: c.usuario_id != null,
});

const validarCliente = (body) => {
  const d = body ?? {};
  const texto = (v) => (typeof v === "string" ? v.trim() : "");

  const nombre = texto(d.nombre);
  const apellidos = texto(d.apellidos);
  const email = texto(d.email).toLowerCase();
  const telefono = texto(d.telefono);
  const fecha = texto(d.fecha_nacimiento);

  if (nombre.length < 2 || nombre.length > 80) {
    return { error: "El nombre debe tener entre 2 y 80 caracteres" };
  }
  if (apellidos.length < 2 || apellidos.length > 100) {
    return { error: "El apellido debe tener entre 2 y 100 caracteres" };
  }
  if (email && !EMAIL_REGEX.test(email)) return { error: "El correo no es válido" };
  if (telefono && !TELEFONO_REGEX.test(telefono)) return { error: "El teléfono no es válido" };

  if (fecha) {
    const valida = FECHA_REGEX.test(fecha) && !Number.isNaN(new Date(fecha).getTime());
    if (!valida || fecha > new Date().toISOString().slice(0, 10)) {
      return { error: "La fecha de nacimiento no es válida" };
    }
  }

  return {
    datos: {
      nombre,
      apellidos,
      email: email || null,
      telefono: telefono || null,
      fecha_nacimiento: fecha || null,
    },
  };
};

// El correo no puede estar en otro cliente ni en otro usuario
const correoRepetido = async (db, email, clienteId = 0, usuarioId = 0) => {
  if (!email) return false;
  const [enClientes] = await db.query("SELECT id FROM clientes WHERE email = ? AND id <> ?", [
    email,
    clienteId,
  ]);
  const [enUsuarios] = await db.query("SELECT id FROM usuarios WHERE email = ? AND id <> ?", [
    email,
    usuarioId,
  ]);
  return enClientes.length > 0 || enUsuarios.length > 0;
};

const responderError = (res, err, mensajeGeneral) => {
  if (err instanceof ErrorCliente) {
    return res.status(err.estado).json({ ok: false, mensaje: err.message });
  }
  console.error(`${mensajeGeneral}:`, err.message);
  res.status(500).json({ ok: false, mensaje: mensajeGeneral });
};

export const obtenerClientes = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_CLIENTES} GROUP BY c.id ORDER BY c.nombre, c.apellidos`);
    res.json({ ok: true, total: rows.length, data: rows.map(formatear) });
  } catch (err) {
    console.error("Error al obtener clientes:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los clientes" });
  }
};

export const crearCliente = async (req, res) => {
  const { error, datos } = validarCliente(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  // Solo el admin crea accesos; una empleada deja el cliente sin acceso
  const crearAcceso = req.usuario.rol === "admin" && Boolean(datos.email);
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    if (await correoRepetido(conexion, datos.email)) {
      throw new ErrorCliente("Ese correo ya está registrado", 409);
    }

    let usuarioId = null;
    let claveTemporal = null;

    if (crearAcceso) {
      claveTemporal = generarClaveTemporal();
      const hash = await bcrypt.hash(claveTemporal, 10);
      const [usuario] = await conexion.query(
        `INSERT INTO usuarios (nombre, apellidos, email, telefono, password_hash, rol, debe_cambiar_clave)
         VALUES (?, ?, ?, ?, ?, 'cliente', TRUE)`,
        [datos.nombre, datos.apellidos, datos.email, datos.telefono, hash]
      );
      usuarioId = usuario.insertId;
    }

    const [resultado] = await conexion.query(
      `INSERT INTO clientes (usuario_id, nombre, apellidos, email, telefono, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, datos.nombre, datos.apellidos, datos.email, datos.telefono, datos.fecha_nacimiento]
    );

    await conexion.commit();

    const [rows] = await pool.query(`${SELECT_CLIENTES} WHERE c.id = ? GROUP BY c.id`, [
      resultado.insertId,
    ]);

    // La contraseña temporal solo viaja en esta respuesta; no se guarda en claro
    res.status(201).json({ ok: true, data: { ...formatear(rows[0]), clave_temporal: claveTemporal } });
  } catch (err) {
    await conexion.rollback();
    responderError(res, err, "Error al crear el cliente");
  } finally {
    conexion.release();
  }
};

export const actualizarCliente = async (req, res) => {
  const { error, datos } = validarCliente(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const id = Number(req.params.id);
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [existente] = await conexion.query(
      "SELECT usuario_id FROM clientes WHERE id = ? FOR UPDATE",
      [id]
    );
    if (existente.length === 0) throw new ErrorCliente("Cliente no encontrado", 404);

    const usuarioId = existente[0].usuario_id;

    if (usuarioId && !datos.email) {
      throw new ErrorCliente("Un cliente con acceso al sistema necesita correo");
    }
    if (await correoRepetido(conexion, datos.email, id, usuarioId ?? 0)) {
      throw new ErrorCliente("Ese correo ya está registrado", 409);
    }

    await conexion.query(
      `UPDATE clientes
       SET nombre = ?, apellidos = ?, email = ?, telefono = ?, fecha_nacimiento = ?
       WHERE id = ?`,
      [datos.nombre, datos.apellidos, datos.email, datos.telefono, datos.fecha_nacimiento, id]
    );

    if (usuarioId) {
      await conexion.query(
        "UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ? WHERE id = ?",
        [datos.nombre, datos.apellidos, datos.email, datos.telefono, usuarioId]
      );
    }

    await conexion.commit();

    const [rows] = await pool.query(`${SELECT_CLIENTES} WHERE c.id = ? GROUP BY c.id`, [id]);
    res.json({ ok: true, data: formatear(rows[0]) });
  } catch (err) {
    await conexion.rollback();
    responderError(res, err, "Error al actualizar el cliente");
  } finally {
    conexion.release();
  }
};

// Crea el acceso de un cliente que no tiene, o restablece su contraseña si ya tiene
export const crearAccesoCliente = async (req, res) => {
  const id = Number(req.params.id);
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filas] = await conexion.query(
      "SELECT id, usuario_id, nombre, apellidos, telefono, email FROM clientes WHERE id = ? FOR UPDATE",
      [id]
    );
    if (filas.length === 0) throw new ErrorCliente("Cliente no encontrado", 404);

    const cliente = filas[0];
    const claveTemporal = generarClaveTemporal();
    const hash = await bcrypt.hash(claveTemporal, 10);

    if (cliente.usuario_id) {
      await conexion.query(
        "UPDATE usuarios SET password_hash = ?, debe_cambiar_clave = TRUE WHERE id = ?",
        [hash, cliente.usuario_id]
      );
    } else {
      if (!cliente.email) {
        throw new ErrorCliente("Agrega un correo al cliente para poder crearle acceso");
      }
      if (await correoRepetido(conexion, cliente.email, id, 0)) {
        throw new ErrorCliente("Ese correo ya está registrado en otro usuario", 409);
      }

      const [usuario] = await conexion.query(
        `INSERT INTO usuarios (nombre, apellidos, email, telefono, password_hash, rol, debe_cambiar_clave)
         VALUES (?, ?, ?, ?, ?, 'cliente', TRUE)`,
        [cliente.nombre, cliente.apellidos, cliente.email, cliente.telefono, hash]
      );
      await conexion.query("UPDATE clientes SET usuario_id = ? WHERE id = ?", [usuario.insertId, id]);
    }

    await conexion.commit();
    res.json({ ok: true, data: { clave_temporal: claveTemporal, creado: !cliente.usuario_id } });
  } catch (err) {
    await conexion.rollback();
    responderError(res, err, "Error al generar el acceso");
  } finally {
    conexion.release();
  }
};