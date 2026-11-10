import type {
  CostoPorMoneda,
  DistribucionCategoria,
  ResumenPosiciones,
} from '../api/types';
import { sumarDecimales } from './decimales';

/** Resumen vacío con la misma forma que devuelve el backend. */
export function resumenVacio(): ResumenPosiciones {
  return {
    totalPosiciones: 0,
    posicionesActivas: 0,
    instrumentosDistintos: 0,
    costoPorMoneda: [],
    distribucionPorCategoria: [],
  };
}

function fusionarCostos(
  costos: CostoPorMoneda[],
  nuevos: CostoPorMoneda[],
): CostoPorMoneda[] {
  const porMoneda = new Map<string, CostoPorMoneda>(
    costos.map((costo) => [costo.monedaId, { ...costo }]),
  );
  for (const costo of nuevos) {
    const existente = porMoneda.get(costo.monedaId);
    if (existente) {
      existente.costo = sumarDecimales(existente.costo, costo.costo);
    } else {
      porMoneda.set(costo.monedaId, { ...costo });
    }
  }
  return [...porMoneda.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/**
 * Combina los resúmenes de varios portafolios.
 *
 * <p>Los importes solo se suman dentro de la misma moneda. Los conteos son la
 * suma de cada portafolio; un mismo instrumento en dos portafolios puede
 * contarse dos veces porque el resumen no expone los identificadores.</p>
 */
export function combinarResumenes(
  resumenes: ResumenPosiciones[],
): ResumenPosiciones {
  const porCategoria = new Map<string, DistribucionCategoria>();
  let totalPosiciones = 0;
  let posicionesActivas = 0;
  let instrumentosDistintos = 0;
  let costoPorMoneda: CostoPorMoneda[] = [];

  for (const resumen of resumenes) {
    totalPosiciones += resumen.totalPosiciones;
    posicionesActivas += resumen.posicionesActivas;
    instrumentosDistintos += resumen.instrumentosDistintos;
    costoPorMoneda = fusionarCostos(costoPorMoneda, resumen.costoPorMoneda);

    for (const categoria of resumen.distribucionPorCategoria) {
      const existente = porCategoria.get(categoria.claseActivoId);
      if (existente) {
        existente.posiciones += categoria.posiciones;
        existente.instrumentos += categoria.instrumentos;
        existente.costoPorMoneda = fusionarCostos(
          existente.costoPorMoneda,
          categoria.costoPorMoneda,
        );
      } else {
        porCategoria.set(categoria.claseActivoId, {
          ...categoria,
          costoPorMoneda: categoria.costoPorMoneda.map((costo) => ({
            ...costo,
          })),
        });
      }
    }
  }

  return {
    totalPosiciones,
    posicionesActivas,
    instrumentosDistintos,
    costoPorMoneda,
    distribucionPorCategoria: [...porCategoria.values()].sort((a, b) =>
      a.claseActivoNombre.localeCompare(b.claseActivoNombre),
    ),
  };
}
