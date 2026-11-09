import { Router } from "express";
import { obtenerDashboard } from "../controllers/dashboard.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, permitirRoles("admin"), obtenerDashboard);

export default router;