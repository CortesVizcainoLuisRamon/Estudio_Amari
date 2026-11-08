import { Router } from "express";
import {
  obtenerServicios,
  obtenerServicioPorId,
} from "../controllers/servicios.controller.js";

const router = Router();

router.get("/", obtenerServicios);
router.get("/:id", obtenerServicioPorId);

export default router;