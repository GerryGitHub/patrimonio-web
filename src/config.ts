/** URL base de la API. En desarrollo se resuelve con el proxy de Vite. */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? '/api'
).replace(/\/+$/, '');

export const NOMBRE_APP = 'Patrimonio';
