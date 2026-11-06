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

export function tieneErrores(errores: object): boolean {
  return Object.values(errores).some(Boolean);
}
