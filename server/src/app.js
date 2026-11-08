import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import serviciosRoutes from "./routes/servicios.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});