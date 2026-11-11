import { describe, expect, it } from 'vitest';
import {
  tieneErrores,
  validarConfirmacion,
  validarCuenta,
  validarDescripcionPortafolio,
  validarEmail,
  validarInstitucion,
  validarLogin,
  validarMovimiento,
  validarNombre,
  validarNombrePortafolio,
  validarPassword,
  validarPortafolio,
  validarRegistro,
  validarReversion,
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

describe('validarInstitucion', () => {
  it('acepta una institución completa', () => {
    const errores = validarInstitucion({
      nombre: 'Banco Ejemplo',
      tipo: 'BANCO',
      pais: 'México',
      sitioWeb: 'https://example.com',
    });

    expect(tieneErrores(errores)).toBe(false);
  });

  it('exige nombre y categoría', () => {
    const errores = validarInstitucion({
      nombre: '   ',
      tipo: '',
      pais: '',
      sitioWeb: '',
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.tipo).toBeDefined();
  });

  it('limita la longitud de los campos opcionales', () => {
    const errores = validarInstitucion({
      nombre: 'a'.repeat(151),
      tipo: 'OTRA',
      pais: 'a'.repeat(101),
      sitioWeb: 'a'.repeat(256),
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.pais).toBeDefined();
    expect(errores.sitioWeb).toBeDefined();
  });
});

describe('validarMovimiento', () => {
  const base = {
    tipo: 'COMPRA' as const,
    cantidad: '2',
    precioUnitario: '20',
    comisiones: '0',
    impuestos: '0',
    tipoCambio: '1',
    costoTotalAjuste: '',
    fechaOperacion: '2026-01-10',
    fechaLiquidacion: '',
    observaciones: '',
  };

  it('acepta una compra completa', () => {
    const errores = validarMovimiento(base);
    expect(tieneErrores(errores)).toBe(false);
  });

  it('exige cantidad positiva y precio en compras y ventas', () => {
    const errores = validarMovimiento({
      ...base,
      cantidad: '0',
      precioUnitario: '',
    });

    expect(errores.cantidad).toBeDefined();
    expect(errores.precioUnitario).toBeDefined();
  });

  it('rechaza una venta superior a la cantidad disponible', () => {
    const errores = validarMovimiento(
      { ...base, tipo: 'VENTA', cantidad: '6' },
      { cantidadDisponible: '5' },
    );

    expect(errores.cantidad).toContain('supera lo disponible');
  });

  it('exige el costo total explícito en los ajustes', () => {
    const errores = validarMovimiento({
      ...base,
      tipo: 'AJUSTE_NEGATIVO',
      precioUnitario: '0',
      costoTotalAjuste: '',
    });

    expect(errores.costoTotalAjuste).toBeDefined();
  });

  it('valida fechas y tipo de cambio', () => {
    const errores = validarMovimiento({
      ...base,
      fechaOperacion: '2999-01-01',
      fechaLiquidacion: '2020-01-01',
      tipoCambio: '0',
      observaciones: 'a'.repeat(501),
    });

    expect(errores.fechaOperacion).toBeDefined();
    expect(errores.fechaLiquidacion).toBeDefined();
    expect(errores.tipoCambio).toBeDefined();
    expect(errores.observaciones).toBeDefined();
  });
});

describe('validarReversion', () => {
  it('acepta datos vacíos y rechaza una fecha futura', () => {
    expect(tieneErrores(validarReversion({
      fechaOperacion: '',
      observaciones: '',
    }))).toBe(false);

    expect(
      validarReversion({
        fechaOperacion: '2999-01-01',
        observaciones: '',
      }).fechaOperacion,
    ).toBeDefined();
  });
});

describe('validarCuenta', () => {
  it('acepta una cuenta completa y opcionales vacíos', () => {
    const errores = validarCuenta({
      nombre: 'Cuenta principal',
      institucionId: 'inst-1',
      tipoCuentaId: 'tipo-1',
      monedaId: 'moneda-1',
      descripcion: '',
      numeroCuenta: '',
    });

    expect(tieneErrores(errores)).toBe(false);
  });

  it('exige nombre, institución, tipo y moneda', () => {
    const errores = validarCuenta({
      nombre: ' ',
      institucionId: '',
      tipoCuentaId: '',
      monedaId: '',
      descripcion: '',
      numeroCuenta: '',
    });

    expect(errores.nombre).toBeDefined();
    expect(errores.institucionId).toBeDefined();
    expect(errores.tipoCuentaId).toBeDefined();
    expect(errores.monedaId).toBeDefined();
  });

  it('limita la descripción y la referencia', () => {
    const errores = validarCuenta({
      nombre: 'Cuenta',
      institucionId: 'inst-1',
      tipoCuentaId: 'tipo-1',
      monedaId: 'moneda-1',
      descripcion: 'a'.repeat(501),
      numeroCuenta: 'a'.repeat(65),
    });

    expect(errores.descripcion).toBeDefined();
    expect(errores.numeroCuenta).toBeDefined();
  });
});
