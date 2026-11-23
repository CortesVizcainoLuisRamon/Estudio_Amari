import { Router } from "express";
import {
  obtenerNotificaciones,
  crearPromocion,
  marcarEnviada,
  descartarNotificacion,
  obtenerMisNotificaciones,
  contarMisNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from "../controllers/notificaciones.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

// Cliente
router.get("/mias", permitirRoles("cliente"), obtenerMisNotificaciones);
router.patch("/mias/leidas", permitirRoles("cliente"), marcarTodasLeidas);
router.patch("/mias/:id/leida", permitirRoles("cliente"), marcarLeida);
router.get("/mias/contador", permitirRoles("cliente"), contarMisNoLeidas);

// Admin
router.get("/", permitirRoles("admin"), obtenerNotificaciones);
router.post("/promocion", permitirRoles("admin"), crearPromocion);
router.patch("/:id/enviada", permitirRoles("admin"), marcarEnviada);
router.delete("/:id", permitirRoles("admin"), descartarNotificacion);

export default router;