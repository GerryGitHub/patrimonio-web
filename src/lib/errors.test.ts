import { describe, expect, it } from 'vitest';
import { esNoAutenticado, mensajeDeError } from './errors';
import { ApiError } from './http';

describe('mensajeDeError', () => {
  it('distingue credenciales incorrectas de una sesión caducada', () => {
    const error = new ApiError(401, 'NO_AUTENTICADO');

    expect(mensajeDeError(error, 'login')).toContain('correo o la contraseña');
    expect(mensajeDeError(error, 'datos')).toContain('sesión');
  });

  it('explica el correo duplicado en el registro', () => {
    const mensaje = mensajeDeError(
      new ApiError(409, 'EMAIL_DUPLICADO'),
      'registro',
    );

    expect(mensaje).toContain('Ya existe una cuenta');
  });

  it('traduce la validación de entrada y el acceso denegado', () => {
    expect(
      mensajeDeError(new ApiError(400, 'VALIDACION_ENTRADA'), 'registro'),
    ).toContain('Revisa los datos');

    expect(
      mensajeDeError(new ApiError(403, 'ACCESO_DENEGADO'), 'datos'),
    ).toContain('Recarga la página');
  });

  it('traduce un fallo de red', () => {
    expect(mensajeDeError(new TypeError('Failed to fetch'), 'datos')).toContain(
      'conectar con el servidor',
    );
  });

  it('usa el detalle del backend para códigos desconocidos', () => {
    expect(
      mensajeDeError(new ApiError(418, 'OTRO', 'Detalle del servidor')),
    ).toBe('Detalle del servidor');
  });

  it('devuelve un mensaje genérico para errores inesperados', () => {
    expect(mensajeDeError('algo', 'datos')).toContain('error inesperado');
  });
});

describe('esNoAutenticado', () => {
  it('solo reconoce el 401 del cliente HTTP', () => {
    expect(esNoAutenticado(new ApiError(401))).toBe(true);
    expect(esNoAutenticado(new ApiError(403))).toBe(false);
    expect(esNoAutenticado(new Error('401'))).toBe(false);
  });
});
