import { Router } from "express";
import {
  obtenerCitas,
  obtenerDisponibilidad,
  crearCita,
  cambiarEstado,
  obtenerMisCitas,
  cancelarMiCita,
} from "../controllers/citas.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

// Admin, empleada y clienta
router.get("/disponibilidad", permitirRoles("admin", "empleado", "cliente"), obtenerDisponibilidad);
router.post("/", permitirRoles("admin", "empleado", "cliente"), crearCita);

// Solo la clienta (sus propias citas)
router.get("/mis-citas", permitirRoles("cliente"), obtenerMisCitas);
router.patch("/:id/cancelar", permitirRoles("cliente"), cancelarMiCita);

// Solo personal del estudio
router.get("/", permitirRoles("admin", "empleado"), obtenerCitas);
router.patch("/:id/estado", permitirRoles("admin", "empleado"), cambiarEstado);

export default router;