import { describe, expect, it } from 'vitest';
import {
  tieneErrores,
  validarConfirmacion,
  validarDescripcionPortafolio,
  validarEmail,
  validarLogin,
  validarNombre,
  validarNombrePortafolio,
  validarPassword,
  validarPortafolio,
  validarRegistro,
} from './validation';

describe('validarNombre', () => {
  it('acepta un nombre con contenido', () => {
    expect(validarNombre('María Pérez')).toBeUndefined();
  });

  it('rechaza un nombre vacío o solo espacios', () => {
    expect(validarNombre('')).toBeDefined();
    expect(validarNombre('   ')).toBeDefined();
  });

  it('rechaza nombres de más de 150 caracteres', () => {
    expect(validarNombre('a'.repeat(151))).toBeDefined();
  });
});

describe('validarEmail', () => {
  it('acepta un correo con formato válido y espacios exteriores', () => {
    expect(validarEmail('  maria@example.com  ')).toBeUndefined();
  });

  it('rechaza un correo sin arroba o sin dominio', () => {
    expect(validarEmail('no-es-un-correo')).toBeDefined();
    expect(validarEmail('maria@example')).toBeDefined();
  });

  it('rechaza un correo vacío', () => {
    expect(validarEmail('   ')).toBeDefined();
  });
});

describe('validarPassword', () => {
  it('exige al menos 8 caracteres', () => {
    expect(validarPassword('corta')).toBeDefined();
    expect(validarPassword('Secreta1')).toBeUndefined();
  });

  it('limita la contraseña a 72 bytes en UTF-8', () => {
    // 36 caracteres 'á' ocupan 72 bytes; 37 ya superan el límite de BCrypt.
    expect(validarPassword('á'.repeat(36))).toBeUndefined();
    expect(validarPassword('á'.repeat(37))).toBeDefined();
  });
});

describe('validarConfirmacion', () => {
  it('exige que ambas contraseñas coincidan', () => {
    expect(validarConfirmacion('Secreta123!', 'Secreta123!')).toBeUndefined();
    expect(validarConfirmacion('Secreta123!', 'otra')).toBeDefined();
    expect(validarConfirmacion('Secreta123!', '')).toBeDefined();
  });
});

describe('validarRegistro', () => {
  it('no devuelve errores con datos válidos', () => {
    const errores = validarRegistro({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      password: 'Secreta123!',
      confirmacion: 'Secreta123!',
    });

    expect(tieneErrores(errores)).toBe(false);
  });

  it('acumula los errores de cada campo', () => {
    const errores = validarRegistro({
      nombre: '',
      email: 'invalido',
      password: 'corta',
      confirmacion: 'distinta',
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.email).toBeDefined();
    expect(errores.password).toBeDefined();
    expect(errores.confirmacion).toBeDefined();
  });
});

describe('validarLogin', () => {
  it('exige correo válido y contraseña presente', () => {
    expect(validarLogin({ email: 'maria@example.com', password: 'x' })).toEqual(
      { email: undefined, password: undefined },
    );

    const errores = validarLogin({ email: 'mal', password: '' });
    expect(errores.email).toBeDefined();
    expect(errores.password).toBeDefined();
  });
});

describe('validarPortafolio', () => {
  it('acepta datos válidos y una descripción vacía', () => {
    const errores = validarPortafolio({
      nombre: 'Largo plazo',
      descripcion: '',
      monedaBaseId: 'moneda-1',
    });

    expect(tieneErrores(errores)).toBe(false);
  });

  it('exige nombre y moneda base', () => {
    const errores = validarPortafolio({
      nombre: '   ',
      descripcion: '',
      monedaBaseId: '',
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.monedaBaseId).toBeDefined();
  });

  it('limita el nombre a 150 caracteres y la descripción a 500', () => {
    expect(validarNombrePortafolio('a'.repeat(150))).toBeUndefined();
    expect(validarNombrePortafolio('a'.repeat(151))).toBeDefined();
    expect(validarDescripcionPortafolio('a'.repeat(500))).toBeUndefined();
    expect(validarDescripcionPortafolio('a'.repeat(501))).toBeDefined();
  });
});
