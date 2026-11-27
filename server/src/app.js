import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, ZONA_HORARIA } from "./config/db.js";
import serviciosRoutes from "./routes/servicios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import empleadosRoutes from "./routes/empleados.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import citasRoutes from "./routes/citas.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import notificacionesRoutes from "./routes/notificaciones.routes.js";
import perfilRoutes from "./routes/perfil.routes.js";
import clientesAccesoRoutes from "./routes/clientes-acceso.routes.js";
import imagenesRoutes from "./routes/imagenes.routes.js";
import { RAIZ_SUBIDAS } from "./config/subidas.js";

dotenv.config();

// Mismo horario del estudio en cualquier servidor (en la nube el reloj va en UTC)
process.env.TZ = ZONA_HORARIA;

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, mensaje: "API de Estudio Amari funcionando" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS resultado");
    res.json({ ok: true, mensaje: "Conexión a MySQL correcta", resultado: rows[0].resultado });
  } catch (error) {
    console.error("Error de base de datos:", error.message);
    res.status(500).json({ ok: false, mensaje: "No se pudo conectar a la base de datos" });
  }
});

app.use("/api/servicios", serviciosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/clientes", clientesAccesoRoutes);
app.use("/api/uploads", express.static(RAIZ_SUBIDAS, { maxAge: "30d", immutable: true, index: false }));
app.use("/api/imagenes", imagenesRoutes);

// Una ruta /api que no existe responde JSON, no la página del cliente
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
});

// En producción el mismo servidor entrega el cliente ya compilado (client/dist):
// un solo enlace, sin CORS. En desarrollo no existe dist y lo sirve Vite.
const aqui = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_CLIENTE = path.resolve(aqui, "../../client/dist");

if (fs.existsSync(path.join(CARPETA_CLIENTE, "index.html"))) {
  app.use(express.static(CARPETA_CLIENTE, { index: false, maxAge: "1h" }));
  // Cualquier otra ruta la resuelve React Router
  // (un archivo con extensión que no existe, como /assets/x.js, es un 404 real)
  app.get("/{*ruta}", (req, res) => {
    if (path.extname(req.path)) return res.status(404).end();
    res.sendFile(path.join(CARPETA_CLIENTE, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});