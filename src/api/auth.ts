import { ApiError } from '../lib/http';
import { http } from '../lib/http';
import type {
  CsrfResponse,
  LoginResponse,
  RegistroDatos,
  Usuario,
} from './types';

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

async function postConCsrf<T>(path: string, body?: unknown): Promise<T> {
  let token = await obtenerCsrf();

  try {
    return await http.post<T>(path, body, { 'X-XSRF-TOKEN': token });
  } catch (error) {
    // Si la cookie cambió (por ejemplo, en otra pestaña), el token en memoria
    // queda obsoleto. Se pide una vez más y se reintenta la operación.
    if (error instanceof ApiError && error.status === 403) {
      csrfToken = null;
      token = await obtenerCsrf();
      return http.post<T>(path, body, { 'X-XSRF-TOKEN': token });
    }
    throw error;
  }
}

export async function iniciarSesion(
  usuario: string,
  password: string,
): Promise<LoginResponse> {
  const respuesta = await postConCsrf<LoginResponse>('/auth/login', {
    usuario,
    password,
  });
  csrfToken = respuesta.csrfToken;
  return respuesta;
}

/**
 * Crea la cuenta. El backend responde 201 sin crear sesión; el llamador debe
 * llevar al usuario al login.
 */
export async function registrarUsuario(
  datos: RegistroDatos,
): Promise<Usuario> {
  return postConCsrf<Usuario>('/auth/registro', datos);
}

export async function cerrarSesion(): Promise<void> {
  await postConCsrf<void>('/auth/logout');
  csrfToken = null;
}

export async function obtenerSesion(): Promise<Usuario> {
  return http.get<Usuario>('/auth/me');
}
