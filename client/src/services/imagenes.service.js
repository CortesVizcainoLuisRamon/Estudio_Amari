import api from "./api";

const enviar = async (ruta, archivo) => {
  const formulario = new FormData();
  formulario.append("imagen", archivo);
  const { data } = await api.post(ruta, formulario);
  return data.data.url;
};

export const subirImagenProducto = (archivo) => enviar("/imagenes/producto", archivo);
export const subirFotoPerfil = (archivo) => enviar("/imagenes/perfil", archivo);
export const quitarFotoPerfil = () => api.delete("/imagenes/perfil");