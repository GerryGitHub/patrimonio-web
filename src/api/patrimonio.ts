import { postConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  CentroPatrimonio,
  CrearSnapshotPatrimonioDatos,
  FiltrosPatrimonio,
  SnapshotPatrimonio,
} from './types';

function rutaCentro(portafolioId: string | null): string {
  return portafolioId
    ? `/v1/portafolios/${encodeURIComponent(portafolioId)}/patrimonio/centro`
    : '/v1/patrimonio/centro';
}

function rutaSnapshots(portafolioId: string): string {
  return `/v1/portafolios/${encodeURIComponent(
    portafolioId,
  )}/patrimonio/snapshots`;
}

function rutaConFiltros(
  base: string,
  filtros?: FiltrosPatrimonio,
): string {
  const params = new URLSearchParams();
  if (filtros?.moneda) {
    params.set('moneda', filtros.moneda);
  }
  if (filtros?.periodo) {
    params.set('periodo', filtros.periodo);
  }
  if (filtros?.dimension) {
    params.set('dimension', filtros.dimension);
  }
  if (filtros?.desde) {
    params.set('desde', filtros.desde);
  }
  if (filtros?.hasta) {
    params.set('hasta', filtros.hasta);
  }
  const consulta = params.toString();
  return consulta ? `${base}?${consulta}` : base;
}

/**
 * Centro de Patrimonio consolidado.
 *
 * <p>Cuando {@code portafolioId} es {@code null} se consulta el endpoint
 * global, que solo devuelve los portafolios autorizados del usuario. Los
 * filtros nunca provocan conversión de monedas: el backend agrupa cada divisa
 * por separado.</p>
 */
export function obtenerCentroPatrimonio(
  portafolioId: string | null,
  filtros?: FiltrosPatrimonio,
): Promise<CentroPatrimonio> {
  return http.get<CentroPatrimonio>(
    rutaConFiltros(rutaCentro(portafolioId), filtros),
  );
}

export function listarSnapshotsPatrimonio(
  portafolioId: string,
): Promise<SnapshotPatrimonio[]> {
  return http.get<SnapshotPatrimonio[]>(rutaSnapshots(portafolioId));
}

/**
 * Captura manual de un snapshot.
 *
 * <p>El backend es idempotente por portafolio, fecha, moneda y fuente: repetir
 * la captura del mismo día devuelve los snapshots existentes sin duplicarlos.
 * No se envían importes desde el cliente; el servidor los calcula.</p>
 */
export function crearSnapshotPatrimonio(
  portafolioId: string,
  datos: CrearSnapshotPatrimonioDatos = {},
): Promise<SnapshotPatrimonio[]> {
  return postConCsrf<SnapshotPatrimonio[]>(
    rutaSnapshots(portafolioId),
    datos,
  );
}
