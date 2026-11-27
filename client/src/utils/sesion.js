// Guarda el token donde corresponde:
//  - "Recordarme" marcado  -> localStorage (sigue al cerrar el navegador)
//  - "Recordarme" sin marcar -> sessionStorage (se borra al cerrar la pestaña)
const CLAVE = "token";

export const leerToken = () => localStorage.getItem(CLAVE) ?? sessionStorage.getItem(CLAVE);

export const borrarToken = () => {
  localStorage.removeItem(CLAVE);
  sessionStorage.removeItem(CLAVE);
};

export const guardarToken = (token, recordar = true) => {
  borrarToken();
  (recordar ? localStorage : sessionStorage).setItem(CLAVE, token);
};