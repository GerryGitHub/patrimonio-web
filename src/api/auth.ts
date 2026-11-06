import { postConCsrf, obtenerCsrf, recordarCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  LoginResponse,
  RegistroDatos,
  Usuario,
} from './types';

export { obtenerCsrf, recordarCsrf };

export async function iniciarSesion(
  usuario: string,
  password: string,
): Promise<LoginResponse> {
  const respuesta = await postConCsrf<LoginResponse>('/auth/login', {
    usuario,
    password,
  });
  recordarCsrf(respuesta.csrfToken);
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
  recordarCsrf(null);
}

export async function obtenerSesion(): Promise<Usuario> {
  return http.get<Usuario>('/auth/me');
}
