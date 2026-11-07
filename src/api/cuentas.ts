import { patchConCsrf, postConCsrf, putConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  ActualizarCuentaDatos,
  CrearCuentaDatos,
  CuentaFinanciera,
  FiltrosCuentas,
  TipoCuenta,
} from './types';

function rutaCuentas(portafolioId: string): string {
  return `/v1/portafolios/${encodeURIComponent(portafolioId)}/cuentas`;
}

function rutaCuenta(portafolioId: string, cuentaId: string): string {
  return `${rutaCuentas(portafolioId)}/${encodeURIComponent(cuentaId)}`;
}

function rutaConFiltros(
  portafolioId: string,
  filtros?: FiltrosCuentas,
): string {
  const base = rutaCuentas(portafolioId);
  const params = new URLSearchParams();
  if (filtros?.institucionId) {
    params.set('institucionId', filtros.institucionId);
  }
  if (filtros?.tipoCuentaId) {
    params.set('tipoCuentaId', filtros.tipoCuentaId);
  }
  if (filtros?.activo !== undefined) {
    params.set('activo', String(filtros.activo));
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function listarTiposCuenta(): Promise<TipoCuenta[]> {
  return http.get<TipoCuenta[]>('/v1/tipos-cuenta');
}

export function listarCuentas(
  portafolioId: string,
  filtros?: FiltrosCuentas,
): Promise<CuentaFinanciera[]> {
  return http.get<CuentaFinanciera[]>(rutaConFiltros(portafolioId, filtros));
}

export function obtenerCuenta(
  portafolioId: string,
  cuentaId: string,
): Promise<CuentaFinanciera> {
  return http.get<CuentaFinanciera>(rutaCuenta(portafolioId, cuentaId));
}

export function crearCuenta(
  portafolioId: string,
  datos: CrearCuentaDatos,
): Promise<CuentaFinanciera> {
  return postConCsrf<CuentaFinanciera>(rutaCuentas(portafolioId), datos);
}

export function actualizarCuenta(
  portafolioId: string,
  cuentaId: string,
  datos: ActualizarCuentaDatos,
): Promise<CuentaFinanciera> {
  return putConCsrf<CuentaFinanciera>(
    rutaCuenta(portafolioId, cuentaId),
    datos,
  );
}

export function cambiarEstadoCuenta(
  portafolioId: string,
  cuentaId: string,
  activo: boolean,
): Promise<CuentaFinanciera> {
  return patchConCsrf<CuentaFinanciera>(
    `${rutaCuenta(portafolioId, cuentaId)}/estado`,
    { activo },
  );
}
