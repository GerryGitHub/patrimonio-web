import { postConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  FiltrosMovimientos,
  Movimiento,
  PaginaMovimientos,
  ReconstruccionPosicion,
  RegistrarMovimientoDatos,
  ResumenPosicion,
  RevertirMovimientoDatos,
} from './types';

function rutaPosiciones(portafolioId: string): string {
  return `/v1/portafolios/${encodeURIComponent(portafolioId)}/posiciones`;
}

function rutaMovimientosDePosicion(
  portafolioId: string,
  posicionId: string,
): string {
  return `${rutaPosiciones(portafolioId)}/${encodeURIComponent(
    posicionId,
  )}/movimientos`;
}

function rutaMovimiento(
  portafolioId: string,
  movimientoId: string,
): string {
  return `/v1/portafolios/${encodeURIComponent(
    portafolioId,
  )}/movimientos/${encodeURIComponent(movimientoId)}`;
}

function rutaConFiltros(
  portafolioId: string,
  posicionId: string,
  filtros?: FiltrosMovimientos,
): string {
  const base = rutaMovimientosDePosicion(portafolioId, posicionId);
  const params = new URLSearchParams();
  if (filtros?.tipo) {
    params.set('tipo', filtros.tipo);
  }
  if (filtros?.desde) {
    params.set('desde', filtros.desde);
  }
  if (filtros?.hasta) {
    params.set('hasta', filtros.hasta);
  }
  if (filtros?.pagina !== undefined) {
    params.set('pagina', String(filtros.pagina));
  }
  if (filtros?.tamano !== undefined) {
    params.set('tamano', String(filtros.tamano));
  }
  if (filtros?.orden) {
    params.set('orden', filtros.orden);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function listarMovimientos(
  portafolioId: string,
  posicionId: string,
  filtros?: FiltrosMovimientos,
): Promise<PaginaMovimientos> {
  return http.get<PaginaMovimientos>(
    rutaConFiltros(portafolioId, posicionId, filtros),
  );
}

export function registrarMovimiento(
  portafolioId: string,
  posicionId: string,
  datos: RegistrarMovimientoDatos,
): Promise<Movimiento> {
  return postConCsrf<Movimiento>(
    rutaMovimientosDePosicion(portafolioId, posicionId),
    datos,
  );
}

export function obtenerMovimiento(
  portafolioId: string,
  movimientoId: string,
): Promise<Movimiento> {
  return http.get<Movimiento>(rutaMovimiento(portafolioId, movimientoId));
}

export function revertirMovimiento(
  portafolioId: string,
  movimientoId: string,
  datos: RevertirMovimientoDatos = {},
): Promise<Movimiento> {
  return postConCsrf<Movimiento>(
    `${rutaMovimiento(portafolioId, movimientoId)}/reversion`,
    datos,
  );
}

export function obtenerResumenPosicion(
  portafolioId: string,
  posicionId: string,
): Promise<ResumenPosicion> {
  return http.get<ResumenPosicion>(
    `${rutaPosiciones(portafolioId)}/${encodeURIComponent(posicionId)}/resumen`,
  );
}

export function reconstruirPosicion(
  portafolioId: string,
  posicionId: string,
  reparar = false,
): Promise<ReconstruccionPosicion> {
  return postConCsrf<ReconstruccionPosicion>(
    `${rutaPosiciones(portafolioId)}/${encodeURIComponent(
      posicionId,
    )}/reconstruccion`,
    { reparar },
  );
}
