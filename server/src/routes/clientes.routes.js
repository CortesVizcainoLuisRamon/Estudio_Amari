import { Router } from "express";
import {
  obtenerClientes,
  crearCliente,
  actualizarCliente,
} from "../controllers/clientes.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken, permitirRoles("admin", "empleado"));

router.get("/", obtenerClientes);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);

export default router;