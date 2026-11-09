import { Router } from "express";
import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
} from "../controllers/empleados.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken, permitirRoles("admin"));

router.get("/", obtenerEmpleados);
router.post("/", crearEmpleado);
router.put("/:id", actualizarEmpleado);

export default router;