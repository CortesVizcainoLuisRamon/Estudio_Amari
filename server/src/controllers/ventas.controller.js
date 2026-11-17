import { pool } from "../config/db.js";

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366;

const dos = (n) => String(n).padStart(2, "0");
const textoFecha = (f) => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;

const fechaValida = (f) => {
  if (typeof f !== "string" || !FECHA_REGEX.test(f)) return false;
  const [a, m, d] = f.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  return fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d;
};

const aFecha = (f) => {
  const [a, m, d] = f.split("-").map(Number);
  return new Date(a, m - 1, d);
};

const RANGO_CITAS = "c.estado = 'completada' AND c.inicio >= ? AND c.inicio < DATE_ADD(?, INTERVAL 1 DAY)";
const RANGO_PEDIDOS =
  "p.estado = 'entregado' AND p.entregado_en >= ? AND p.entregado_en < DATE_ADD(?, INTERVAL 1 DAY)";

export const obtenerVentas = async (req, res) => {
  const { desde, hasta } = req.query;

  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) {
    return res.status(400).json({ ok: false, mensaje: "Indica un rango de fechas válido (desde y hasta)" });
  }

  const totalDias = Math.round((aFecha(hasta) - aFecha(desde)) / 86400000) + 1;
  if (totalDias > MAX_DIAS) {
    return res.status(400).json({ ok: false, mensaje: "El rango máximo es de un año" });
  }

  const p = [desde, hasta];

  try {
    const [
      [totalesCitas],
      [totalesPedidos],
      [diasCitas],
      [diasPedidos],
      [serviciosTop],
      [productosTop],
      [comisiones],
      [movCitas],
      [movPedidos],
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS n, COALESCE(SUM(c.total), 0) AS ingresos, COALESCE(SUM(c.descuento), 0) AS descuentos
         FROM citas c WHERE ${RANGO_CITAS}`,
        p
      ),
      pool.query(
        `SELECT COUNT(*) AS n, COALESCE(SUM(p.total), 0) AS ingresos
         FROM pedidos p WHERE ${RANGO_PEDIDOS}`,
        p
      ),
      pool.query(
        `SELECT DATE_FORMAT(c.inicio, '%Y-%m-%d') AS dia, SUM(c.total) AS suma
         FROM citas c WHERE ${RANGO_CITAS} GROUP BY dia`,
        p
      ),
      pool.query(
        `SELECT DATE_FORMAT(p.entregado_en, '%Y-%m-%d') AS dia, SUM(p.total) AS suma
         FROM pedidos p WHERE ${RANGO_PEDIDOS} GROUP BY dia`,
        p
      ),
      pool.query(
        `SELECT s.nombre, COUNT(*) AS veces, COALESCE(SUM(cs.precio), 0) AS valor
         FROM cita_servicios cs
         JOIN citas c ON c.id = cs.cita_id
         JOIN servicios s ON s.id = cs.servicio_id
         WHERE ${RANGO_CITAS}
         GROUP BY s.id, s.nombre
         ORDER BY veces DESC, valor DESC
         LIMIT 5`,
        p
      ),
      pool.query(
        `SELECT i.producto, SUM(i.cantidad) AS piezas, SUM(i.precio * i.cantidad) AS valor
         FROM pedido_items i
         JOIN pedidos p ON p.id = i.pedido_id
         WHERE ${RANGO_PEDIDOS}
         GROUP BY i.producto
         ORDER BY piezas DESC, valor DESC
         LIMIT 5`,
        p
      ),
      pool.query(
        `SELECT e.id, e.color, e.comision_pct,
                TRIM(CONCAT(u.nombre, ' ', u.apellidos)) AS nombre,
                COUNT(c.id) AS citas, COALESCE(SUM(c.total), 0) AS ingresos
         FROM empleados e
         JOIN usuarios u ON u.id = e.usuario_id
         LEFT JOIN citas c ON c.empleado_id = e.id AND ${RANGO_CITAS}
         WHERE e.activo = TRUE OR c.id IS NOT NULL
         GROUP BY e.id, e.color, e.comision_pct, u.nombre, u.apellidos
         ORDER BY ingresos DESC`,
        p
      ),
      pool.query(
        `SELECT c.id, DATE_FORMAT(c.inicio, '%Y-%m-%d %H:%i') AS fecha, c.total, c.descuento,
                TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellidos, ''))) AS cliente,
                (SELECT GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ')
                 FROM cita_servicios cs JOIN servicios s ON s.id = cs.servicio_id
                 WHERE cs.cita_id = c.id) AS concepto
         FROM citas c
         JOIN clientes cl ON cl.id = c.cliente_id
         WHERE ${RANGO_CITAS}
         ORDER BY c.inicio DESC
         LIMIT 100`,
        p
      ),
      pool.query(
        `SELECT p.id, DATE_FORMAT(p.entregado_en, '%Y-%m-%d %H:%i') AS fecha, p.total,
                TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellidos, ''))) AS cliente,
                (SELECT GROUP_CONCAT(CONCAT(i.producto, ' (', i.variante, ') ×', i.cantidad) SEPARATOR ', ')
                 FROM pedido_items i WHERE i.pedido_id = p.id) AS concepto
         FROM pedidos p
         JOIN clientes cl ON cl.id = p.cliente_id
         WHERE ${RANGO_PEDIDOS}
         ORDER BY p.entregado_en DESC
         LIMIT 100`,
        p
      ),
    ]);

    const [a, m, d] = desde.split("-").map(Number);
    const porServicios = new Map(diasCitas.map((r) => [r.dia, Number(r.suma)]));
    const porBoutique = new Map(diasPedidos.map((r) => [r.dia, Number(r.suma)]));

    const porDia = Array.from({ length: totalDias }, (_, i) => {
      const dia = textoFecha(new Date(a, m - 1, d + i));
      return { dia, servicios: porServicios.get(dia) ?? 0, boutique: porBoutique.get(dia) ?? 0 };
    });

    const ingresosServicios = Number(totalesCitas[0].ingresos);
    const ingresosBoutique = Number(totalesPedidos[0].ingresos);

    const movimientos = [
      ...movCitas.map((r) => ({
        tipo: "servicio",
        referencia: `Cita #${r.id}`,
        fecha: r.fecha,
        cliente: r.cliente,
        concepto: r.concepto,
        total: Number(r.total),
        descuento: Number(r.descuento),
      })),
      ...movPedidos.map((r) => ({
        tipo: "boutique",
        referencia: `Pedido #${r.id}`,
        fecha: r.fecha,
        cliente: r.cliente,
        concepto: r.concepto,
        total: Number(r.total),
        descuento: 0,
      })),
    ]
      .sort((x, y) => (x.fecha < y.fecha ? 1 : -1))
      .slice(0, 100);

    res.json({
      ok: true,
      data: {
        desde,
        hasta,
        resumen: {
          total: ingresosServicios + ingresosBoutique,
          servicios: ingresosServicios,
          citas: totalesCitas[0].n,
          boutique: ingresosBoutique,
          pedidos: totalesPedidos[0].n,
          descuentos: Number(totalesCitas[0].descuentos),
        },
        por_dia: porDia,
        servicios_top: serviciosTop.map((s) => ({
          nombre: s.nombre,
          veces: Number(s.veces),
          valor: Number(s.valor),
        })),
        productos_top: productosTop.map((x) => ({
          nombre: x.producto,
          piezas: Number(x.piezas),
          valor: Number(x.valor),
        })),
        comisiones: comisiones.map((e) => {
          const ingresos = Number(e.ingresos);
          const pct = Number(e.comision_pct ?? 0);
          return {
            id: e.id,
            nombre: e.nombre,
            color: e.color,
            citas: Number(e.citas),
            ingresos,
            comision_pct: pct,
            comision: Math.round(ingresos * pct) / 100,
          };
        }),
        movimientos,
      },
    });
  } catch (err) {
    console.error("Error al calcular las ventas:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al calcular las ventas" });
  }
};