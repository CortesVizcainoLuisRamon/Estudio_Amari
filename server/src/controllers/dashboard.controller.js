import { pool } from "../config/db.js";
import { APERTURA_MIN, CIERRE_MIN } from "../config/horario.js";
import { SELECT_CITAS, adjuntarServicios } from "./citas.controller.js";

const dos = (n) => String(n).padStart(2, "0");
const textoFecha = (f) => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;

// "2026-11-09 14:30" -> minutos desde medianoche
const aMinutos = (t) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16));

export const obtenerDashboard = async (req, res) => {
  try {
    const ahora = new Date();
    const hoy = textoFecha(ahora);
    const diaHoy = ahora.getDay() === 0 ? 7 : ahora.getDay();
    const inicioMes = textoFecha(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    const inicioMesSig = textoFecha(new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1));

    const [[filasHoy], [pendientes], [empleadas], [ingresos], [top]] = await Promise.all([
      pool.query(
        `${SELECT_CITAS}
         WHERE c.inicio >= ? AND c.inicio < DATE_ADD(?, INTERVAL 1 DAY)
           AND c.estado NOT IN ('cancelada', 'no_asistio')
         ORDER BY c.inicio`,
        [hoy, hoy]
      ),
      pool.query("SELECT COUNT(*) AS n FROM citas WHERE estado = 'pendiente' AND inicio >= ?", [hoy]),
      pool.query(
        `SELECT e.id, e.color, e.dias_laborales, u.nombre, u.apellidos
         FROM empleados e
         JOIN usuarios u ON u.id = e.usuario_id
         WHERE e.activo = TRUE
         ORDER BY u.nombre`
      ),
      pool.query(
        `SELECT estado, COALESCE(SUM(total), 0) AS suma
         FROM citas
         WHERE inicio >= ? AND inicio < ? AND estado IN ('completada', 'confirmada')
         GROUP BY estado`,
        [inicioMes, inicioMesSig]
      ),
      pool.query(
        `SELECT s.nombre, COUNT(*) AS veces
         FROM cita_servicios cs
         JOIN citas c ON c.id = cs.cita_id
         JOIN servicios s ON s.id = cs.servicio_id
         WHERE c.inicio >= ? AND c.inicio < ? AND c.estado NOT IN ('cancelada', 'no_asistio')
         GROUP BY s.id, s.nombre
         ORDER BY veces DESC, s.nombre
         LIMIT 5`,
        [inicioMes, inicioMesSig]
      ),
    ]);

    const citasHoy = await adjuntarServicios(filasHoy);

    // Ocupación de hoy: minutos reservados / minutos de atención de quienes trabajan hoy
    const capacidad = CIERRE_MIN - APERTURA_MIN;

    const porEmpleada = empleadas
      .filter((e) => e.dias_laborales.split(",").map(Number).includes(diaHoy))
      .map((e) => {
        const ocupados = filasHoy
          .filter((c) => c.empleado_id === e.id)
          .reduce((suma, c) => suma + (aMinutos(c.fin) - aMinutos(c.inicio)), 0);

        return {
          id: e.id,
          nombre: `${e.nombre} ${e.apellidos}`,
          color: e.color,
          porcentaje: Math.min(100, Math.round((ocupados / capacidad) * 100)),
          ocupados,
        };
      });

    const totalOcupado = porEmpleada.reduce((suma, e) => suma + e.ocupados, 0);
    const totalCapacidad = porEmpleada.length * capacidad;

    const suma = (estado) => Number(ingresos.find((i) => i.estado === estado)?.suma ?? 0);

    res.json({
      ok: true,
      data: {
        fecha: hoy,
        citas_hoy: citasHoy,
        por_confirmar: pendientes[0].n,
        ocupacion: {
          porcentaje:
            totalCapacidad === 0 ? 0 : Math.min(100, Math.round((totalOcupado / totalCapacidad) * 100)),
          empleadas: porEmpleada,
        },
        ingresos: { completadas: suma("completada"), confirmadas: suma("confirmada") },
        servicios_top: top.map((s) => ({ nombre: s.nombre, veces: Number(s.veces) })),
      },
    });
  } catch (err) {
    console.error("Error al cargar el dashboard:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cargar el dashboard" });
  }
};

export const obtenerDashboardEmpleada = async (req, res) => {
  try {
    const [emp] = await pool.query(
      "SELECT id, comision_pct FROM empleados WHERE usuario_id = ?",
      [req.usuario.id]
    );

    if (emp.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Tu cuenta no tiene perfil de empleada" });
    }

    const empleadoId = emp[0].id;
    const comisionPct = Number(emp[0].comision_pct ?? 0);

    const ahora = new Date();
    const hoy = textoFecha(ahora);
    const inicioMes = textoFecha(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    const inicioMesSig = textoFecha(new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1));
    const hace6 = textoFecha(
      new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6)
    );

    const [[filasHoy], [mes], [dias], [top]] = await Promise.all([
      pool.query(
        `${SELECT_CITAS}
         WHERE c.empleado_id = ? AND c.inicio >= ? AND c.inicio < DATE_ADD(?, INTERVAL 1 DAY)
           AND c.estado NOT IN ('cancelada', 'no_asistio')
         ORDER BY c.inicio`,
        [empleadoId, hoy, hoy]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total), 0) AS ingresos, COUNT(DISTINCT cliente_id) AS clientas
         FROM citas
         WHERE empleado_id = ? AND estado = 'completada' AND inicio >= ? AND inicio < ?`,
        [empleadoId, inicioMes, inicioMesSig]
      ),
      pool.query(
        `SELECT DATE_FORMAT(inicio, '%Y-%m-%d') AS dia, COALESCE(SUM(total), 0) AS suma
         FROM citas
         WHERE empleado_id = ? AND estado = 'completada'
           AND inicio >= ? AND inicio < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY dia`,
        [empleadoId, hace6, hoy]
      ),
      pool.query(
        `SELECT s.nombre, COUNT(*) AS veces
         FROM cita_servicios cs
         JOIN citas c ON c.id = cs.cita_id
         JOIN servicios s ON s.id = cs.servicio_id
         WHERE c.empleado_id = ? AND c.inicio >= ? AND c.inicio < ?
           AND c.estado NOT IN ('cancelada', 'no_asistio')
         GROUP BY s.id, s.nombre
         ORDER BY veces DESC, s.nombre
         LIMIT 5`,
        [empleadoId, inicioMes, inicioMesSig]
      ),
    ]);

    const citasHoy = await adjuntarServicios(filasHoy);

    const ultimos7 = Array.from({ length: 7 }, (_, i) => {
      const dia = textoFecha(
        new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 6 + i)
      );
      return { dia, total: Number(dias.find((d) => d.dia === dia)?.suma ?? 0) };
    });

    const ingresosMes = Number(mes[0].ingresos);

    res.json({
      ok: true,
      data: {
        fecha: hoy,
        citas_hoy: citasHoy,
        completadas_hoy: citasHoy.filter((c) => c.estado === "completada").length,
        ingresos_mes: ingresosMes,
        comision_pct: comisionPct,
        comision_mes: Math.round(ingresosMes * comisionPct) / 100,
        clientas_mes: Number(mes[0].clientas),
        ultimos_7: ultimos7,
        servicios_top: top.map((s) => ({ nombre: s.nombre, veces: Number(s.veces) })),
      },
    });
  } catch (err) {
    console.error("Error al cargar el dashboard de la empleada:", err.message);
    res.status(500).json({ ok: false, mensaje: "Error al cargar tu resumen" });
  }
};