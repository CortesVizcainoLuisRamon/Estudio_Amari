import { Router } from "express";
import {
  recibirImagen,
  subirImagenProducto,
  subirFotoPerfil,
  quitarFotoPerfil,
} from "../controllers/imagenes.controller.js";
import { verificarToken, permitirRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Primero se verifica la sesión; solo entonces se recibe el archivo
router.use(verificarToken);

router.post("/producto", permitirRoles("admin"), recibirImagen, subirImagenProducto);
router.post("/perfil", recibirImagen, subirFotoPerfil);
router.delete("/perfil", quitarFotoPerfil);

export default router;