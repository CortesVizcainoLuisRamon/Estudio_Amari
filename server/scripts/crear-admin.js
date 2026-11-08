import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

const [email, password, nombre = "Administrador", apellidos = "Amari"] = process.argv.slice(2);

if (!email || !password) {
  console.log('Uso: node scripts/crear-admin.js correo contraseña "Nombre" "Apellidos"');
  process.exit(1);
}

if (password.length < 8) {
  console.log("La contraseña debe tener al menos 8 caracteres");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol)
     VALUES (?, ?, ?, ?, 'admin')`,
    [nombre, apellidos, email.trim().toLowerCase(), hash]
  );
  console.log(`Administrador creado: ${email}`);
} catch (error) {
  console.error("No se pudo crear el administrador:", error.message);
} finally {
  await pool.end();
}