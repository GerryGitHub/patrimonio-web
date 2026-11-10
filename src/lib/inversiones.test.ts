import { describe, expect, it } from 'vitest';
import type { ResumenPosiciones } from '../api/types';
import { combinarResumenes, resumenVacio } from './inversiones';

function resumen(
  parcial: Partial<ResumenPosiciones>,
): ResumenPosiciones {
  return { ...resumenVacio(), ...parcial };
}

describe('inversiones', () => {
  it('devuelve un resumen vacío con la forma del backend', () => {
    expect(resumenVacio()).toEqual({
      totalPosiciones: 0,
      posicionesActivas: 0,
      instrumentosDistintos: 0,
      costoPorMoneda: [],
      distribucionPorCategoria: [],
    });
  });

  it('suma los costos solo dentro de la misma moneda', () => {
    const combinado = combinarResumenes([
      resumen({
        costoPorMoneda: [
          {
            monedaId: 'usd',
            codigo: 'USD',
            nombre: 'Dólar estadounidense',
            simbolo: '$',
            decimales: 2,
            costo: '1472.625',
          },
        ],
      }),
      resumen({
        costoPorMoneda: [
          {
            monedaId: 'usd',
            codigo: 'USD',
            nombre: 'Dólar estadounidense',
            simbolo: '$',
            decimales: 2,
            costo: '1855.00',
          },
          {
            monedaId: 'mxn',
            codigo: 'MXN',
            nombre: 'Peso mexicano',
            simbolo: '$',
            decimales: 2,
            costo: '9850.00',
          },
        ],
      }),
    ]);

    expect(combinado.costoPorMoneda).toEqual([
      {
        monedaId: 'mxn',
        codigo: 'MXN',
        nombre: 'Peso mexicano',
        simbolo: '$',
        decimales: 2,
        costo: '9850.00',
      },
      {
        monedaId: 'usd',
        codigo: 'USD',
        nombre: 'Dólar estadounidense',
        simbolo: '$',
        decimales: 2,
        costo: '3327.625',
      },
    ]);
  });

  it('combina conteos y distribuciones por categoría', () => {
    const combinado = combinarResumenes([
      resumen({
        totalPosiciones: 2,
        posicionesActivas: 2,
        instrumentosDistintos: 2,
        distribucionPorCategoria: [
          {
            claseActivoId: 'rv',
            claseActivoNombre: 'Renta variable',
            posiciones: 2,
            instrumentos: 2,
            costoPorMoneda: [
              {
                monedaId: 'usd',
                codigo: 'USD',
                nombre: 'Dólar estadounidense',
                simbolo: '$',
                decimales: 2,
                costo: '1855.00',
              },
            ],
          },
        ],
      }),
      resumen({
        totalPosiciones: 1,
        posicionesActivas: 1,
        instrumentosDistintos: 1,
        distribucionPorCategoria: [
          {
            claseActivoId: 'rv',
            claseActivoNombre: 'Renta variable',
            posiciones: 1,
            instrumentos: 1,
            costoPorMoneda: [
              {
                monedaId: 'usd',
                codigo: 'USD',
                nombre: 'Dólar estadounidense',
                simbolo: '$',
                decimales: 2,
                costo: '1472.625',
              },
            ],
          },
          {
            claseActivoId: 'ad',
            claseActivoNombre: 'Activos digitales',
            posiciones: 2,
            instrumentos: 2,
            costoPorMoneda: [
              {
                monedaId: 'usd',
                codigo: 'USD',
                nombre: 'Dólar estadounidense',
                simbolo: '$',
                decimales: 2,
                costo: '12038.025',
              },
            ],
          },
        ],
      }),
    ]);

    expect(combinado.totalPosiciones).toBe(3);
    expect(combinado.posicionesActivas).toBe(3);
    expect(combinado.instrumentosDistintos).toBe(3);
    expect(
      combinado.distribucionPorCategoria.map((categoria) => ({
        nombre: categoria.claseActivoNombre,
        posiciones: categoria.posiciones,
        costo: categoria.costoPorMoneda[0]?.costo,
      })),
    ).toEqual([
      { nombre: 'Activos digitales', posiciones: 2, costo: '12038.025' },
      { nombre: 'Renta variable', posiciones: 3, costo: '3327.625' },
    ]);
  });
});
