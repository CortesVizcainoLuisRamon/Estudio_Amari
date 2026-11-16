import { Router } from "express";
import { obtenerDashboard, obtenerDashboardEmpleada } from "../controllers/dashboard.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, permitirRoles("admin"), obtenerDashboard);
router.get("/empleada", verificarToken, permitirRoles("empleado"), obtenerDashboardEmpleada);

export default router;