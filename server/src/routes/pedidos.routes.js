import { Router } from "express";
import {
  crearPedido,
  obtenerMisPedidos,
  cancelarMiPedido,
  obtenerPedidos,
  cambiarEstadoPedido,
} from "../controllers/pedidos.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

// Clienta
router.post("/", permitirRoles("cliente"), crearPedido);
router.get("/mis-pedidos", permitirRoles("cliente"), obtenerMisPedidos);
router.patch("/:id/cancelar", permitirRoles("cliente"), cancelarMiPedido);

// Admin
router.get("/", permitirRoles("admin"), obtenerPedidos);
router.patch("/:id/estado", permitirRoles("admin"), cambiarEstadoPedido);

export default router;