import { useEffect, useState } from "react";

// Devuelve la fecha y hora actuales y se actualiza sola (por defecto cada minuto),
// para que "en 25 min" y la cita en curso se mantengan al día sin recargar.
export function useAhora(cadaMs = 60000) {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);

  return ahora;
}