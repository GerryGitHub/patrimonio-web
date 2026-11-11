import type { Movimiento, TipoMovimiento } from '../api/types';

/** Tipos que el usuario puede registrar directamente desde la interfaz. */
export const TIPOS_MOVIMIENTO_OPERABLES: TipoMovimiento[] = [
  'APERTURA',
  'COMPRA',
  'VENTA',
  'AJUSTE_POSITIVO',
  'AJUSTE_NEGATIVO',
];

export const ETIQUETAS_TIPO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  APERTURA: 'Apertura',
  COMPRA: 'Compra',
  VENTA: 'Venta',
  AJUSTE_POSITIVO: 'Ajuste positivo',
  AJUSTE_NEGATIVO: 'Ajuste negativo',
  REVERSION: 'Reversión',
};

export function etiquetaTipoMovimiento(tipo: TipoMovimiento): string {
  return ETIQUETAS_TIPO_MOVIMIENTO[tipo] ?? tipo;
}

export function esTipoAjuste(tipo: TipoMovimiento): boolean {
  return tipo === 'AJUSTE_POSITIVO' || tipo === 'AJUSTE_NEGATIVO';
}

export function esTipoConPrecio(tipo: TipoMovimiento): boolean {
  return tipo === 'APERTURA' || tipo === 'COMPRA' || tipo === 'VENTA';
}

/**
 * Indica si el movimiento admite una reversión.
 *
 * <p>Las reversiones no se revierten y un movimiento ya revertido no puede
 * volver a revertirse. El backend aplica la misma regla; aquí solo se evita
 * ofrecer una acción que terminaría en error.</p>
 */
export function esMovimientoRevertible(movimiento: Movimiento): boolean {
  return movimiento.tipo !== 'REVERSION' && !movimiento.revertido;
}

/** Tono visual del importe según el signo del resultado realizado. */
export function tonoResultado(resultado: string): 'positivo' | 'negativo' | 'neutral' {
  const limpio = resultado.trim();
  if (limpio.startsWith('-')) {
    return 'negativo';
  }
  const sinCeros = limpio.replace(/[0.,-]/g, '');
  return sinCeros ? 'positivo' : 'neutral';
}

/**
 * Genera una clave de idempotencia para reintentos seguros.
 *
 * <p>Se crea una por envío: si la petición se repite con la misma clave, el
 * backend devuelve el movimiento existente en lugar de duplicarlo.</p>
 */
export function nuevaClaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `mov-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
