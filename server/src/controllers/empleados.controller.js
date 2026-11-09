import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const COLORES = ["#e879f9", "#38bdf8", "#fb923c", "#4ade80", "#a78bfa", "#f87171", "#fbbf24"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+\-\s()]{7,20}$/;

const SELECT_EMPLEADOS = `
  SELECT e.id, e.usuario_id, u.nombre, u.apellidos, u.email, u.telefono,
         e.puesto, e.comision_pct, e.color, e.dias_laborales, e.activo
  FROM empleados e
  JOIN usuarios u ON u.id = e.usuario_id
`;

const armarEmpleados = async (where = "", params = []) => {
  const [empleados] = await pool.query(`${SELECT_EMPLEADOS} ${where} ORDER BY e.id`, params);
  if (empleados.length === 0) return [];

  const [relaciones] = await pool.query(
    "SELECT empleado_id, servicio_id FROM empleado_servicio WHERE empleado_id IN (?)",
    [empleados.map((e) => e.id)]
  );

  return empleados.map((e) => ({
    ...e,
    comision_pct: Number(e.comision_pct),
    activo: Boolean(e.activo),
    dias_laborales: e.dias_laborales.split(",").map(Number),
    servicios_ids: relaciones.filter((r) => r.empleado_id === e.id).map((r) => r.servicio_id),
  }));
};

const validarEmpleado = (body, esNuevo) => {
  const d = body ?? {};
  const texto = (v) => (typeof v === "string" ? v.trim() : "");

  const nombre = texto(d.nombre);
  const apellidos = texto(d.apellidos);
  const email = texto(d.email).toLowerCase();
  const telefono = texto(d.telefono);
  const puesto = texto(d.puesto);
  const password = typeof d.password === "string" ? d.password : "";
  const comision = d.comision_pct === "" || d.comision_pct == null ? 0 : Number(d.comision_pct);
  const dias = Array.isArray(d.dias_laborales) ? [...new Set(d.dias_laborales.map(Number))] : [];
  const servicios = Array.isArray(d.servicios_ids) ? [...new Set(d.servicios_ids.map(Number))] : [];

  if (nombre.length < 2 || nombre.length > 80) return { error: "El nombre debe tener entre 2 y 80 caracteres" };
  if (apellidos.length < 2 || apellidos.length > 100) return { error: "El apellido debe tener entre 2 y 100 caracteres" };
  if (!EMAIL_REGEX.test(email)) return { error: "El correo no es válido" };
  if (telefono && !TELEFONO_REGEX.test(telefono)) return { error: "El teléfono no es válido" };
  if (puesto.length > 60) return { error: "La especialidad es demasiado larga" };
  if (!Number.isFinite(comision) || comision < 0 || comision > 100) return { error: "La comisión debe estar entre 0 y 100" };
  if (!COLORES.includes(d.color)) return { error: "El color no es válido" };
  if (dias.length === 0 || !dias.every((n) => Number.isInteger(n) && n >= 1 && n <= 7)) {
    return { error: "Selecciona al menos un día laboral" };
  }
  if (!servicios.every((n) => Number.isInteger(n) && n > 0)) return { error: "Los servicios no son válidos" };

  if (esNuevo && (password.length < 8 || password.length > 72)) {
    return { error: "La contraseña debe tener entre 8 y 72 caracteres" };
  }
  if (!esNuevo && password && (password.length < 8 || password.length > 72)) {
    return { error: "La contraseña debe tener entre 8 y 72 caracteres" };
  }

  return {
    datos: {
      nombre,
      apellidos,
      email,
      telefono: telefono || null,
      puesto: puesto || null,
      password,
      comision_pct: comision,
      color: d.color,
      dias_laborales: dias.sort((a, b) => a - b).join(","),
      servicios_ids: servicios,
    },
  };
};

const guardarServicios = async (conexion, empleadoId, serviciosIds) => {
  await conexion.query("DELETE FROM empleado_servicio WHERE empleado_id = ?", [empleadoId]);
  if (serviciosIds.length > 0) {
    await conexion.query("INSERT INTO empleado_servicio (empleado_id, servicio_id) VALUES ?", [
      serviciosIds.map((id) => [empleadoId, id]),
    ]);
  }
};

const responderError = (err, res, accion) => {
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ ok: false, mensaje: "Ese correo ya está registrado" });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ ok: false, mensaje: "Alguno de los servicios no existe" });
  }
  console.error(`Error al ${accion}:`, err.message);
  res.status(500).json({ ok: false, mensaje: `Error al ${accion}` });
};

export const obtenerEmpleados = async (req, res) => {
  try {
    const data = await armarEmpleados();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    responderError(err, res, "obtener las empleadas");
  }
};

export const crearEmpleado = async (req, res) => {
  const { error, datos } = validarEmpleado(req.body, true);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const hash = await bcrypt.hash(datos.password, 10);

    const [usuario] = await conexion.query(
      `INSERT INTO usuarios (nombre, apellidos, email, telefono, password_hash, rol)
       VALUES (?, ?, ?, ?, ?, 'empleado')`,
      [datos.nombre, datos.apellidos, datos.email, datos.telefono, hash]
    );

    const [empleado] = await conexion.query(
      `INSERT INTO empleados (usuario_id, puesto, comision_pct, color, dias_laborales)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario.insertId, datos.puesto, datos.comision_pct, datos.color, datos.dias_laborales]
    );

    await guardarServicios(conexion, empleado.insertId, datos.servicios_ids);
    await conexion.commit();

    const [creada] = await armarEmpleados("WHERE e.id = ?", [empleado.insertId]);
    res.status(201).json({ ok: true, data: creada });
  } catch (err) {
    await conexion.rollback();
    responderError(err, res, "crear la empleada");
  } finally {
    conexion.release();
  }
};

export const actualizarEmpleado = async (req, res) => {
  const { error, datos } = validarEmpleado(req.body, false);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  // Si no se manda "activo", se conserva el valor actual
  const activo = typeof req.body?.activo === "boolean" ? req.body.activo : null;
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [existente] = await conexion.query("SELECT usuario_id FROM empleados WHERE id = ?", [
      req.params.id,
    ]);

    if (existente.length === 0) {
      await conexion.rollback();
      return res.status(404).json({ ok: false, mensaje: "Empleada no encontrada" });
    }

    const usuarioId = existente[0].usuario_id;

    await conexion.query(
      `UPDATE usuarios
       SET nombre = ?, apellidos = ?, email = ?, telefono = ?, activo = COALESCE(?, activo)
       WHERE id = ?`,
      [datos.nombre, datos.apellidos, datos.email, datos.telefono, activo, usuarioId]
    );

    if (datos.password) {
      const hash = await bcrypt.hash(datos.password, 10);
      await conexion.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hash, usuarioId]);
    }

    await conexion.query(
      `UPDATE empleados
       SET puesto = ?, comision_pct = ?, color = ?, dias_laborales = ?, activo = COALESCE(?, activo)
       WHERE id = ?`,
      [datos.puesto, datos.comision_pct, datos.color, datos.dias_laborales, activo, req.params.id]
    );

    await guardarServicios(conexion, req.params.id, datos.servicios_ids);
    await conexion.commit();

    const [actualizada] = await armarEmpleados("WHERE e.id = ?", [req.params.id]);
    res.json({ ok: true, data: actualizada });
  } catch (err) {
    await conexion.rollback();
    responderError(err, res, "actualizar la empleada");
  } finally {
    conexion.release();
  }
};