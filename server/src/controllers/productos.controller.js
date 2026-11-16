import { pool } from "../config/db.js";

const TIPOS_VARIANTE = ["Color", "Talla", "Modelo"];
const MAX_PRECIO = 1000000;
const MAX_VARIANTES = 30;
const MAX_STOCK = 9999;

const cargarProductos = async (conexion, filtro = "", params = []) => {
  const [productos] = await conexion.query(
    `SELECT id, nombre, descripcion, categoria, precio, imagen_url, tipo_variante, activo
     FROM productos ${filtro}
     ORDER BY categoria, nombre`,
    params
  );
  if (productos.length === 0) return [];

  const [variantes] = await conexion.query(
    `SELECT id, producto_id, nombre, stock
     FROM variantes_producto
     WHERE producto_id IN (?) AND activo = TRUE
     ORDER BY id`,
    [productos.map((p) => p.id)]
  );

  return productos.map((p) => {
    const propias = variantes
      .filter((v) => v.producto_id === p.id)
      .map(({ id, nombre, stock }) => ({ id, nombre, stock }));

    return {
      ...p,
      precio: Number(p.precio),
      activo: Boolean(p.activo),
      variantes: propias,
      stock_total: propias.reduce((suma, v) => suma + v.stock, 0),
    };
  });
};

const validarProducto = (d = {}) => {
  const nombre = typeof d.nombre === "string" ? d.nombre.trim() : "";
  const descripcion = typeof d.descripcion === "string" ? d.descripcion.trim() : "";
  const categoria =
    typeof d.categoria === "string" && d.categoria.trim() ? d.categoria.trim() : "Accesorios";
  const imagen = typeof d.imagen_url === "string" ? d.imagen_url.trim() : "";
  const precio = Number(d.precio);

  if (nombre.length < 2 || nombre.length > 120) {
    return { error: "El nombre debe tener entre 2 y 120 caracteres" };
  }
  if (descripcion.length > 500) return { error: "La descripción es demasiado larga" };
  if (categoria.length > 60) return { error: "La categoría es demasiado larga" };
  if (!Number.isFinite(precio) || precio <= 0 || precio > MAX_PRECIO) {
    return { error: "El precio no es válido" };
  }
  if (!TIPOS_VARIANTE.includes(d.tipo_variante)) {
    return { error: "El tipo de variante no es válido" };
  }
  if (imagen && (!/^https?:\/\//i.test(imagen) || imagen.length > 500)) {
    return { error: "La imagen debe ser un enlace que empiece con http:// o https://" };
  }

  const entrada = Array.isArray(d.variantes) ? d.variantes : [];
  if (entrada.length === 0 || entrada.length > MAX_VARIANTES) {
    return { error: `Agrega entre 1 y ${MAX_VARIANTES} variantes` };
  }

  const variantes = entrada.map((v) => ({
    id: Number.isInteger(Number(v?.id)) && Number(v.id) > 0 ? Number(v.id) : null,
    nombre: typeof v?.nombre === "string" ? v.nombre.trim() : "",
    stock: Number(v?.stock),
  }));

  for (const v of variantes) {
    if (v.nombre.length < 1 || v.nombre.length > 60) {
      return { error: "Cada variante necesita un nombre (máximo 60 caracteres)" };
    }
    if (!Number.isInteger(v.stock) || v.stock < 0 || v.stock > MAX_STOCK) {
      return { error: "El stock de cada variante debe ser un número entero entre 0 y 9999" };
    }
  }

  const nombres = variantes.map((v) => v.nombre.toLowerCase());
  if (new Set(nombres).size !== nombres.length) {
    return { error: "Hay variantes con el mismo nombre" };
  }

  return {
    valores: {
      nombre,
      descripcion: descripcion || null,
      categoria,
      precio,
      imagen: imagen || null,
      tipo: d.tipo_variante,
    },
    variantes,
  };
};

export const obtenerProductosGestion = async (req, res) => {
  try {
    const data = await cargarProductos(pool);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener los productos:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los productos" });
  }
};

export const crearProducto = async (req, res) => {
  const { error, valores, variantes } = validarProducto(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.query(
      `INSERT INTO productos (nombre, descripcion, categoria, precio, imagen_url, tipo_variante)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [valores.nombre, valores.descripcion, valores.categoria, valores.precio, valores.imagen, valores.tipo]
    );

    await conexion.query("INSERT INTO variantes_producto (producto_id, nombre, stock) VALUES ?", [
      variantes.map((v) => [resultado.insertId, v.nombre, v.stock]),
    ]);

    await conexion.commit();

    const [creado] = await cargarProductos(pool, "WHERE id = ?", [resultado.insertId]);
    res.status(201).json({ ok: true, data: creado });
  } catch (err) {
    await conexion.rollback();
    console.error("Error al crear el producto:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el producto" });
  } finally {
    conexion.release();
  }
};

export const actualizarProducto = async (req, res) => {
  const { error, valores, variantes } = validarProducto(req.body);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const activo = typeof req.body?.activo === "boolean" ? req.body.activo : null;
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [existe] = await conexion.query("SELECT id FROM productos WHERE id = ? FOR UPDATE", [
      req.params.id,
    ]);
    if (existe.length === 0) {
      await conexion.rollback();
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    await conexion.query(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, imagen_url = ?,
           tipo_variante = ?, activo = COALESCE(?, activo)
       WHERE id = ?`,
      [
        valores.nombre,
        valores.descripcion,
        valores.categoria,
        valores.precio,
        valores.imagen,
        valores.tipo,
        activo,
        req.params.id,
      ]
    );

    const [actuales] = await conexion.query(
      "SELECT id FROM variantes_producto WHERE producto_id = ? AND activo = TRUE",
      [req.params.id]
    );
    const idsActuales = new Set(actuales.map((v) => v.id));
    const idsConservados = new Set();

    for (const v of variantes) {
      if (v.id && idsActuales.has(v.id)) {
        await conexion.query("UPDATE variantes_producto SET nombre = ?, stock = ? WHERE id = ?", [
          v.nombre,
          v.stock,
          v.id,
        ]);
        idsConservados.add(v.id);
      } else {
        await conexion.query(
          "INSERT INTO variantes_producto (producto_id, nombre, stock) VALUES (?, ?, ?)",
          [req.params.id, v.nombre, v.stock]
        );
      }
    }

    // Las variantes que ya no vienen se archivan, no se borran
    const quitadas = [...idsActuales].filter((id) => !idsConservados.has(id));
    if (quitadas.length > 0) {
      await conexion.query("UPDATE variantes_producto SET activo = FALSE WHERE id IN (?)", [quitadas]);
    }

    await conexion.commit();

    const [actualizado] = await cargarProductos(pool, "WHERE id = ?", [req.params.id]);
    res.json({ ok: true, data: actualizado });
  } catch (err) {
    await conexion.rollback();
    console.error("Error al actualizar el producto:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar el producto" });
  } finally {
    conexion.release();
  }
};