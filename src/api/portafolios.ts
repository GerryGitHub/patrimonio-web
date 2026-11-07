import { postConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  CrearPortafolioDatos,
  Moneda,
  Portafolio,
} from './types';

export function listarPortafolios(): Promise<Portafolio[]> {
  return http.get<Portafolio[]>('/v1/portafolios');
}

export function listarMonedas(): Promise<Moneda[]> {
  return http.get<Moneda[]>('/v1/monedas');
}

export function crearPortafolio(
  datos: CrearPortafolioDatos,
): Promise<Portafolio> {
  return postConCsrf<Portafolio>('/v1/portafolios', {
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    monedaBaseId: datos.monedaBaseId,
  });
}
