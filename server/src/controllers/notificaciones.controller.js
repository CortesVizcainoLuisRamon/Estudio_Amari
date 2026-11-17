import { pool } from "../config/db.js";

const dosDigitos = (n) => String(n).padStart(2, "0");

const cuando = (fecha) => {
  const [f, h] = fecha.split(" ");
  const [a, m, d] = f.split("-").map(Number);
  const [hh, mm] = h.split(":").map(Number);
  const dt = new Date(a, m - 1, d, hh, mm);
  const dia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(dt);
  const hora = `${hh % 12 === 0 ? 12 : hh % 12}:${dosDigitos(mm)} ${hh < 12 ? "a.m." : "p.m."}`;
  return `${dia} a las ${hora}`;
};

const mensajeConfirmacion = (c) =>
  `Hola ${c.nombre}, tu cita en Estudio Amari quedó confirmada para el ${cuando(c.fecha)}. Servicios: ${c.servicios}. ¡Te esperamos!`;

const mensajeRecordatorio = (c) =>
  `Hola ${c.nombre}, te recordamos tu cita en Estudio Amari el ${cuando(c.fecha)} (${c.servicios}). Si no puedes asistir, avísanos con tiempo, por favor.`;

// Genera los avisos que falten. Es idempotente: se puede llamar las veces que sea.
const sincronizar = async () => {
  await pool.query(
    `DELETE n FROM notificaciones n
     JOIN citas c ON c.id = n.cita_id
     WHERE n.estado = 'pendiente' AND (c.estado = 'cancelada' OR c.inicio < NOW())`
  );

  const [citas] = await pool.query(
    `SELECT c.id, c.cliente_id, c.estado,
            DATE_FORMAT(c.inicio, '%Y-%m-%d %H:%i') AS fecha,
            (c.inicio <= DATE_ADD(NOW(), INTERVAL 24 HOUR)) AS cerca,
            cl.nombre,
            (SELECT GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ')
             FROM cita_servicios cs JOIN servicios s ON s.id = cs.servicio_id
             WHERE cs.cita_id = c.id) AS servicios
     FROM citas c
     JOIN clientes cl ON cl.id = c.cliente_id
     WHERE c.inicio > NOW() AND c.estado IN ('pendiente', 'confirmada')`
  );

  for (const c of citas) {
    if (c.estado === "confirmada") {
      await pool.query(
        "INSERT IGNORE INTO notificaciones (cliente_id, tipo, cita_id, mensaje) VALUES (?, 'confirmacion', ?, ?)",
        [c.cliente_id, c.id, mensajeConfirmacion(c)]
      );
    }
    if (c.cerca) {
      await pool.query(
        "INSERT IGNORE INTO notificaciones (cliente_id, tipo, cita_id, mensaje) VALUES (?, 'recordatorio', ?, ?)",
        [c.cliente_id, c.id, mensajeRecordatorio(c)]
      );
    }
  }
};

/* ---------- Admin ---------- */

export const obtenerNotificaciones = async (req, res) => {
  try {
    await sincronizar();

    const [filas] = await pool.query(
      `SELECT n.id, n.tipo, n.mensaje, n.estado, n.cita_id,
              DATE_FORMAT(n.creada_en, '%Y-%m-%d %H:%i') AS creada_en,
              TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellidos, ''))) AS cliente,
              cl.telefono
       FROM notificaciones n
       JOIN clientes cl ON cl.id = n.cliente_id
       ORDER BY n.estado = 'pendiente' DESC, n.creada_en DESC, n.id DESC
       LIMIT 200`
    );

    res.json({ ok: true, data: filas });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener las notificaciones" });
  }
};

export const crearPromocion = async (req, res) => {
  const mensaje = String(req.body?.mensaje ?? "").trim();

  if (mensaje.length < 10 || mensaje.length > 500) {
    return res.status(400).json({ ok: false, mensaje: "El mensaje debe tener entre 10 y 500 caracteres" });
  }

  try {
    const [r] = await pool.query(
      `INSERT INTO notificaciones (cliente_id, tipo, mensaje)
       SELECT id, 'promocion', ? FROM clientes WHERE telefono IS NOT NULL AND telefono <> ''`,
      [mensaje]
    );

    res.status(201).json({ ok: true, data: { creadas: r.affectedRows } });
  } catch (err) {
    console.error("Error al crear la promoción:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear la promoción" });
  }
};

export const marcarEnviada = async (req, res) => {
  try {
    const [r] = await pool.query(
      "UPDATE notificaciones SET estado = 'enviada', enviada_en = NOW() WHERE id = ?",
      [req.params.id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: "Notificación no encontrada" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al marcar como enviada:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar la notificación" });
  }
};

export const descartarNotificacion = async (req, res) => {
  try {
    const [r] = await pool.query(
      "DELETE FROM notificaciones WHERE id = ? AND estado = 'pendiente'",
      [req.params.id]
    );
    if (r.affectedRows === 0) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Solo se pueden descartar notificaciones pendientes" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al descartar la notificación:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al descartar la notificación" });
  }
};

/* ---------- Cliente ---------- */

const clienteDeSesion = async (usuarioId) => {
  const [filas] = await pool.query("SELECT id FROM clientes WHERE usuario_id = ?", [usuarioId]);
  return filas[0]?.id ?? null;
};

export const obtenerMisNotificaciones = async (req, res) => {
  try {
    const clienteId = await clienteDeSesion(req.usuario.id);
    if (!clienteId) return res.status(404).json({ ok: false, mensaje: "No se encontró tu perfil de cliente" });

    await sincronizar();

    const [filas] = await pool.query(
      `SELECT id, tipo, mensaje, leida, DATE_FORMAT(creada_en, '%Y-%m-%d %H:%i') AS creada_en
       FROM notificaciones
       WHERE cliente_id = ?
       ORDER BY creada_en DESC, id DESC
       LIMIT 50`,
      [clienteId]
    );

    res.json({
      ok: true,
      data: filas.map((n) => ({ ...n, leida: Boolean(n.leida) })),
    });
  } catch (err) {
    console.error("Error al obtener mis notificaciones:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener tus notificaciones" });
  }
};

export const marcarLeida = async (req, res) => {
  try {
    const clienteId = await clienteDeSesion(req.usuario.id);
    if (!clienteId) return res.status(404).json({ ok: false, mensaje: "No se encontró tu perfil de cliente" });

    await pool.query("UPDATE notificaciones SET leida = TRUE WHERE id = ? AND cliente_id = ?", [
      req.params.id,
      clienteId,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al marcar como leída:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar la notificación" });
  }
};

export const marcarTodasLeidas = async (req, res) => {
  try {
    const clienteId = await clienteDeSesion(req.usuario.id);
    if (!clienteId) return res.status(404).json({ ok: false, mensaje: "No se encontró tu perfil de cliente" });

    await pool.query("UPDATE notificaciones SET leida = TRUE WHERE cliente_id = ?", [clienteId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al marcar todas como leídas:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar las notificaciones" });
  }
};