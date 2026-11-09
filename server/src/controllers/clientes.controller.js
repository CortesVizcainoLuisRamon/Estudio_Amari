import { pool } from "../config/db.js";

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

const formatear = (c) => ({ ...c, visitas: Number(c.visitas) });

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

const correoRepetido = async (email, ignorarId = 0) => {
  if (!email) return false;
  const [rows] = await pool.query("SELECT id FROM clientes WHERE email = ? AND id <> ?", [
    email,
    ignorarId,
  ]);
  return rows.length > 0;
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

  try {
    if (await correoRepetido(datos.email)) {
      return res.status(409).json({ ok: false, mensaje: "Ese correo ya está registrado" });
    }

    const [resultado] = await pool.query(
      `INSERT INTO clientes (nombre, apellidos, email, telefono, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?)`,
      [datos.nombre, datos.apellidos, datos.email, datos.telefono, datos.fecha_nacimiento]
    );

    const [rows] = await pool.query(`${SELECT_CLIENTES} WHERE c.id = ? GROUP BY c.id`, [
      resultado.insertId,
    ]);
    res.status(201).json({ ok: true, data: formatear(rows[0]) });
  } catch (err) {
    console.error("Error al crear el cliente:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el cliente" });
  }
};

export const actualizarCliente = async (req, res) => {
  const { error, datos } = validarCliente(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  try {
    if (await correoRepetido(datos.email, Number(req.params.id))) {
      return res.status(409).json({ ok: false, mensaje: "Ese correo ya está registrado" });
    }

    await pool.query(
      `UPDATE clientes
       SET nombre = ?, apellidos = ?, email = ?, telefono = ?, fecha_nacimiento = ?
       WHERE id = ?`,
      [
        datos.nombre,
        datos.apellidos,
        datos.email,
        datos.telefono,
        datos.fecha_nacimiento,
        req.params.id,
      ]
    );

    const [rows] = await pool.query(`${SELECT_CLIENTES} WHERE c.id = ? GROUP BY c.id`, [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Cliente no encontrado" });
    }

    res.json({ ok: true, data: formatear(rows[0]) });
  } catch (err) {
    console.error("Error al actualizar el cliente:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar el cliente" });
  }
};