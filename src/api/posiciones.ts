import { patchConCsrf, postConCsrf, putConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  ActualizarPosicionDatos,
  CrearPosicionDatos,
  FiltrosPosiciones,
  Posicion,
  ResumenPosiciones,
} from './types';

function rutaPosiciones(portafolioId: string): string {
  return `/v1/portafolios/${encodeURIComponent(portafolioId)}/posiciones`;
}

function rutaPosicion(
  portafolioId: string,
  posicionId: string,
): string {
  return `${rutaPosiciones(portafolioId)}/${encodeURIComponent(posicionId)}`;
}

function rutaConFiltros(
  portafolioId: string,
  filtros?: FiltrosPosiciones,
): string {
  const base = rutaPosiciones(portafolioId);
  const params = new URLSearchParams();
  if (filtros?.cuentaId) {
    params.set('cuentaId', filtros.cuentaId);
  }
  if (filtros?.instrumentoId) {
    params.set('instrumentoId', filtros.instrumentoId);
  }
  if (filtros?.claseActivoId) {
    params.set('claseActivoId', filtros.claseActivoId);
  }
  if (filtros?.activo !== undefined) {
    params.set('activo', String(filtros.activo));
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function listarPosiciones(
  portafolioId: string,
  filtros?: FiltrosPosiciones,
): Promise<Posicion[]> {
  return http.get<Posicion[]>(rutaConFiltros(portafolioId, filtros));
}

export function obtenerPosicion(
  portafolioId: string,
  posicionId: string,
): Promise<Posicion> {
  return http.get<Posicion>(rutaPosicion(portafolioId, posicionId));
}

export function obtenerResumenPosiciones(
  portafolioId: string,
): Promise<ResumenPosiciones> {
  return http.get<ResumenPosiciones>(`${rutaPosiciones(portafolioId)}/resumen`);
}

export function crearPosicion(
  portafolioId: string,
  datos: CrearPosicionDatos,
): Promise<Posicion> {
  return postConCsrf<Posicion>(rutaPosiciones(portafolioId), datos);
}

export function actualizarPosicion(
  portafolioId: string,
  posicionId: string,
  datos: ActualizarPosicionDatos,
): Promise<Posicion> {
  return putConCsrf<Posicion>(
    rutaPosicion(portafolioId, posicionId),
    datos,
  );
}

export function cambiarEstadoPosicion(
  portafolioId: string,
  posicionId: string,
  activo: boolean,
): Promise<Posicion> {
  return patchConCsrf<Posicion>(
    `${rutaPosicion(portafolioId, posicionId)}/estado`,
    { activo },
  );
}
