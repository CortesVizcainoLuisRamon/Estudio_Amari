import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Las citas se guardan en hora local del estudio. En la nube el reloj va en UTC,
// así que se fija la zona de México (sin horario de verano desde 2022).
export const ZONA_HORARIA = "America/Mexico_City";
const DESFASE_SQL = "-06:00";

// Las bases en la nube (TiDB Cloud, Aiven...) exigen conexión cifrada: DB_SSL=true
const usaSsl = process.env.DB_SSL === "true";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: usaSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
});

// NOW(), TIMESTAMPDIFF... deben medir con la hora de México, no con la del servidor de la base
pool.on("connection", (conexion) => {
  conexion.query(`SET time_zone = '${DESFASE_SQL}'`, (err) => {
    if (err) console.error("No se pudo fijar la zona horaria de la conexión:", err.message);
  });
});
