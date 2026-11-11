import { describe, expect, it } from 'vitest';
import type { Movimiento } from '../api/types';
import {
  esMovimientoRevertible,
  esTipoAjuste,
  esTipoConPrecio,
  etiquetaTipoMovimiento,
  nuevaClaveIdempotencia,
  tonoResultado,
} from './movimientos';

function movimiento(parcial: Partial<Movimiento>): Movimiento {
  return {
    id: 'movimiento-1',
    portafolioId: 'portafolio-1',
    cuentaId: 'cuenta-1',
    cuentaNombre: 'Cuenta',
    posicionId: 'posicion-1',
    instrumentoId: 'instrumento-1',
    instrumentoNombre: 'Instrumento',
    instrumentoSimbolo: null,
    tipo: 'COMPRA',
    tipoNombre: 'Compra',
    fechaOperacion: '2026-01-10',
    fechaLiquidacion: null,
    cantidad: '1.0000000000',
    precioUnitario: '20.00000000',
    importeBruto: '20.0000000000',
    comisiones: '0.0000000000',
    impuestos: '0.0000000000',
    monedaId: 'usd',
    monedaCodigo: 'USD',
    monedaNombre: 'Dólar',
    monedaSimbolo: '$',
    monedaDecimales: 2,
    tipoCambio: '1.0000000000',
    importeNeto: '20.0000000000',
    costoAplicado: '0.0000000000',
    resultadoRealizado: '0.0000000000',
    cantidadResultante: '1.0000000000',
    costoResultante: '20.0000000000',
    estado: 'CONFIRMADO',
    usuarioId: 'usuario-1',
    movimientoOrigenId: null,
    revertido: false,
    observaciones: null,
    fechaCreacion: '2026-01-10T10:00:00Z',
    ...parcial,
  };
}

describe('movimientos', () => {
  it('etiqueta cada tipo en español', () => {
    expect(etiquetaTipoMovimiento('COMPRA')).toBe('Compra');
    expect(etiquetaTipoMovimiento('AJUSTE_NEGATIVO')).toBe('Ajuste negativo');
    expect(etiquetaTipoMovimiento('REVERSION')).toBe('Reversión');
  });

  it('distingue ajustes y tipos con precio', () => {
    expect(esTipoAjuste('AJUSTE_POSITIVO')).toBe(true);
    expect(esTipoAjuste('COMPRA')).toBe(false);
    expect(esTipoConPrecio('VENTA')).toBe(true);
    expect(esTipoConPrecio('AJUSTE_NEGATIVO')).toBe(false);
  });

  it('solo permite revertir movimientos no revertidos y no compensatorios', () => {
    expect(esMovimientoRevertible(movimiento({}))).toBe(true);
    expect(esMovimientoRevertible(movimiento({ revertido: true }))).toBe(false);
    expect(esMovimientoRevertible(movimiento({ tipo: 'REVERSION' }))).toBe(
      false,
    );
  });

  it('clasifica el signo del resultado realizado', () => {
    expect(tonoResultado('12.5')).toBe('positivo');
    expect(tonoResultado('-3.25')).toBe('negativo');
    expect(tonoResultado('0.0000000000')).toBe('neutral');
  });

  it('genera claves de idempotencia distintas', () => {
    const primera = nuevaClaveIdempotencia();
    const segunda = nuevaClaveIdempotencia();
    expect(primera).toBeTruthy();
    expect(primera).not.toBe(segunda);
  });
});
