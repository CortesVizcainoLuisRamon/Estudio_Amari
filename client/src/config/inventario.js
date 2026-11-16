export const UNIDADES = [
  "unidad",
  "pieza",
  "par",
  "caja",
  "paquete",
  "frasco",
  "tubo",
  "ml",
  "litro",
  "gr",
  "kg",
];

export const CATEGORIAS_INSUMO = [
  "Insumos Generales",
  "Geles y Acrílicos",
  "Pestañas",
  "Tintes y Coloración",
  "Uñas",
  "Cabello",
  "Maquillaje",
  "Otros",
];

export const ESTADOS_INSUMO = {
  ok: { texto: "", barra: "bg-green-500", clase: "" },
  bajo: { texto: "Stock bajo", barra: "bg-amber-500", clase: "bg-amber-100 text-amber-700" },
  agotado: { texto: "Agotado", barra: "bg-red-500", clase: "bg-red-100 text-red-600" },
};

export const formatearCantidad = (n) =>
  Number(n).toLocaleString("es-MX", { maximumFractionDigits: 2 });