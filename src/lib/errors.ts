import { ApiError } from './http';

export type ContextoError =
  | 'login'
  | 'registro'
  | 'datos'
  | 'sesion'
  | 'portafolio'
  | 'institucion'
  | 'cuenta'
  | 'instrumento'
  | 'posicion';

/** Indica si el error corresponde a una sesión ausente o caducada. */
export function esNoAutenticado(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Indica si el recurso solicitado no existe o no es accesible. */
export function esNoEncontrado(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
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
        if (contexto === 'portafolio') {
          return 'Revisa los datos del portafolio: el nombre o la descripción no son válidos.';
        }
        if (contexto === 'institucion') {
          return 'Revisa los datos de la institución: el nombre, la categoría o los datos de contacto no son válidos.';
        }
        if (contexto === 'cuenta') {
          return 'Revisa los datos de la cuenta: el nombre, la referencia o la fecha no son válidos.';
        }
        if (contexto === 'instrumento') {
          return 'Revisa los datos del instrumento: el nombre, el tipo, la moneda o el ISIN no son válidos.';
        }
        if (contexto === 'posicion') {
          return 'Revisa los datos de la posición: la cantidad, el costo o la fecha no son válidos.';
        }
        return 'Revisa los datos introducidos: el nombre, el correo o la contraseña no son válidos.';
      case 'MONEDA_INVALIDA':
        return 'La moneda seleccionada no está disponible. Actualiza la página e inténtalo de nuevo.';
      case 'INSTITUCION_DUPLICADA':
        return 'Ya existe una institución con ese nombre.';
      case 'INSTITUCION_INVALIDA':
        return 'Revisa los datos de la institución: el nombre o la categoría no son válidos.';
      case 'CUENTA_DUPLICADA':
        return 'Ya existe una cuenta con esa referencia en la institución.';
      case 'CUENTA_INVALIDA':
        return 'Revisa los datos de la cuenta: la institución, el tipo o la moneda no son válidos.';
      case 'TIPO_CUENTA_INVALIDO':
        return 'El tipo de cuenta seleccionado no está disponible. Actualiza la página e inténtalo de nuevo.';
      case 'INSTRUMENTO_DUPLICADO':
        return 'Ya existe un instrumento con ese símbolo en la moneda o con ese ISIN activo.';
      case 'INSTRUMENTO_INVALIDO':
        return 'Revisa los datos del instrumento: el nombre, el tipo, la moneda o el ISIN no son válidos.';
      case 'POSICION_INVALIDA':
        return 'Revisa la posición: la cantidad, el costo unitario o la fecha no son válidos.';
      case 'POSICION_INCOMPATIBLE':
        return 'La cuenta seleccionada no admite este tipo de instrumento. Elige otra cuenta o instrumento.';
      case 'ACCESO_DENEGADO':
        return contexto === 'cuenta' ||
          contexto === 'institucion' ||
          contexto === 'instrumento' ||
          contexto === 'posicion'
          ? 'No tienes permiso para modificar este recurso.'
          : 'No se pudo verificar la seguridad de la solicitud. Recarga la página e inténtalo de nuevo.';
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
