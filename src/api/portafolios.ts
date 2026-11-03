import { http } from '../lib/http';
import type { CuentaFinanciera, Portafolio } from './types';

export function listarPortafolios(): Promise<Portafolio[]> {
  return http.get<Portafolio[]>('/v1/portafolios');
}

export function listarCuentas(
  portafolioId: string,
): Promise<CuentaFinanciera[]> {
  return http.get<CuentaFinanciera[]>(
    `/v1/portafolios/${encodeURIComponent(portafolioId)}/cuentas`,
  );
}
