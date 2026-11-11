import { describe, expect, it } from 'vitest';
import {
  contarCuentas,
  etiquetaCobertura,
  formatearPorcentaje,
  monedasDeCentro,
  monedasConPuntos,
  serieDeEvolucion,
  serieMoneda,
  tieneImportes,
  tonoEstado,
  ultimoValor,
} from './patrimonio';
import {
  crearCentroPatrimonio,
  MONEDA_USD,
} from '../test/fixtures/patrimonio';

describe('helpers del Centro de Patrimonio', () => {
  it('traduce los estados de información a tonos visuales', () => {
    expect(tonoEstado('DISPONIBLE')).toBe('activo');
    expect(tonoEstado('PARCIAL')).toBe('pendiente');
    expect(tonoEstado('NO_DISPONIBLE')).toBe('neutral');
  });

  it('traduce los códigos de cobertura y conserva los desconocidos', () => {
    expect(etiquetaCobertura('INVERSIONES_A_COSTO')).toBe(
      'Inversiones registradas a costo',
    );
    expect(etiquetaCobertura('CODIGO_FUTURO')).toBe('CODIGO_FUTURO');
  });

  it('reúne cada moneda una sola vez y las ordena', () => {
    const centro = crearCentroPatrimonio();

    const monedas = monedasDeCentro(centro);

    expect(monedas).toHaveLength(1);
    expect(monedas[0]).toEqual({ codigo: 'USD', nombre: 'Dólar estadounidense' });
  });

  it('localiza una serie y la serie de una moneda concreta', () => {
    const centro = crearCentroPatrimonio();

    const serie = serieDeEvolucion(centro.evolucion, 'COSTO_ADQUISICION');
    const moneda = serieMoneda(serie, 'USD');

    expect(serie?.etiqueta).toBe('Costo de adquisición vigente');
    expect(moneda?.puntos).toHaveLength(2);
    expect(serieMoneda(serie, 'EUR')).toBeUndefined();
  });

  it('solo considera monedas con puntos y devuelve el último valor', () => {
    const centro = crearCentroPatrimonio();
    const serie = serieDeEvolucion(centro.evolucion, 'COSTO_ADQUISICION');
    const moneda = serieMoneda(serie, 'USD');

    expect(monedasConPuntos(serie)).toEqual([MONEDA_USD]);
    expect(ultimoValor(moneda)).toBe('1500.00');
    expect(ultimoValor(undefined)).toBeNull();
  });

  it('formatea porcentajes serializados y usa un guion cuando faltan', () => {
    expect(formatearPorcentaje('66.6667')).toBe('66,67 %');
    expect(formatearPorcentaje('100')).toBe('100 %');
    expect(formatearPorcentaje(null)).toBe('—');
    expect(formatearPorcentaje('')).toBe('—');
  });

  it('cuenta las cuentas registradas y activas', () => {
    const centro = crearCentroPatrimonio();

    expect(contarCuentas(centro)).toEqual({ total: 1, activas: 1 });
  });

  it('distingue un indicador con importes de uno sin fuente', () => {
    const centro = crearCentroPatrimonio();

    expect(tieneImportes(centro.resumen.activosRegistrados)).toBe(true);
    expect(tieneImportes(centro.resumen.patrimonioNeto)).toBe(false);
    expect(tieneImportes(null)).toBe(false);
  });
});
