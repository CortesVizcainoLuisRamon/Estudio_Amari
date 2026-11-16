import { Router } from "express";
import {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  registrarMovimiento,
} from "../controllers/inventario.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", permitirRoles("admin", "empleado"), obtenerInsumos);
router.post("/", permitirRoles("admin"), crearInsumo);
router.put("/:id", permitirRoles("admin"), actualizarInsumo);
router.post("/:id/movimientos", permitirRoles("admin", "empleado"), registrarMovimiento);

export default router;