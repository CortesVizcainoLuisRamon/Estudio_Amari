import { pool } from "../config/db.js";

const SELECT_SERVICIO = `
  SELECT s.id, s.nombre, s.descripcion, s.precio, s.precio_desde,
         s.duracion_min, s.requiere_patch_test, s.activo,
         c.id AS categoria_id, c.nombre AS categoria
  FROM servicios s
  JOIN categorias_servicio c ON c.id = s.categoria_id
`;

const formatear = (s) => ({
  ...s,
  precio: s.precio === null ? null : Number(s.precio),
  precio_desde: Boolean(s.precio_desde),
  requiere_patch_test: Boolean(s.requiere_patch_test),
  activo: Boolean(s.activo),
});

const validarServicio = (body) => {
  const datos = body ?? {};
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  const descripcion = typeof datos.descripcion === "string" ? datos.descripcion.trim() : "";
  const categoriaId = Number(datos.categoria_id);
  const precio = Number(datos.precio);
  const duracion = Number(datos.duracion_min);

  if (nombre.length < 2 || nombre.length > 120) {
    return { error: "El nombre debe tener entre 2 y 120 caracteres" };
  }
  if (!Number.isInteger(categoriaId) || categoriaId < 1) {
    return { error: "Selecciona una categoría" };
  }
  if (
    datos.precio === "" || datos.precio === null || datos.precio === undefined ||
    !Number.isFinite(precio) || precio < 0 || precio > 100000
  ) {
    return { error: "El precio no es válido" };
  }
  if (!Number.isInteger(duracion) || duracion < 5 || duracion > 600) {
    return { error: "La duración debe estar entre 5 y 600 minutos" };
  }

  return {
    datos: {
      nombre,
      descripcion: descripcion || null,
      categoria_id: categoriaId,
      precio,
      precio_desde: Boolean(datos.precio_desde),
      duracion_min: duracion,
      requiere_patch_test: Boolean(datos.requiere_patch_test),
    },
  };
};

export const obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM categorias_servicio ORDER BY id");
    res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("Error al obtener categorías:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener las categorías" });
  }
};

export const obtenerServicios = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_SERVICIO} WHERE s.activo = TRUE ORDER BY c.id, s.id`);
    res.json({ ok: true, total: rows.length, data: rows.map(formatear) });
  } catch (error) {
    console.error("Error al obtener servicios:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los servicios" });
  }
};

export const obtenerServiciosGestion = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_SERVICIO} ORDER BY c.id, s.id`);
    res.json({ ok: true, total: rows.length, data: rows.map(formatear) });
  } catch (error) {
    console.error("Error al obtener servicios:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los servicios" });
  }
};

export const obtenerServicioPorId = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_SERVICIO} WHERE s.id = ? AND s.activo = TRUE`, [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado" });
    }

    res.json({ ok: true, data: formatear(rows[0]) });
  } catch (error) {
    console.error("Error al obtener el servicio:", error.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener el servicio" });
  }
};

export const crearServicio = async (req, res) => {
  const { error, datos } = validarServicio(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  try {
    const [resultado] = await pool.query(
      `INSERT INTO servicios
         (categoria_id, nombre, descripcion, precio, precio_desde, duracion_min, requiere_patch_test)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.categoria_id,
        datos.nombre,
        datos.descripcion,
        datos.precio,
        datos.precio_desde,
        datos.duracion_min,
        datos.requiere_patch_test,
      ]
    );

    const [rows] = await pool.query(`${SELECT_SERVICIO} WHERE s.id = ?`, [resultado.insertId]);
    res.status(201).json({ ok: true, data: formatear(rows[0]) });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ ok: false, mensaje: "La categoría no existe" });
    }
    console.error("Error al crear el servicio:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el servicio" });
  }
};

export const actualizarServicio = async (req, res) => {
  const { error, datos } = validarServicio(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  // Si no se manda "activo", se conserva el valor actual
  const activo = typeof req.body?.activo === "boolean" ? req.body.activo : null;

  try {
    await pool.query(
      `UPDATE servicios
       SET categoria_id = ?, nombre = ?, descripcion = ?, precio = ?, precio_desde = ?,
           duracion_min = ?, requiere_patch_test = ?, activo = COALESCE(?, activo)
       WHERE id = ?`,
      [
        datos.categoria_id,
        datos.nombre,
        datos.descripcion,
        datos.precio,
        datos.precio_desde,
        datos.duracion_min,
        datos.requiere_patch_test,
        activo,
        req.params.id,
      ]
    );

    const [rows] = await pool.query(`${SELECT_SERVICIO} WHERE s.id = ?`, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado" });
    }

    res.json({ ok: true, data: formatear(rows[0]) });
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ ok: false, mensaje: "La categoría no existe" });
    }
    console.error("Error al actualizar el servicio:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar el servicio" });
  }
};