import { useEffect, useMemo, useState } from "react";
import { CarritoContext } from "./carrito-context";
import { useAuth } from "../hooks/useAuth";

const MAX_POR_PRODUCTO = 20;

function CarritoDeUsuario({ usuarioId, children }) {
  const clave = usuarioId ? `amari-carrito-${usuarioId}` : null;

  const [items, setItems] = useState(() => {
    if (!clave) return [];
    try {
      const guardado = JSON.parse(localStorage.getItem(clave) ?? "[]");
      return Array.isArray(guardado) ? guardado : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!clave) return;
    try {
      localStorage.setItem(clave, JSON.stringify(items));
    } catch {
      // Sin almacenamiento disponible: el carrito vive solo mientras la página esté abierta
    }
  }, [clave, items]);

  const valor = useMemo(() => {
    const limite = (cantidad, stock) => Math.max(1, Math.min(cantidad, stock, MAX_POR_PRODUCTO));

    const agregar = (producto, variante, cantidad = 1) =>
      setItems((actuales) => {
        const existente = actuales.find((i) => i.varianteId === variante.id);

        if (existente) {
          return actuales.map((i) =>
            i.varianteId === variante.id
              ? { ...i, stock: variante.stock, cantidad: limite(i.cantidad + cantidad, variante.stock) }
              : i
          );
        }

        return [
          ...actuales,
          {
            varianteId: variante.id,
            producto: producto.nombre,
            tipo: producto.tipo_variante,
            variante: variante.nombre,
            precio: producto.precio,
            imagen_url: producto.imagen_url,
            stock: variante.stock,
            cantidad: limite(cantidad, variante.stock),
          },
        ];
      });

    const cambiarCantidad = (varianteId, cantidad) =>
      setItems((actuales) =>
        actuales.map((i) =>
          i.varianteId === varianteId ? { ...i, cantidad: limite(cantidad, i.stock) } : i
        )
      );

    const quitar = (varianteId) =>
      setItems((actuales) => actuales.filter((i) => i.varianteId !== varianteId));

    const vaciar = () => setItems([]);

    return {
      items,
      cantidad: items.reduce((suma, i) => suma + i.cantidad, 0),
      total: items.reduce((suma, i) => suma + i.precio * i.cantidad, 0),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    };
  }, [items]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function CarritoProvider({ children }) {
  const { usuario } = useAuth();

  // Con "key", cada persona que inicia sesión carga su propio carrito
  return (
    <CarritoDeUsuario key={usuario?.id ?? "anonimo"} usuarioId={usuario?.id ?? null}>
      {children}
    </CarritoDeUsuario>
  );
}