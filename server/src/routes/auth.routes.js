import { Router } from "express";
import { registro, login, perfil } from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/registro", registro);
router.post("/login", login);
router.get("/me", verificarToken, perfil);

export default router;