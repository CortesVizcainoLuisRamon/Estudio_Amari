import { pool } from "../config/db.js";

export const obtenerServicios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.nombre, s.descripcion, s.precio, s.precio_desde,
             s.duracion_min, c.id AS categoria_id, c.nombre AS categoria
      FROM servicios s
      JOIN categorias_servicio c ON c.id = s.categoria_id
      WHERE s.activo = TRUE
      ORDER BY c.id, s.id
    `);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (error) {
    console.error("Error al obtener servicios:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los servicios" });
  }
};

export const obtenerServicioPorId = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.nombre, s.descripcion, s.precio, s.precio_desde,
              s.duracion_min, c.id AS categoria_id, c.nombre AS categoria
       FROM servicios s
       JOIN categorias_servicio c ON c.id = s.categoria_id
       WHERE s.id = ? AND s.activo = TRUE`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado" });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("Error al obtener el servicio:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener el servicio" });
  }
};