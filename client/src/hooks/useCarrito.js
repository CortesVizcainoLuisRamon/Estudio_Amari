import { useContext } from "react";
import { CarritoContext } from "../context/carrito-context";

export const useCarrito = () => useContext(CarritoContext);