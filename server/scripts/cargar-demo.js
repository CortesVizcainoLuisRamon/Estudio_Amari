// Carga (o reinicia) los datos de demostración de Estudio Amari.
//
// Uso:  node scripts/cargar-demo.js --confirmar
//
// ATENCIÓN: borra TODAS las citas, clientas, empleadas, inventario, productos, pedidos y
// notificaciones, y los usuarios @demo.estudio-amari.com, para volver a crearlos. Conserva el
// catálogo de servicios y las cuentas que no sean de demostración (por ejemplo, tu administrador).
// Las fechas son relativas a hoy, así que conviene volver a ejecutarlo de vez en cuando.
import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

const CLAVE_DEMO = "Demo1234!";
const DOMINIO_DEMO = "demo.estudio-amari.com";

// Catálogo esperado (ids 1 al 29). Si no coincide, el script se detiene sin borrar nada.
const CATALOGO = [
  "Makeup novias", "Makeup quinceañeras", "Makeup eventos sociales (graduaciones)", "Depilación de rostro",
  "Soft gel", "Uñas acrílicas", "Gelish", "Baño de acrílico", "Manicure y spa", "Retiro de acrílico y gelish",
  "Corte de dama", "Corte de caballero", "Tintes y efectos de color", "Tratamientos capilares",
  "Alaciado express", "Ondulado de cabello", "Alto peinado", "Pestañas clásica", "Pestañas híbridas",
  "Pestañas wispy", "Pestañas rimel", "Pestañas efecto mojado", "Pestañas volumen artesanal",
  "Pestañas mega volumen artesanal", "Levantamiento + pigmentación de pestañas",
  "Aplicación de pestañas en tira", "Aplicación de pestañas en grupo",
  "Cejas: laminado + diseño + henna + perfilado", "Cejas: laminado + diseño + perfilado",
];

if (!process.argv.includes("--confirmar")) {
  console.log("Este script BORRA las citas, clientas, empleadas, inventario, productos, pedidos y");
  console.log("notificaciones actuales, y carga datos de demostración nuevos.");
  console.log("Si es lo que quieres, ejecútalo así:  node scripts/cargar-demo.js --confirmar");
  process.exit(0);
}

// ---------- utilidades ----------
let semilla = 7; // misma "casualidad" en cada ejecución
const azar = () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
const ponderado = (opciones, pesos) => {
  let r = azar() * pesos.reduce((s, p) => s + p, 0);
  for (let i = 0; i < opciones.length; i++) {
    r -= pesos[i];
    if (r < 0) return opciones[i];
  }
  return opciones[opciones.length - 1];
};

const insertar = async (sql, params) => {
  const [r] = await pool.query(sql, params);
  return r.insertId;
};

// ---------- principal ----------
try {
  const [catalogo] = await pool.query("SELECT id, nombre FROM servicios ORDER BY id");
  const coincide =
    catalogo.length === CATALOGO.length && catalogo.every((s, i) => s.id === i + 1 && s.nombre === CATALOGO[i]);
  if (!coincide) {
    throw new Error("El catálogo de servicios no es el esperado (29 servicios con ids 1 al 29). No se borró nada.");
  }

  console.log("1/7 Limpiando datos anteriores...");
  for (const tabla of [
    "pedido_items", "pedidos", "notificaciones", "movimientos_inventario", "insumos", "variantes_producto",
    "productos", "cita_servicios", "citas", "empleado_servicio", "empleados", "clientes",
  ]) {
    await pool.query(`DELETE FROM ${tabla}`);
  }
  await pool.query("DELETE FROM usuarios WHERE email LIKE ?", [`%@${DOMINIO_DEMO}`]);

  console.log("2/7 Precios y fidelidad de los servicios...");
  await pool.query(`UPDATE servicios SET precio = CASE nombre
    WHEN 'Makeup novias' THEN NULL
    WHEN 'Makeup quinceañeras' THEN 900 WHEN 'Makeup eventos sociales (graduaciones)' THEN 700
    WHEN 'Depilación de rostro' THEN 120 WHEN 'Soft gel' THEN 450 WHEN 'Uñas acrílicas' THEN 520
    WHEN 'Gelish' THEN 380 WHEN 'Baño de acrílico' THEN 420 WHEN 'Manicure y spa' THEN 250
    WHEN 'Retiro de acrílico y gelish' THEN 150 WHEN 'Corte de dama' THEN 350 WHEN 'Corte de caballero' THEN 200
    WHEN 'Tintes y efectos de color' THEN 800 WHEN 'Tratamientos capilares' THEN 600 WHEN 'Alaciado express' THEN 700
    WHEN 'Ondulado de cabello' THEN 500 WHEN 'Alto peinado' THEN 500 WHEN 'Pestañas clásica' THEN 450
    WHEN 'Pestañas híbridas' THEN 520 WHEN 'Pestañas wispy' THEN 550 WHEN 'Pestañas rimel' THEN 480
    WHEN 'Pestañas efecto mojado' THEN 560 WHEN 'Pestañas volumen artesanal' THEN 650
    WHEN 'Pestañas mega volumen artesanal' THEN 750 ELSE 300 END`);
  await pool.query(
    "UPDATE servicios SET precio_desde = 1 WHERE nombre IN ('Makeup quinceañeras','Tintes y efectos de color','Alto peinado')"
  );
  await pool.query(
    "UPDATE servicios SET requiere_patch_test = 1 WHERE nombre LIKE 'Pestañas%' OR nombre LIKE 'Tintes%'"
  );
  await pool.query(
    "UPDATE servicios SET aplica_fidelidad = 1 WHERE nombre IN ('Corte de dama','Gelish','Manicure y spa','Alto peinado','Pestañas clásica')"
  );

  const [servicios] = await pool.query("SELECT id, precio, duracion_min FROM servicios");
  const PRECIO = Object.fromEntries(servicios.map((s) => [s.id, s.precio === null ? null : Number(s.precio)]));
  const DUR = Object.fromEntries(servicios.map((s) => [s.id, s.duracion_min]));

  console.log("3/7 Usuarios, empleadas y clientas...");
  const hash = await bcrypt.hash(CLAVE_DEMO, 10);
  const crearUsuario = (nombre, apellidos, alias, telefono, rol) =>
    insertar(
      "INSERT INTO usuarios (nombre, apellidos, email, telefono, password_hash, rol) VALUES (?,?,?,?,?,?)",
      [nombre, apellidos, `${alias}@${DOMINIO_DEMO}`, telefono, hash, rol]
    );

  const uAdmin = await crearUsuario("Lucía", "Ramírez Soto", "admin", "5512345678", "admin");
  const uLiz = await crearUsuario("Liz", "Hernández Vega", "empleada", "5511112222", "empleado");
  const uValeria = await crearUsuario("Valeria", "Ortiz Mena", "valeria", "5533334444", "empleado");
  const uDaniela = await crearUsuario("Daniela", "Cruz Lara", "daniela", "5544445555", "empleado");
  const uMaria = await crearUsuario("María Luisa", "Rojas Reyes", "clienta", "5566667777", "cliente");
  const uFernanda = await crearUsuario("Fernanda", "Morales Díaz", "fernanda", "5577778888", "cliente");
  const uKarla = await crearUsuario("Karla", "Jiménez Paz", "karla", "5588889999", "cliente");
  await pool.query("UPDATE usuarios SET creado_en = DATE_SUB(NOW(), INTERVAL 210 DAY) WHERE id = ?", [uMaria]);

  const crearEmpleada = (usuario, puesto, comision, color, dias) =>
    insertar("INSERT INTO empleados (usuario_id, puesto, comision_pct, color, dias_laborales) VALUES (?,?,?,?,?)", [
      usuario, puesto, comision, color, dias,
    ]);
  const eLiz = await crearEmpleada(uLiz, "Estilista y manicurista", 30, "#e879f9", "1,2,3,4,5,6");
  const eValeria = await crearEmpleada(uValeria, "Lashista", 35, "#38bdf8", "1,2,3,4,5,6");
  const eDaniela = await crearEmpleada(uDaniela, "Estilista", 30, "#fbbf24", "2,3,4,5,6");

  const SERV_EMPLEADA = new Map([
    [eLiz, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]],
    [eValeria, [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 4]],
    [eDaniela, [1, 2, 3, 11, 13, 14, 15, 16, 17, 12]],
  ]);
  for (const [empleada, lista] of SERV_EMPLEADA) {
    await pool.query("INSERT INTO empleado_servicio (empleado_id, servicio_id) VALUES ?", [
      lista.map((s) => [empleada, s]),
    ]);
  }

  const crearCliente = (usuario, nombre, apellidos, telefono, email, nacimiento, notas) =>
    insertar(
      `INSERT INTO clientes (usuario_id, nombre, apellidos, telefono, email, fecha_nacimiento, notas, creado_en)
       VALUES (?,?,?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [usuario, nombre, apellidos, telefono, email, nacimiento, notas, entre(20, 400)]
    );
  const c = {
    maria: await crearCliente(uMaria, "María Luisa", "Rojas Reyes", "5566667777", `clienta@${DOMINIO_DEMO}`, "1996-03-14", "Prefiere tonos nude."),
    fernanda: await crearCliente(uFernanda, "Fernanda", "Morales Díaz", "5577778888", `fernanda@${DOMINIO_DEMO}`, "1992-07-02", null),
    karla: await crearCliente(uKarla, "Karla", "Jiménez Paz", "5588889999", `karla@${DOMINIO_DEMO}`, null, "Alergia leve al látex."),
    ana: await crearCliente(null, "Ana Paula", "Gómez Ruiz", "5599990000", "anapau@correo.com", "1999-11-30", null),
    sofia: await crearCliente(null, "Sofía", "Herrera León", "5500001111", null, null, null),
    regina: await crearCliente(null, "Regina", "Castillo Núñez", "5511223344", "regina@correo.com", "1988-01-21", "Clienta frecuente de pestañas."),
    valentina: await crearCliente(null, "Valentina", "Paredes Ibarra", "5522334455", null, null, null),
    isabel: await crearCliente(null, "Isabel", "Navarro Solís", "5533445566", "isa.navarro@correo.com", "1994-09-09", null),
    renata: await crearCliente(null, "Renata", "Fuentes Aguilar", "5544556677", null, "2001-05-17", null),
  };

  console.log("4/7 Citas (próximas e historial de ~100 días)...");
  const INICIO = "CONCAT(DATE_ADD(CURDATE(), INTERVAL ? DAY), ' ', ?)";
  const crearCita = async (cliente, empleada, dia, hora, servs, estado, canje = 0, notas = null) => {
    const duracion = servs.reduce((s, id) => s + DUR[id], 0);
    const precios = servs.map((id) => PRECIO[id] ?? 0);
    let total = precios.reduce((s, p) => s + p, 0);
    const descuento = canje ? precios[0] : 0;
    total -= descuento;
    const id = await insertar(
      `INSERT INTO citas (cliente_id, empleado_id, inicio, fin, total, estado, notas, canje_fidelidad, descuento)
       VALUES (?,?, ${INICIO}, DATE_ADD(${INICIO}, INTERVAL ? MINUTE), ?,?,?,?,?)`,
      [cliente, empleada, dia, `${hora}:00`, dia, `${hora}:00`, duracion, total, estado, notas, canje, descuento]
    );
    await pool.query("INSERT INTO cita_servicios (cita_id, servicio_id, precio, duracion_min) VALUES ?", [
      servs.map((s) => [id, s, PRECIO[s], DUR[s]]),
    ]);
    return id;
  };

  // Hoy
  await crearCita(c.fernanda, eLiz, 0, "10:00", [7], "completada");
  await crearCita(c.regina, eValeria, 0, "10:30", [18], "completada");
  await crearCita(c.ana, eLiz, 0, "12:00", [11], "confirmada");
  await crearCita(c.karla, eValeria, 0, "12:00", [19], "confirmada");
  await crearCita(c.isabel, eDaniela, 0, "13:00", [13], "confirmada", 0, "Quiere balayage miel.");
  await crearCita(c.sofia, eLiz, 0, "14:30", [5, 9], "pendiente");
  await crearCita(c.valentina, eDaniela, 0, "16:00", [17], "confirmada");
  await crearCita(c.renata, eValeria, 0, "17:30", [28], "pendiente");

  // Próximas de la clienta de demostración
  await crearCita(c.maria, eLiz, 3, "11:30", [7, 9], "confirmada");
  await crearCita(c.maria, eValeria, 9, "15:00", [18], "pendiente");
  // Otras próximas
  await crearCita(c.fernanda, eLiz, 1, "10:00", [6], "confirmada");
  await crearCita(c.regina, eValeria, 1, "12:30", [20], "confirmada");
  await crearCita(c.ana, eDaniela, 2, "16:00", [14], "pendiente");
  await crearCita(c.karla, eLiz, 2, "11:00", [8], "pendiente");
  await crearCita(c.isabel, eDaniela, 4, "13:30", [15], "confirmada");
  await crearCita(c.sofia, eValeria, 5, "10:30", [25], "confirmada");

  // Historial de la clienta de demostración: 8 visitas + 1 premio canjeado -> 3 sellos
  const historial = [[-19, eLiz, [11]], [-36, eValeria, [18]], [-52, eLiz, [7]], [-68, eValeria, [28]],
    [-84, eLiz, [9]], [-100, eLiz, [17]], [-118, eLiz, [11]], [-137, eValeria, [18]]];
  for (const [dia, empleada, servs] of historial) {
    await crearCita(c.maria, empleada, dia, "10:00", servs, "completada");
  }
  await crearCita(c.maria, eLiz, -95, "12:00", [7], "completada", 1);
  await crearCita(c.maria, eLiz, -45, "17:00", [7], "cancelada");
  await crearCita(c.maria, eValeria, -60, "13:00", [19], "no_asistio");

  // Historial general (alimenta ventas y dashboards)
  const combos = [
    [c.ana, [5, 9]], [c.sofia, [18]], [c.regina, [11]], [c.valentina, [7]], [c.isabel, [19]], [c.renata, [13]],
    [c.fernanda, [17]], [c.karla, [6]], [c.ana, [7]], [c.sofia, [21]], [c.regina, [14]], [c.isabel, [23]],
    [c.fernanda, [15]], [c.valentina, [9]], [c.regina, [11]], [c.renata, [28]],
  ];
  const horas = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];
  let generadas = 0;
  for (let dia = -1; dia > -105; dia--) {
    const cuantas = elegir([0, 1, 2, 2, 3]);
    for (let n = 0; n < cuantas; n++) {
      const [cliente, servs] = elegir(combos);
      const aptas = [...SERV_EMPLEADA].filter(([, lista]) => servs.some((s) => lista.includes(s))).map(([e]) => e);
      const empleada = elegir(aptas.length ? aptas : [eLiz]);
      const estado = ponderado(["completada", "cancelada", "no_asistio"], [88, 8, 4]);
      await crearCita(cliente, empleada, dia, elegir(horas), servs, estado);
      generadas++;
    }
    if (dia % 25 === 0) console.log(`      ...${generadas} citas del historial`);
  }

  console.log("5/7 Inventario...");
  const insumos = [
    ["Gel constructor transparente", "Geles y Acrílicos", "frasco", 6, 4, 280],
    ["Acrílico polvo rosa", "Geles y Acrílicos", "frasco", 2, 3, 190],
    ["Gelish esmalte nude", "Geles y Acrílicos", "frasco", 0, 3, 150],
    ["Pestañas clásicas 0.15 C", "Pestañas", "caja", 9, 5, 120],
    ["Pestañas volumen 0.07 D", "Pestañas", "caja", 3, 4, 140],
    ["Pegamento para pestañas", "Pestañas", "frasco", 5, 3, 210],
    ["Tinte rubio ceniza 8.1", "Tintes y Coloración", "tubo", 12, 6, 95],
    ["Oxidante 20 vol", "Tintes y Coloración", "litro", 4, 2, 80],
    ["Shampoo profesional", "Cabello", "litro", 8, 3, 160],
    ["Guantes de nitrilo", "Insumos Generales", "caja", 11, 4, 110],
    ["Algodón", "Insumos Generales", "paquete", 1, 3, 35],
    ["Limas desechables", "Uñas", "paquete", 14, 6, 45],
    ["Base para maquillaje", "Maquillaje", "pieza", 7, 2, 420],
  ];
  for (const [nombre, categoria, unidad, stock, minimo, costo] of insumos) {
    const id = await insertar(
      "INSERT INTO insumos (nombre, categoria, unidad, stock, stock_minimo, costo) VALUES (?,?,?,?,?,?)",
      [nombre, categoria, unidad, stock, minimo, costo]
    );
    await pool.query(
      `INSERT INTO movimientos_inventario (insumo_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, creado_en)
       VALUES (?,?,'entrada',?,0,?,'Inventario inicial', DATE_SUB(NOW(), INTERVAL 30 DAY)),
              (?,?,'salida',3,?,?,'Uso en servicios', DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [id, uAdmin, stock + 3, stock + 3, id, uLiz, stock + 3, stock, entre(1, 9)]
    );
  }

  console.log("6/7 Boutique y pedidos...");
  const productos = [
    ["Kit de uñas press-on", "Set de 24 piezas con pegamento y lima. Diseño francés.", "Uñas", 280, "Diseño", [["Francés", 8], ["Nude", 5], ["Rosa chicle", 0]]],
    ["Aceite de cutícula", "Aceite nutritivo con vitamina E, aplicador de pincel.", "Cuidado", 95, "Aroma", [["Almendra", 14], ["Cereza", 3]]],
    ["Sérum de pestañas", "Fortalece y estimula el crecimiento. 5 ml.", "Cuidado", 350, "Presentación", [["5 ml", 6]]],
    ["Scrunchies de seda", "Paquete de 3 ligas suaves que no maltratan el cabello.", "Accesorios", 150, "Color", [["Rosa", 10], ["Marfil", 7], ["Vino", 2]]],
    ["Mascarilla capilar", "Tratamiento intensivo de hidratación, 250 ml.", "Cabello", 320, "Aroma", [["Coco", 0], ["Argán", 0]]],
    ["Brocha de rubor", "Cerdas suaves, mango rosa dorado.", "Maquillaje", 210, "Color", [["Rosa dorado", 9]]],
  ];
  const variante = new Map(); // "producto|variante" -> id
  for (const [nombre, descripcion, categoria, precio, tipo, vars] of productos) {
    const pid = await insertar(
      "INSERT INTO productos (nombre, descripcion, categoria, precio, tipo_variante) VALUES (?,?,?,?,?)",
      [nombre, descripcion, categoria, precio, tipo]
    );
    for (const [vn, stock] of vars) {
      variante.set(`${nombre}|${vn}`, await insertar("INSERT INTO variantes_producto (producto_id, nombre, stock) VALUES (?,?,?)", [pid, vn, stock]));
    }
  }

  const crearPedido = async (cliente, estado, metodo, items, dias) => {
    const total = items.reduce((s, [, , precio, cantidad]) => s + precio * cantidad, 0);
    const entregado = estado === "entregado" ? "DATE_SUB(NOW(), INTERVAL ? DAY)" : "NULL";
    const params = [cliente, estado, metodo, total, dias + 1, ...(estado === "entregado" ? [dias] : [])];
    const id = await insertar(
      `INSERT INTO pedidos (cliente_id, estado, metodo_pago, total, creado_en, entregado_en)
       VALUES (?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), ${entregado})`,
      params
    );
    await pool.query("INSERT INTO pedido_items (pedido_id, variante_id, producto, variante, precio, cantidad) VALUES ?", [
      items.map(([producto, vn, precio, cantidad]) => [id, variante.get(`${producto}|${vn}`), producto, vn, precio, cantidad]),
    ]);
  };
  await crearPedido(c.maria, "pendiente", "transferencia", [["Kit de uñas press-on", "Francés", 280, 1], ["Aceite de cutícula", "Almendra", 95, 2]], 0);
  await crearPedido(c.maria, "confirmado", "efectivo", [["Sérum de pestañas", "5 ml", 350, 1]], 3);
  await crearPedido(c.maria, "entregado", "transferencia", [["Scrunchies de seda", "Rosa", 150, 1]], 20);
  await crearPedido(c.maria, "cancelado", "efectivo", [["Kit de uñas press-on", "Nude", 280, 1]], 40);
  await crearPedido(c.fernanda, "pendiente", "transferencia", [["Scrunchies de seda", "Marfil", 150, 2]], 0);
  await crearPedido(c.regina, "confirmado", "efectivo", [["Sérum de pestañas", "5 ml", 350, 2], ["Aceite de cutícula", "Almendra", 95, 1]], 1);
  await crearPedido(c.karla, "entregado", "efectivo", [["Aceite de cutícula", "Cereza", 95, 1]], 12);

  console.log("7/7 Notificaciones...");
  const notificaciones = [
    [c.maria, "confirmacion", "Tu cita del jueves a las 11:30 con Liz quedó confirmada. ¡Te esperamos en Estudio Amari!", "enviada", 0, 1],
    [c.maria, "recordatorio", "Recordatorio: mañana tienes cita en Estudio Amari. Si no puedes asistir, avísanos con anticipación.", "enviada", 1, 8],
    [c.maria, "promocion", "💗 Este mes, en tu cita de uñas llévate 20% en el aceite de cutícula de nuestra boutique.", "enviada", 0, 4],
    [c.maria, "promocion", "Nueva colección de scrunchies de seda ya disponible en la boutique.", "enviada", 1, 20],
    [c.fernanda, "confirmacion", "Tu cita de mañana a las 10:00 quedó confirmada.", "pendiente", 0, 0],
    [c.regina, "recordatorio", "Recordatorio: mañana tienes cita a las 12:30 con Valeria.", "pendiente", 0, 0],
    [c.ana, "confirmacion", "Tu cita del jueves a las 16:00 quedó confirmada.", "pendiente", 0, 0],
    [c.karla, "promocion", "Gelish + manicure con 15% de descuento esta semana.", "pendiente", 0, 0],
  ];
  for (const [cliente, tipo, mensaje, estado, leida, dias] of notificaciones) {
    await pool.query(
      `INSERT INTO notificaciones (cliente_id, tipo, mensaje, estado, leida, creada_en, enviada_en)
       VALUES (?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), ${estado === "pendiente" ? "NULL" : "DATE_SUB(NOW(), INTERVAL ? DAY)"})`,
      [cliente, tipo, mensaje, estado, leida, dias, ...(estado === "pendiente" ? [] : [dias])]
    );
  }

  console.log("\nListo. Cuentas de demostración (misma contraseña para todas):");
  console.log(`  Administradora: admin@${DOMINIO_DEMO}`);
  console.log(`  Empleada:       empleada@${DOMINIO_DEMO}`);
  console.log(`  Clienta:        clienta@${DOMINIO_DEMO}`);
  console.log(`  Contraseña:     ${CLAVE_DEMO}`);
} catch (error) {
  console.error("\nNo se pudo cargar la demostración:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
