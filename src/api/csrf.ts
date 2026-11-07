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

type MetodoConCsrf = 'POST' | 'PUT' | 'PATCH';

/**
 * Envía una petición que modifica estado con la cabecera CSRF.
 *
 * <p>Si la cookie cambió (por ejemplo, en otra pestaña), el token en memoria
 * queda obsoleto. Se pide una vez más y se reintenta la operación. El reintento
 * solo se hace ante un 403, que es la respuesta del backend para un token
 * inválido.</p>
 */
async function enviarConCsrf<T>(
  metodo: MetodoConCsrf,
  path: string,
  body?: unknown,
): Promise<T> {
  let token = await obtenerCsrf();

  const enviar = (): Promise<T> => {
    const headers = { 'X-XSRF-TOKEN': token };
    switch (metodo) {
      case 'POST':
        return http.post<T>(path, body, headers);
      case 'PUT':
        return http.put<T>(path, body, headers);
      case 'PATCH':
        return http.patch<T>(path, body, headers);
    }
  };

  try {
    return await enviar();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      csrfToken = null;
      token = await obtenerCsrf();
      return enviar();
    }
    throw error;
  }
}

export function postConCsrf<T>(path: string, body?: unknown): Promise<T> {
  return enviarConCsrf<T>('POST', path, body);
}

export function putConCsrf<T>(path: string, body?: unknown): Promise<T> {
  return enviarConCsrf<T>('PUT', path, body);
}

export function patchConCsrf<T>(path: string, body?: unknown): Promise<T> {
  return enviarConCsrf<T>('PATCH', path, body);
}
