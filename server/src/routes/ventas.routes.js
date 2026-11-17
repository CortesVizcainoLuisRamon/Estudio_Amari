import { Router } from "express";
import { obtenerVentas } from "../controllers/ventas.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, permitirRoles("admin"), obtenerVentas);

export default router;