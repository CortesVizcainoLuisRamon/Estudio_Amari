import { pool } from "../config/db.js";

const UNIDADES = ["unidad", "pieza", "par", "caja", "paquete", "frasco", "tubo", "ml", "litro", "gr", "kg"];
const TIPOS = ["entrada", "salida", "ajuste"];
const MAX = 1000000;

class ErrorInventario extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const numero = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return NaN;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

const opcional = (valor) => (valor === "" || valor === null || valor === undefined ? 0 : numero(valor));

const estadoDe = (stock, minimo) => (stock <= 0 ? "agotado" : stock <= minimo ? "bajo" : "ok");

const SELECT_INSUMO =
  "SELECT id, nombre, categoria, unidad, stock, stock_minimo, costo, activo FROM insumos";

const formato = (r) => {
  const stock = Number(r.stock);
  const minimo = Number(r.stock_minimo);

  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    unidad: r.unidad,
    stock,
    stock_minimo: minimo,
    costo: Number(r.costo),
    activo: Boolean(r.activo),
    estado: estadoDe(stock, minimo),
  };
};

const validarInsumo = (d = {}) => {
  const nombre = typeof d.nombre === "string" ? d.nombre.trim() : "";
  const categoria =
    typeof d.categoria === "string" && d.categoria.trim() ? d.categoria.trim() : "Otros";
  const costo = opcional(d.costo);
  const stockMinimo = opcional(d.stock_minimo);

  if (nombre.length < 2 || nombre.length > 120) {
    return { error: "El nombre debe tener entre 2 y 120 caracteres" };
  }
  if (categoria.length > 60) return { error: "La categoría es demasiado larga" };
  if (!UNIDADES.includes(d.unidad)) return { error: "Elige una unidad de medida válida" };
  if (!(costo >= 0 && costo <= MAX)) return { error: "El precio de costo no es válido" };
  if (!(stockMinimo >= 0 && stockMinimo <= MAX)) return { error: "El stock mínimo no es válido" };

  return { valores: { nombre, categoria, unidad: d.unidad, costo, stockMinimo } };
};

export const obtenerInsumos = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_INSUMO} WHERE activo = TRUE ORDER BY categoria, nombre`);
    const data = rows.map(formato);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener el inventario:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener el inventario" });
  }
};

export const crearInsumo = async (req, res) => {
  const { error, valores } = validarInsumo(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const stock = opcional(req.body?.stock);
  if (!(stock >= 0 && stock <= MAX)) {
    return res.status(400).json({ ok: false, mensaje: "El stock inicial no es válido" });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.query(
      `INSERT INTO insumos (nombre, categoria, unidad, stock, stock_minimo, costo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [valores.nombre, valores.categoria, valores.unidad, stock, valores.stockMinimo, valores.costo]
    );

    if (stock > 0) {
      await conexion.query(
        `INSERT INTO movimientos_inventario
           (insumo_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
         VALUES (?, ?, 'entrada', ?, 0, ?, 'Stock inicial')`,
        [resultado.insertId, req.usuario.id, stock, stock]
      );
    }

    await conexion.commit();

    const [rows] = await pool.query(`${SELECT_INSUMO} WHERE id = ?`, [resultado.insertId]);
    res.status(201).json({ ok: true, data: formato(rows[0]) });
  } catch (err) {
    await conexion.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un insumo con ese nombre" });
    }

    console.error("Error al crear el insumo:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el insumo" });
  } finally {
    conexion.release();
  }
};

export const actualizarInsumo = async (req, res) => {
  const { error, valores } = validarInsumo(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const activo = typeof req.body?.activo === "boolean" ? req.body.activo : null;

  try {
    const [existe] = await pool.query("SELECT id FROM insumos WHERE id = ?", [req.params.id]);
    if (existe.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Insumo no encontrado" });
    }

    await pool.query(
      `UPDATE insumos
       SET nombre = ?, categoria = ?, unidad = ?, stock_minimo = ?, costo = ?,
           activo = COALESCE(?, activo)
       WHERE id = ?`,
      [valores.nombre, valores.categoria, valores.unidad, valores.stockMinimo, valores.costo, activo, req.params.id]
    );

    const [rows] = await pool.query(`${SELECT_INSUMO} WHERE id = ?`, [req.params.id]);
    res.json({ ok: true, data: formato(rows[0]) });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un insumo con ese nombre" });
    }

    console.error("Error al actualizar el insumo:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar el insumo" });
  }
};

export const registrarMovimiento = async (req, res) => {
  const d = req.body ?? {};
  const tipo = d.tipo;
  const cantidad = numero(d.cantidad);
  const motivo = typeof d.motivo === "string" ? d.motivo.trim() : "";

  if (!TIPOS.includes(tipo)) {
    return res.status(400).json({ ok: false, mensaje: "El tipo de movimiento no es válido" });
  }
  if (tipo === "ajuste" && req.usuario.rol !== "admin") {
    return res.status(403).json({ ok: false, mensaje: "Solo el administrador puede ajustar el stock" });
  }
  if (!(tipo === "ajuste" ? cantidad >= 0 : cantidad > 0) || cantidad > MAX) {
    return res.status(400).json({ ok: false, mensaje: "La cantidad no es válida" });
  }
  if (motivo.length > 200) {
    return res.status(400).json({ ok: false, mensaje: "El motivo es demasiado largo" });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Se bloquea la fila: dos movimientos simultáneos del mismo insumo se procesan uno tras otro
    const [filas] = await conexion.query(
      "SELECT stock FROM insumos WHERE id = ? AND activo = TRUE FOR UPDATE",
      [req.params.id]
    );
    if (filas.length === 0) throw new ErrorInventario(404, "Insumo no encontrado");

    const anterior = Number(filas[0].stock);
    const nuevo =
      Math.round(
        (tipo === "entrada" ? anterior + cantidad : tipo === "salida" ? anterior - cantidad : cantidad) * 100
      ) / 100;

    if (nuevo < 0) {
      throw new ErrorInventario(400, `No hay suficiente stock. Disponible: ${anterior}`);
    }
    if (nuevo > MAX) throw new ErrorInventario(400, "El stock resultante es demasiado grande");

    await conexion.query("UPDATE insumos SET stock = ? WHERE id = ?", [nuevo, req.params.id]);

    await conexion.query(
      `INSERT INTO movimientos_inventario
         (insumo_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.id,
        req.usuario.id,
        tipo,
        tipo === "ajuste" ? Math.abs(nuevo - anterior) : cantidad,
        anterior,
        nuevo,
        motivo || null,
      ]
    );

    await conexion.commit();

    const [rows] = await pool.query(`${SELECT_INSUMO} WHERE id = ?`, [req.params.id]);
    res.json({ ok: true, data: formato(rows[0]) });
  } catch (err) {
    await conexion.rollback();

    if (err instanceof ErrorInventario) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }

    console.error("Error al registrar el movimiento:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al registrar el movimiento" });
  } finally {
    conexion.release();
  }
};