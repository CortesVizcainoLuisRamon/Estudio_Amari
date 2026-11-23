import { Router } from "express";
import { crearAccesoCliente } from "../controllers/clientes.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:id/acceso", verificarToken, permitirRoles("admin"), crearAccesoCliente);

export default router;