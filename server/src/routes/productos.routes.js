import { Router } from "express";
import {
  obtenerProductosGestion,
  crearProducto,
  actualizarProducto,
} from "../controllers/productos.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken, permitirRoles("admin"));

router.get("/gestion", obtenerProductosGestion);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);

export default router;