import { patchConCsrf, postConCsrf, putConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  ClaseActivo,
  DatosInstrumento,
  FiltrosInstrumentos,
  Instrumento,
  TipoInstrumento,
} from './types';

const RUTA_INSTRUMENTOS = '/v1/instrumentos';

function rutaInstrumento(instrumentoId: string): string {
  return `${RUTA_INSTRUMENTOS}/${encodeURIComponent(instrumentoId)}`;
}

function rutaConFiltros(filtros?: FiltrosInstrumentos): string {
  const params = new URLSearchParams();
  if (filtros?.busqueda?.trim()) {
    params.set('busqueda', filtros.busqueda.trim());
  }
  if (filtros?.claseActivoId) {
    params.set('claseActivoId', filtros.claseActivoId);
  }
  if (filtros?.tipoInstrumentoId) {
    params.set('tipoInstrumentoId', filtros.tipoInstrumentoId);
  }
  if (filtros?.activo !== undefined) {
    params.set('activo', String(filtros.activo));
  }
  const query = params.toString();
  return query ? `${RUTA_INSTRUMENTOS}?${query}` : RUTA_INSTRUMENTOS;
}

export function listarCategoriasInstrumento(): Promise<ClaseActivo[]> {
  return http.get<ClaseActivo[]>(`${RUTA_INSTRUMENTOS}/categorias`);
}

export function listarTiposInstrumento(
  claseActivoId?: string,
): Promise<TipoInstrumento[]> {
  const params = new URLSearchParams();
  if (claseActivoId) {
    params.set('claseActivoId', claseActivoId);
  }
  const query = params.toString();
  return http.get<TipoInstrumento[]>(
    query ? `${RUTA_INSTRUMENTOS}/tipos?${query}` : `${RUTA_INSTRUMENTOS}/tipos`,
  );
}

export function listarInstrumentos(
  filtros?: FiltrosInstrumentos,
): Promise<Instrumento[]> {
  return http.get<Instrumento[]>(rutaConFiltros(filtros));
}

export function obtenerInstrumento(
  instrumentoId: string,
): Promise<Instrumento> {
  return http.get<Instrumento>(rutaInstrumento(instrumentoId));
}

export function crearInstrumento(
  datos: DatosInstrumento,
): Promise<Instrumento> {
  return postConCsrf<Instrumento>(RUTA_INSTRUMENTOS, datos);
}

export function actualizarInstrumento(
  instrumentoId: string,
  datos: DatosInstrumento,
): Promise<Instrumento> {
  return putConCsrf<Instrumento>(rutaInstrumento(instrumentoId), datos);
}

export function cambiarEstadoInstrumento(
  instrumentoId: string,
  activo: boolean,
): Promise<Instrumento> {
  return patchConCsrf<Instrumento>(
    `${rutaInstrumento(instrumentoId)}/estado`,
    { activo },
  );
}
