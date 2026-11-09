import { Router } from "express";
import {
  obtenerCitas,
  obtenerDisponibilidad,
  crearCita,
  cambiarEstado,
} from "../controllers/citas.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken, permitirRoles("admin", "empleado"));

router.get("/", obtenerCitas);
router.get("/disponibilidad", obtenerDisponibilidad);
router.post("/", crearCita);
router.patch("/:id/estado", cambiarEstado);

export default router;