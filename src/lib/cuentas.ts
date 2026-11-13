import type { CostoPorMoneda, Posicion } from '../api/types';
import { sumarDecimales } from './decimales';

export interface ResumenCuenta {
  total: number;
  activas: number;
  inactivas: number;
  costoPorMoneda: CostoPorMoneda[];
}

/**
 * Resume las posiciones de una cuenta.
 *
 * <p>El costo se agrupa por moneda y nunca se convierte ni se suma entre
 * divisas distintas. El resultado es costo registrado, no saldo de efectivo ni
 * valor de mercado.</p>
 */
export function resumirPosicionesCuenta(
  posiciones: Posicion[],
): ResumenCuenta {
  const activas = posiciones.filter((posicion) => posicion.activo).length;
  const costoPorMoneda: CostoPorMoneda[] = [];

  for (const posicion of posiciones) {
    const existente = costoPorMoneda.find(
      (costo) => costo.monedaId === posicion.monedaId,
    );

    if (existente) {
      existente.costo = sumarDecimales(existente.costo, posicion.costoTotal);
    } else {
      costoPorMoneda.push({
        monedaId: posicion.monedaId,
        codigo: posicion.monedaCodigo,
        nombre: posicion.monedaNombre,
        simbolo: posicion.monedaSimbolo,
        decimales: posicion.monedaDecimales,
        costo: posicion.costoTotal,
      });
    }
  }

  return {
    total: posiciones.length,
    activas,
    inactivas: posiciones.length - activas,
    costoPorMoneda,
  };
}
