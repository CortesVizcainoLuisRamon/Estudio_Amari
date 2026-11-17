import { Router } from "express";
import { obtenerPerfilCompleto, actualizarPerfil, cambiarClave } from "../controllers/perfil.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", obtenerPerfilCompleto);
router.put("/", actualizarPerfil);
router.put("/clave", cambiarClave);

export default router;