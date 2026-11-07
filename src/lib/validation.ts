import type { TipoInstitucion } from '../api/types';

const PATRON_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface ErroresLogin {
  email?: string;
  password?: string;
}

export interface ErroresRegistro {
  nombre?: string;
  email?: string;
  password?: string;
  confirmacion?: string;
}

export interface ErroresPortafolio {
  nombre?: string;
  descripcion?: string;
  monedaBaseId?: string;
}

export function validarNombre(nombre: string): string | undefined {
  const valor = nombre.trim();
  if (!valor) {
    return 'Escribe tu nombre.';
  }
  if (valor.length > 150) {
    return 'El nombre no puede superar los 150 caracteres.';
  }
  return undefined;
}

export function validarEmail(email: string): string | undefined {
  const valor = email.trim();
  if (!valor) {
    return 'Escribe tu correo electrónico.';
  }
  if (valor.length > 254) {
    return 'El correo es demasiado largo.';
  }
  if (!PATRON_EMAIL.test(valor)) {
    return 'Escribe un correo con un formato válido.';
  }
  return undefined;
}

export function validarPassword(password: string): string | undefined {
  if (!password) {
    return 'Escribe una contraseña.';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (new TextEncoder().encode(password).length > 72) {
    return 'La contraseña es demasiado larga.';
  }
  return undefined;
}

export function validarConfirmacion(
  password: string,
  confirmacion: string,
): string | undefined {
  if (!confirmacion) {
    return 'Repite la contraseña.';
  }
  if (password !== confirmacion) {
    return 'Las contraseñas no coinciden.';
  }
  return undefined;
}

export function validarLogin(datos: {
  email: string;
  password: string;
}): ErroresLogin {
  return {
    email: validarEmail(datos.email),
    password: datos.password ? undefined : 'Escribe tu contraseña.',
  };
}

export function validarRegistro(datos: {
  nombre: string;
  email: string;
  password: string;
  confirmacion: string;
}): ErroresRegistro {
  return {
    nombre: validarNombre(datos.nombre),
    email: validarEmail(datos.email),
    password: validarPassword(datos.password),
    confirmacion: validarConfirmacion(datos.password, datos.confirmacion),
  };
}

export function validarNombrePortafolio(nombre: string): string | undefined {
  const valor = nombre.trim();
  if (!valor) {
    return 'Escribe un nombre para el portafolio.';
  }
  if (valor.length > 150) {
    return 'El nombre no puede superar los 150 caracteres.';
  }
  return undefined;
}

export function validarDescripcionPortafolio(
  descripcion: string,
): string | undefined {
  if (descripcion.trim().length > 500) {
    return 'La descripción no puede superar los 500 caracteres.';
  }
  return undefined;
}

export function validarPortafolio(datos: {
  nombre: string;
  descripcion: string;
  monedaBaseId: string;
}): ErroresPortafolio {
  return {
    nombre: validarNombrePortafolio(datos.nombre),
    descripcion: validarDescripcionPortafolio(datos.descripcion),
    monedaBaseId: datos.monedaBaseId
      ? undefined
      : 'Selecciona una moneda base.',
  };
}

export interface ErroresInstitucion {
  nombre?: string;
  tipo?: string;
  pais?: string;
  sitioWeb?: string;
}

export function validarInstitucion(datos: {
  nombre: string;
  tipo: TipoInstitucion | '';
  pais: string;
  sitioWeb: string;
}): ErroresInstitucion {
  const nombre = datos.nombre.trim();
  const pais = datos.pais.trim();
  const sitioWeb = datos.sitioWeb.trim();

  return {
    nombre: !nombre
      ? 'Escribe el nombre de la institución.'
      : nombre.length > 150
        ? 'El nombre no puede superar los 150 caracteres.'
        : undefined,
    tipo: datos.tipo ? undefined : 'Selecciona una categoría.',
    pais:
      pais.length > 100
        ? 'El país no puede superar los 100 caracteres.'
        : undefined,
    sitioWeb:
      sitioWeb.length > 255
        ? 'El sitio web no puede superar los 255 caracteres.'
        : undefined,
  };
}

export interface ErroresCuenta {
  nombre?: string;
  institucionId?: string;
  tipoCuentaId?: string;
  monedaId?: string;
  descripcion?: string;
  numeroCuenta?: string;
}

export function validarCuenta(datos: {
  nombre: string;
  institucionId: string;
  tipoCuentaId: string;
  monedaId: string;
  descripcion: string;
  numeroCuenta: string;
}): ErroresCuenta {
  const nombre = datos.nombre.trim();
  const descripcion = datos.descripcion.trim();
  const numeroCuenta = datos.numeroCuenta.trim();

  return {
    nombre: !nombre
      ? 'Escribe un nombre para la cuenta.'
      : nombre.length > 150
        ? 'El nombre no puede superar los 150 caracteres.'
        : undefined,
    institucionId: datos.institucionId
      ? undefined
      : 'Selecciona una institución.',
    tipoCuentaId: datos.tipoCuentaId
      ? undefined
      : 'Selecciona un tipo de cuenta.',
    monedaId: datos.monedaId ? undefined : 'Selecciona una moneda.',
    descripcion:
      descripcion.length > 500
        ? 'La descripción no puede superar los 500 caracteres.'
        : undefined,
    numeroCuenta:
      numeroCuenta.length > 64
        ? 'La referencia no puede superar los 64 caracteres.'
        : undefined,
  };
}

export function tieneErrores(errores: object): boolean {
  return Object.values(errores).some(Boolean);
}
