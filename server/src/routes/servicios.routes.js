import { Router } from "express";
import {
  obtenerCategorias,
  obtenerServicios,
  obtenerServiciosGestion,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
} from "../controllers/servicios.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", obtenerServicios);
router.get("/categorias", obtenerCategorias);
router.get("/gestion", verificarToken, permitirRoles("admin", "empleado"), obtenerServiciosGestion);
router.get("/:id", obtenerServicioPorId);

router.post("/", verificarToken, permitirRoles("admin"), crearServicio);
router.put("/:id", verificarToken, permitirRoles("admin"), actualizarServicio);

export default router;