import { ApiError, http } from '../lib/http';
import type { CsrfResponse } from './types';

/**
 * El token CSRF vive solo en memoria.
 *
 * <p>El backend lo entrega en una cookie legible y en el cuerpo de
 * `GET /api/auth/csrf`. No se guarda en localStorage ni en sessionStorage:
 * tras recargar la página se vuelve a pedir. El login lo rota y el logout lo
 * elimina.</p>
 */
let csrfToken: string | null = null;

export function recordarCsrf(token: string | null): void {
  csrfToken = token;
}

export async function obtenerCsrf(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  const respuesta = await http.get<CsrfResponse>('/auth/csrf');
  csrfToken = respuesta.token;
  return respuesta.token;
}

/**
 * Envía un POST con la cabecera CSRF.
 *
 * <p>Si la cookie cambió (por ejemplo, en otra pestaña), el token en memoria
 * queda obsoleto. Se pide una vez más y se reintenta la operación.</p>
 */
export async function postConCsrf<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  let token = await obtenerCsrf();

  try {
    return await http.post<T>(path, body, { 'X-XSRF-TOKEN': token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      csrfToken = null;
      token = await obtenerCsrf();
      return http.post<T>(path, body, { 'X-XSRF-TOKEN': token });
    }
    throw error;
  }
}
