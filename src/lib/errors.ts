import { ApiError } from './http';

export type ContextoError = 'login' | 'registro' | 'datos' | 'sesion';

/** Indica si el error corresponde a una sesión ausente o caducada. */
export function esNoAutenticado(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Traduce el error del backend a un mensaje comprensible para la interfaz.
 *
 * <p>Se apoya en el código estable (`code`) del `ProblemDetail`, no en el
 * texto del servidor, para poder mantener los mensajes en español y evitar
 * filtrar detalles internos.</p>
 */
export function mensajeDeError(
  error: unknown,
  contexto: ContextoError = 'datos',
): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NO_AUTENTICADO':
        return contexto === 'login'
          ? 'El correo o la contraseña no son correctos.'
          : 'Tu sesión ha caducado. Inicia sesión de nuevo.';
      case 'EMAIL_DUPLICADO':
        return 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.';
      case 'VALIDACION_ENTRADA':
        return 'Revisa los datos introducidos: el nombre, el correo o la contraseña no son válidos.';
      case 'ACCESO_DENEGADO':
        return 'No se pudo verificar la seguridad de la solicitud. Recarga la página e inténtalo de nuevo.';
      case 'NO_ENCONTRADO':
        return 'No encontramos la información solicitada o no tienes acceso.';
      case 'ERROR_INTERNO':
        return 'El servidor no pudo completar la operación. Inténtalo de nuevo en unos minutos.';
      default:
        return error.detail ?? 'No se pudo completar la operación.';
    }
  }

  if (error instanceof TypeError) {
    return 'No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
  }

  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}
