import { Router } from "express";
import {
  obtenerCatalogo,
  obtenerProductosGestion,
  crearProducto,
  actualizarProducto,
} from "../controllers/productos.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

router.get("/", obtenerCatalogo);

router.get("/gestion", permitirRoles("admin"), obtenerProductosGestion);
router.post("/", permitirRoles("admin"), crearProducto);
router.put("/:id", permitirRoles("admin"), actualizarProducto);

export default router;