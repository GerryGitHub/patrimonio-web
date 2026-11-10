import { describe, expect, it } from 'vitest';
import {
  esDecimal,
  esDecimalNoNegativo,
  formatearCantidad,
  formatearImporte,
  multiplicarDecimales,
  normalizarDecimal,
  sumarDecimales,
} from './decimales';

describe('decimales', () => {
  it('valida decimales sin exponente', () => {
    expect(esDecimal('0.0001')).toBe(true);
    expect(esDecimal('-12.5')).toBe(true);
    expect(esDecimal('1e5')).toBe(false);
    expect(esDecimal('')).toBe(false);
  });

  it('acepta cero negativo pero rechaza importes negativos', () => {
    expect(esDecimalNoNegativo('0.0000')).toBe(true);
    expect(esDecimalNoNegativo('-0.00')).toBe(true);
    expect(esDecimalNoNegativo('-0.01')).toBe(false);
  });

  it('normaliza la escala que devuelve el backend', () => {
    expect(normalizarDecimal('270.3750000000')).toBe('270.375');
    expect(normalizarDecimal('0010.5000')).toBe('10.5');
    expect(normalizarDecimal('-0.0000')).toBe('0');
  });

  it('suma sin errores de coma flotante', () => {
    expect(sumarDecimales('0.1', '0.2')).toBe('0.3');
    expect(sumarDecimales('9850.00', '1472.625')).toBe('11322.625');
  });

  it('multiplica cantidad por costo unitario con precisión exacta', () => {
    expect(multiplicarDecimales('3.5', '420.75')).toBe('1472.625');
    expect(multiplicarDecimales('0.125', '62000.00')).toBe('7750');
    expect(multiplicarDecimales('1000', '9.85')).toBe('9850');
  });

  it('formatea importes con los decimales de la moneda', () => {
    expect(formatearImporte('1472.625', 2)).toBe('1472,63');
    expect(formatearImporte('15365.65', 2)).toBe('15.365,65');
    expect(formatearImporte(null)).toBe('-');
  });

  it('formatea cantidades fraccionarias conservando hasta diez decimales', () => {
    expect(formatearCantidad('0.125')).toBe('0,125');
    expect(formatearCantidad('10.0000000000')).toBe('10');
  });
});
