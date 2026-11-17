import { Router } from "express";
import {
  obtenerCitas,
  obtenerDisponibilidad,
  crearCita,
  cambiarEstado,
  obtenerMisCitas,
  cancelarMiCita,
  obtenerMiPerfil,
  obtenerMiFidelidad,
  obtenerFidelidadCliente,
  obtenerFidelidadTodos,
  aplicarFidelidad,
  quitarFidelidad,
} from "../controllers/citas.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

// Admin, empleada y clienta
router.get("/disponibilidad", permitirRoles("admin", "empleado", "cliente"), obtenerDisponibilidad);
router.post("/", permitirRoles("admin", "empleado", "cliente"), crearCita);

// Solo la clienta (sus propias citas)
router.get("/mis-citas", permitirRoles("cliente"), obtenerMisCitas);
router.get("/mi-fidelidad", permitirRoles("cliente"), obtenerMiFidelidad);
router.patch("/:id/cancelar", permitirRoles("cliente"), cancelarMiCita);

// Solo la empleada
router.get("/mi-perfil", permitirRoles("empleado"), obtenerMiPerfil);

// Personal del estudio
router.get("/", permitirRoles("admin", "empleado"), obtenerCitas);
router.get("/fidelidad", permitirRoles("admin", "empleado"), obtenerFidelidadTodos);
router.get("/fidelidad/:clienteId", permitirRoles("admin", "empleado"), obtenerFidelidadCliente);
router.patch("/:id/estado", permitirRoles("admin", "empleado"), cambiarEstado);
router.post("/:id/fidelidad", permitirRoles("admin", "empleado"), aplicarFidelidad);
router.delete("/:id/fidelidad", permitirRoles("admin", "empleado"), quitarFidelidad);

export default router;