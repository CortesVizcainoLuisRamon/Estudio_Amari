import { pool } from "../config/db.js";
import { APERTURA_MIN, CIERRE_MIN, INTERVALO_MIN } from "../config/horario.js";

const ESTADOS = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"];
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^\d{2}:\d{2}$/;
const MAX_CITAS_ACTIVAS = 3;
const MIN_HORAS_CANCELAR = 12;

class ErrorCita extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const dos = (n) => String(n).padStart(2, "0");
const minAHora = (m) => `${dos(Math.floor(m / 60))}:${dos(m % 60)}`;

const fechaValida = (f) => {
  if (typeof f !== "string" || !FECHA_REGEX.test(f)) return false;
  const [a, m, d] = f.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  return fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d;
};

// 1 = lunes ... 7 = domingo
const diaSemana = (f) => {
  const [a, m, d] = f.split("-").map(Number);
  const dia = new Date(a, m - 1, d).getDay();
  return dia === 0 ? 7 : dia;
};

const ahora = () => {
  const n = new Date();
  return {
    fecha: `${n.getFullYear()}-${dos(n.getMonth() + 1)}-${dos(n.getDate())}`,
    minutos: n.getHours() * 60 + n.getMinutes(),
  };
};

const normalizarIds = (valor) => {
  const lista = Array.isArray(valor) ? valor : String(valor ?? "").split(",");
  const ids = [...new Set(lista.map(Number))];
  return ids.length > 0 && ids.every((n) => Number.isInteger(n) && n > 0) ? ids : null;
};

const cargarServicios = async (conexion, ids) => {
  const [rows] = await conexion.query(
    "SELECT id, nombre, precio, duracion_min FROM servicios WHERE id IN (?) AND activo = TRUE",
    [ids]
  );
  return rows.length === ids.length ? rows : null;
};

const empleadaDeUsuario = async (usuarioId) => {
  const [rows] = await pool.query("SELECT id FROM empleados WHERE usuario_id = ?", [usuarioId]);
  return rows[0]?.id ?? null;
};

const clienteDeUsuario = async (usuarioId) => {
  const [rows] = await pool.query("SELECT id FROM clientes WHERE usuario_id = ?", [usuarioId]);
  return rows[0]?.id ?? null;
};

export const SELECT_CITAS = `
  SELECT c.id, c.cliente_id, c.empleado_id, c.estado, c.total, c.notas,
         DATE_FORMAT(c.inicio, '%Y-%m-%d %H:%i') AS inicio,
         DATE_FORMAT(c.fin, '%Y-%m-%d %H:%i') AS fin,
         TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellidos, ''))) AS cliente,
         TRIM(CONCAT(u.nombre, ' ', u.apellidos)) AS empleada,
         e.color
  FROM citas c
  JOIN clientes cl ON cl.id = c.cliente_id
  JOIN empleados e ON e.id = c.empleado_id
  JOIN usuarios u ON u.id = e.usuario_id
`;

export const adjuntarServicios = async (citas) => {
  if (citas.length === 0) return [];

  const [rel] = await pool.query(
    `SELECT cs.cita_id, s.id, s.nombre, cs.precio, cs.duracion_min
     FROM cita_servicios cs
     JOIN servicios s ON s.id = cs.servicio_id
     WHERE cs.cita_id IN (?)`,
    [citas.map((c) => c.id)]
  );

  return citas.map((c) => ({
    ...c,
    total: Number(c.total),
    servicios: rel
      .filter((r) => r.cita_id === c.id)
      .map((r) => ({
        id: r.id,
        nombre: r.nombre,
        precio: r.precio === null ? null : Number(r.precio),
        duracion_min: r.duracion_min,
      })),
  }));
};

export const obtenerCitas = async (req, res) => {
  const { desde, hasta } = req.query;

  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) {
    return res.status(400).json({ ok: false, mensaje: "Indica un rango de fechas válido (desde y hasta)" });
  }

  const dias = (new Date(hasta) - new Date(desde)) / 86400000;
  if (dias > 62) {
    return res.status(400).json({ ok: false, mensaje: "El rango máximo es de 62 días" });
  }

  try {
    const params = [desde, hasta];
    let filtro = "";

    if (req.usuario.rol === "empleado") {
      const empleadoId = await empleadaDeUsuario(req.usuario.id);
      if (!empleadoId) return res.json({ ok: true, total: 0, data: [] });
      filtro = " AND c.empleado_id = ?";
      params.push(empleadoId);
    }

    const [rows] = await pool.query(
      `${SELECT_CITAS}
       WHERE c.inicio >= ? AND c.inicio < DATE_ADD(?, INTERVAL 1 DAY)${filtro}
       ORDER BY c.inicio`,
      params
    );

    const data = await adjuntarServicios(rows);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener citas:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener las citas" });
  }
};

export const obtenerDisponibilidad = async (req, res) => {
  const { fecha } = req.query;
  const ids = normalizarIds(req.query.servicios);

  if (!fechaValida(fecha)) {
    return res.status(400).json({ ok: false, mensaje: "La fecha no es válida" });
  }
  if (!ids) {
    return res.status(400).json({ ok: false, mensaje: "Selecciona al menos un servicio" });
  }

  try {
    const servicios = await cargarServicios(pool, ids);
    if (!servicios) {
      return res.status(400).json({ ok: false, mensaje: "Alguno de los servicios no existe o está inactivo" });
    }

    const duracion = servicios.reduce((suma, s) => suma + s.duracion_min, 0);
    const hoy = ahora();

    if (fecha < hoy.fecha) {
      return res.json({ ok: true, duracion_total: duracion, data: [] });
    }

    // Empleadas activas que realizan TODOS los servicios elegidos
    const [candidatas] = await pool.query(
      `SELECT e.id, u.nombre, u.apellidos, e.color, e.dias_laborales
       FROM empleados e
       JOIN usuarios u ON u.id = e.usuario_id
       JOIN empleado_servicio es ON es.empleado_id = e.id AND es.servicio_id IN (?)
       WHERE e.activo = TRUE
       GROUP BY e.id, u.nombre, u.apellidos, e.color, e.dias_laborales
       HAVING COUNT(DISTINCT es.servicio_id) = ?`,
      [ids, ids.length]
    );

    const dia = diaSemana(fecha);
    const trabajan = candidatas.filter((e) => e.dias_laborales.split(",").map(Number).includes(dia));

    if (trabajan.length === 0) {
      return res.json({ ok: true, duracion_total: duracion, data: [] });
    }

    const [citas] = await pool.query(
      `SELECT empleado_id,
              HOUR(inicio) * 60 + MINUTE(inicio) AS ini_min,
              HOUR(fin) * 60 + MINUTE(fin) AS fin_min
       FROM citas
       WHERE empleado_id IN (?)
         AND inicio >= ? AND inicio < DATE_ADD(?, INTERVAL 1 DAY)
         AND estado NOT IN ('cancelada', 'no_asistio')`,
      [trabajan.map((e) => e.id), fecha, fecha]
    );

    const data = trabajan.map((e) => {
      const ocupadas = citas.filter((c) => c.empleado_id === e.id);
      const horas = [];

      for (let ini = APERTURA_MIN; ini + duracion <= CIERRE_MIN; ini += INTERVALO_MIN) {
        if (fecha === hoy.fecha && ini <= hoy.minutos) continue;
        const fin = ini + duracion;
        const choca = ocupadas.some((c) => ini < c.fin_min && fin > c.ini_min);
        if (!choca) horas.push(minAHora(ini));
      }

      return {
        empleado_id: e.id,
        nombre: `${e.nombre} ${e.apellidos}`,
        color: e.color,
        horas,
      };
    });

    res.json({ ok: true, duracion_total: duracion, data });
  } catch (err) {
    console.error("Error al calcular disponibilidad:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al calcular la disponibilidad" });
  }
};

export const crearCita = async (req, res) => {
    const d = req.body ?? {};
  let clienteId = Number(d.cliente_id);

  // Una clienta solo puede agendar para sí misma: su id sale de la sesión, no del formulario
  if (req.usuario.rol === "cliente") {
    try {
      clienteId = await clienteDeUsuario(req.usuario.id);
    } catch (err) {
      console.error("Error al buscar la clienta:", err.message);
      return res.status(500).json({ ok: false, mensaje: "Error al crear la cita" });
    }
    if (!clienteId) {
      return res.status(403).json({ ok: false, mensaje: "Tu cuenta no tiene perfil de clienta" });
    }
  }
  const empleadoId = Number(d.empleado_id);
  const ids = normalizarIds(d.servicios_ids);
  const fecha = typeof d.fecha === "string" ? d.fecha.trim() : "";
  const hora = typeof d.hora === "string" ? d.hora.trim() : "";
  const notas = typeof d.notas === "string" ? d.notas.trim() : "";

  if (!Number.isInteger(clienteId) || clienteId < 1) {
    return res.status(400).json({ ok: false, mensaje: "Selecciona un cliente" });
  }
  if (!Number.isInteger(empleadoId) || empleadoId < 1) {
    return res.status(400).json({ ok: false, mensaje: "Selecciona una especialista" });
  }
  if (!ids) {
    return res.status(400).json({ ok: false, mensaje: "Selecciona al menos un servicio" });
  }
  if (!fechaValida(fecha) || !HORA_REGEX.test(hora)) {
    return res.status(400).json({ ok: false, mensaje: "La fecha u hora no son válidas" });
  }
  if (notas.length > 500) {
    return res.status(400).json({ ok: false, mensaje: "Las notas son demasiado largas" });
  }

  const [hh, mm] = hora.split(":").map(Number);
  const inicioMin = hh * 60 + mm;
  const hoy = ahora();

  if (hh > 23 || mm > 59 || (inicioMin - APERTURA_MIN) % INTERVALO_MIN !== 0) {
    return res.status(400).json({ ok: false, mensaje: `La hora debe ser en intervalos de ${INTERVALO_MIN} minutos` });
  }
  if (fecha < hoy.fecha || (fecha === hoy.fecha && inicioMin <= hoy.minutos)) {
    return res.status(400).json({ ok: false, mensaje: "No se pueden agendar citas en el pasado" });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Se bloquea a la empleada primero: dos citas simultáneas para ella se procesan una tras otra
    const [empleada] = await conexion.query(
      "SELECT id, dias_laborales FROM empleados WHERE id = ? AND activo = TRUE FOR UPDATE",
      [empleadoId]
    );
    if (empleada.length === 0) throw new ErrorCita(404, "La especialista no existe o está inactiva");

    if (!empleada[0].dias_laborales.split(",").map(Number).includes(diaSemana(fecha))) {
      throw new ErrorCita(400, "La especialista no trabaja ese día");
    }

    const servicios = await cargarServicios(conexion, ids);
    if (!servicios) throw new ErrorCita(400, "Alguno de los servicios no existe o está inactivo");

    const duracion = servicios.reduce((suma, s) => suma + s.duracion_min, 0);
    const finMin = inicioMin + duracion;

    if (inicioMin < APERTURA_MIN || finMin > CIERRE_MIN) {
      throw new ErrorCita(400, "La cita queda fuera del horario de atención");
    }

    const [realiza] = await conexion.query(
      "SELECT COUNT(*) AS n FROM empleado_servicio WHERE empleado_id = ? AND servicio_id IN (?)",
      [empleadoId, ids]
    );
    if (realiza[0].n !== ids.length) {
      throw new ErrorCita(400, "La especialista no realiza todos los servicios elegidos");
    }

    const [cliente] = await conexion.query("SELECT id FROM clientes WHERE id = ?", [clienteId]);
    if (cliente.length === 0) throw new ErrorCita(404, "El cliente no existe");

    if (req.usuario.rol === "cliente") {
      const [activas] = await conexion.query(
        `SELECT COUNT(*) AS n FROM citas
         WHERE cliente_id = ? AND estado IN ('pendiente', 'confirmada') AND inicio > NOW()`,
        [clienteId]
      );
      if (activas[0].n >= MAX_CITAS_ACTIVAS) {
        throw new ErrorCita(
          400,
          `Ya tienes ${MAX_CITAS_ACTIVAS} citas próximas. Cancela una o espera a que se realice para agendar otra.`
        );
      }
    }

    const inicio = `${fecha} ${minAHora(inicioMin)}:00`;
    const fin = `${fecha} ${minAHora(finMin)}:00`;

    // Dos citas se traslapan si: inicio_nueva < fin_existente Y fin_nueva > inicio_existente
    const [choque] = await conexion.query(
      `SELECT id FROM citas
       WHERE empleado_id = ? AND estado NOT IN ('cancelada', 'no_asistio')
         AND inicio < ? AND fin > ?
       LIMIT 1 FOR UPDATE`,
      [empleadoId, fin, inicio]
    );
    if (choque.length > 0) {
      throw new ErrorCita(409, "La especialista ya tiene una cita en ese horario");
    }

    const total = servicios.reduce((suma, s) => suma + Number(s.precio ?? 0), 0);

    const [cita] = await conexion.query(
      `INSERT INTO citas (cliente_id, empleado_id, inicio, fin, total, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clienteId, empleadoId, inicio, fin, total, notas || null]
    );

    await conexion.query(
      "INSERT INTO cita_servicios (cita_id, servicio_id, precio, duracion_min) VALUES ?",
      [servicios.map((s) => [cita.insertId, s.id, s.precio, s.duracion_min])]
    );

    await conexion.commit();

    const [rows] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [cita.insertId]);
    const [creada] = await adjuntarServicios(rows);
    res.status(201).json({ ok: true, data: creada });
  } catch (err) {
    await conexion.rollback();

    if (err instanceof ErrorCita) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }

    console.error("Error al crear la cita:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear la cita" });
  } finally {
    conexion.release();
  }
};

export const cambiarEstado = async (req, res) => {
  const estado = req.body?.estado;

  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: "El estado no es válido" });
  }

  try {
    const params = [req.params.id];
    let filtro = "";

    if (req.usuario.rol === "empleado") {
      const empleadoId = await empleadaDeUsuario(req.usuario.id);
      filtro = " AND empleado_id = ?";
      params.push(empleadoId ?? 0);
    }

    const [existe] = await pool.query(`SELECT id FROM citas WHERE id = ?${filtro}`, params);
    if (existe.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Cita no encontrada" });
    }

    await pool.query("UPDATE citas SET estado = ? WHERE id = ?", [estado, req.params.id]);

    const [rows] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [req.params.id]);
    const [actualizada] = await adjuntarServicios(rows);
    res.json({ ok: true, data: actualizada });
  } catch (err) {
    console.error("Error al cambiar el estado:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cambiar el estado de la cita" });
  }
};


export const obtenerMisCitas = async (req, res) => {
  try {
    const clienteId = await clienteDeUsuario(req.usuario.id);
    if (!clienteId) return res.json({ ok: true, total: 0, data: [] });

    const [rows] = await pool.query(
      `${SELECT_CITAS}
       WHERE c.cliente_id = ?
       ORDER BY c.inicio DESC
       LIMIT 100`,
      [clienteId]
    );

    const data = await adjuntarServicios(rows);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener mis citas:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener tus citas" });
  }
};

export const cancelarMiCita = async (req, res) => {
  try {
    const clienteId = await clienteDeUsuario(req.usuario.id);
    if (!clienteId) {
      return res.status(403).json({ ok: false, mensaje: "Tu cuenta no tiene perfil de clienta" });
    }

    const [rows] = await pool.query(
      `SELECT id, estado, TIMESTAMPDIFF(MINUTE, NOW(), inicio) AS minutos
       FROM citas WHERE id = ? AND cliente_id = ?`,
      [req.params.id, clienteId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Cita no encontrada" });
    }

    const cita = rows[0];

    if (!["pendiente", "confirmada"].includes(cita.estado)) {
      return res.status(400).json({ ok: false, mensaje: "Esta cita ya no se puede cancelar" });
    }
    if (cita.minutos < MIN_HORAS_CANCELAR * 60) {
      return res.status(400).json({
        ok: false,
        mensaje: `Solo puedes cancelar con al menos ${MIN_HORAS_CANCELAR} horas de anticipación. Comunícate con el estudio.`,
      });
    }

    await pool.query("UPDATE citas SET estado = 'cancelada' WHERE id = ?", [cita.id]);

    const [actual] = await pool.query(`${SELECT_CITAS} WHERE c.id = ?`, [cita.id]);
    const [actualizada] = await adjuntarServicios(actual);
    res.json({ ok: true, data: actualizada });
  } catch (err) {
    console.error("Error al cancelar la cita:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cancelar la cita" });
  }
};