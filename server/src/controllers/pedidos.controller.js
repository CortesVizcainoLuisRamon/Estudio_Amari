import { pool } from "../config/db.js";

const METODOS = ["transferencia", "efectivo"];
const ESTADOS = ["pendiente", "confirmado", "entregado", "cancelado"];
const MAX_LINEAS = 20;
const MAX_CANTIDAD = 20;

// Qué cambios de estado se permiten
const TRANSICIONES = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

class ErrorPedido extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const clienteDeUsuario = async (usuarioId) => {
  const [rows] = await pool.query("SELECT id FROM clientes WHERE usuario_id = ?", [usuarioId]);
  return rows[0]?.id ?? null;
};

const SELECT_PEDIDO = `
  SELECT p.id, p.estado, p.metodo_pago, p.total,
         DATE_FORMAT(p.creado_en, '%Y-%m-%d %H:%i') AS creado_en,
         TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellidos, ''))) AS cliente,
         cl.telefono
  FROM pedidos p
  JOIN clientes cl ON cl.id = p.cliente_id
`;

const cargarPedidos = async (filtro = "", params = []) => {
  const [pedidos] = await pool.query(`${SELECT_PEDIDO} ${filtro} ORDER BY p.id DESC LIMIT 200`, params);
  if (pedidos.length === 0) return [];

  const [items] = await pool.query(
    `SELECT pedido_id, producto, variante, precio, cantidad
     FROM pedido_items WHERE pedido_id IN (?) ORDER BY id`,
    [pedidos.map((p) => p.id)]
  );

  return pedidos.map((p) => ({
    ...p,
    total: Number(p.total),
    items: items
      .filter((i) => i.pedido_id === p.id)
      .map((i) => ({
        producto: i.producto,
        variante: i.variante,
        precio: Number(i.precio),
        cantidad: i.cantidad,
      })),
  }));
};

export const crearPedido = async (req, res) => {
  const d = req.body ?? {};
  const entrada = Array.isArray(d.items) ? d.items : [];

  if (!METODOS.includes(d.metodo_pago)) {
    return res.status(400).json({ ok: false, mensaje: "Elige un método de pago" });
  }
  if (entrada.length === 0 || entrada.length > MAX_LINEAS) {
    return res.status(400).json({ ok: false, mensaje: "Tu carrito está vacío o tiene demasiados productos" });
  }

  const pedidas = new Map(); // variante_id -> cantidad
  for (const it of entrada) {
    const id = Number(it?.variante_id);
    const cantidad = Number(it?.cantidad);

    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(cantidad) || cantidad < 1) {
      return res.status(400).json({ ok: false, mensaje: "Los productos del carrito no son válidos" });
    }

    const suma = (pedidas.get(id) ?? 0) + cantidad;
    if (suma > MAX_CANTIDAD) {
      return res.status(400).json({ ok: false, mensaje: `Máximo ${MAX_CANTIDAD} piezas por producto` });
    }
    pedidas.set(id, suma);
  }

  const conexion = await pool.getConnection();

  try {
    const clienteId = await clienteDeUsuario(req.usuario.id);
    if (!clienteId) throw new ErrorPedido(403, "Tu cuenta no tiene perfil de clienta");

    await conexion.beginTransaction();

    const ids = [...pedidas.keys()].sort((a, b) => a - b);

    // Se bloquean las variantes: dos pedidos simultáneos no pueden llevarse la misma última pieza
    const [filas] = await conexion.query(
      `SELECT v.id, v.nombre AS variante, v.stock, p.nombre AS producto, p.precio, p.activo AS producto_activo
       FROM variantes_producto v
       JOIN productos p ON p.id = v.producto_id
       WHERE v.id IN (?) AND v.activo = TRUE
       ORDER BY v.id
       FOR UPDATE`,
      [ids]
    );

    if (filas.length !== ids.length) {
      throw new ErrorPedido(409, "Alguno de los productos de tu carrito ya no está disponible");
    }

    let total = 0;
    for (const f of filas) {
      const cantidad = pedidas.get(f.id);
      const nombre = `${f.producto} (${f.variante})`;

      if (!f.producto_activo) throw new ErrorPedido(409, `"${f.producto}" ya no está disponible`);
      if (f.stock <= 0) throw new ErrorPedido(409, `"${nombre}" se agotó`);
      if (f.stock < cantidad) {
        throw new ErrorPedido(409, `Solo quedan ${f.stock} pieza(s) de "${nombre}"`);
      }

      total += Number(f.precio) * cantidad;
    }

    const [pedido] = await conexion.query(
      "INSERT INTO pedidos (cliente_id, metodo_pago, total) VALUES (?, ?, ?)",
      [clienteId, d.metodo_pago, Math.round(total * 100) / 100]
    );

    await conexion.query(
      "INSERT INTO pedido_items (pedido_id, variante_id, producto, variante, precio, cantidad) VALUES ?",
      [filas.map((f) => [pedido.insertId, f.id, f.producto, f.variante, f.precio, pedidas.get(f.id)])]
    );

    for (const f of filas) {
      await conexion.query("UPDATE variantes_producto SET stock = stock - ? WHERE id = ?", [
        pedidas.get(f.id),
        f.id,
      ]);
    }

    await conexion.commit();

    const [creado] = await cargarPedidos("WHERE p.id = ?", [pedido.insertId]);
    res.status(201).json({ ok: true, data: creado });
  } catch (err) {
    await conexion.rollback();

    if (err instanceof ErrorPedido) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }

    console.error("Error al crear el pedido:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al crear el pedido" });
  } finally {
    conexion.release();
  }
};

// Cambia el estado de un pedido. Si se cancela, las piezas regresan al stock.
const moverPedido = async ({ id, nuevo, clienteId = null, soloDesde = null }) => {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filas] = await conexion.query(
      `SELECT estado FROM pedidos WHERE id = ? ${clienteId ? "AND cliente_id = ?" : ""} FOR UPDATE`,
      clienteId ? [id, clienteId] : [id]
    );
    if (filas.length === 0) throw new ErrorPedido(404, "Pedido no encontrado");

    const actual = filas[0].estado;

    if (soloDesde && actual !== soloDesde) {
      throw new ErrorPedido(
        400,
        "Solo puedes cancelar pedidos pendientes. Comunícate con el estudio."
      );
    }
    if (!TRANSICIONES[actual].includes(nuevo)) {
      throw new ErrorPedido(400, `No se puede cambiar un pedido ${actual} a ${nuevo}`);
    }

    await conexion.query(
      "UPDATE pedidos SET estado = ?, entregado_en = IF(? = 'entregado', NOW(), entregado_en) WHERE id = ?",
      [nuevo, nuevo, id]
    );
    if (nuevo === "cancelado") {
      await conexion.query(
        `UPDATE variantes_producto v
         JOIN pedido_items i ON i.variante_id = v.id
         SET v.stock = v.stock + i.cantidad
         WHERE i.pedido_id = ?`,
        [id]
      );
    }

    await conexion.commit();
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }

  const [pedido] = await cargarPedidos("WHERE p.id = ?", [id]);
  return pedido;
};

export const obtenerMisPedidos = async (req, res) => {
  try {
    const clienteId = await clienteDeUsuario(req.usuario.id);
    if (!clienteId) return res.json({ ok: true, total: 0, data: [] });

    const data = await cargarPedidos("WHERE p.cliente_id = ?", [clienteId]);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener mis pedidos:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener tus pedidos" });
  }
};

export const cancelarMiPedido = async (req, res) => {
  try {
    const clienteId = await clienteDeUsuario(req.usuario.id);
    if (!clienteId) {
      return res.status(403).json({ ok: false, mensaje: "Tu cuenta no tiene perfil de clienta" });
    }

    const data = await moverPedido({
      id: Number(req.params.id),
      nuevo: "cancelado",
      clienteId,
      soloDesde: "pendiente",
    });
    res.json({ ok: true, data });
  } catch (err) {
    if (err instanceof ErrorPedido) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    console.error("Error al cancelar el pedido:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cancelar el pedido" });
  }
};

export const obtenerPedidos = async (req, res) => {
  const { estado } = req.query;

  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: "El estado no es válido" });
  }

  try {
    const data = estado
      ? await cargarPedidos("WHERE p.estado = ?", [estado])
      : await cargarPedidos();
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    console.error("Error al obtener los pedidos:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al obtener los pedidos" });
  }
};

export const cambiarEstadoPedido = async (req, res) => {
  const estado = req.body?.estado;

  if (!ESTADOS.includes(estado) || estado === "pendiente") {
    return res.status(400).json({ ok: false, mensaje: "El estado no es válido" });
  }

  try {
    const data = await moverPedido({ id: Number(req.params.id), nuevo: estado });
    res.json({ ok: true, data });
  } catch (err) {
    if (err instanceof ErrorPedido) {
      return res.status(err.status).json({ ok: false, mensaje: err.message });
    }
    console.error("Error al cambiar el estado del pedido:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cambiar el estado del pedido" });
  }
};