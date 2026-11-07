import { postConCsrf } from './csrf';
import { http } from '../lib/http';
import type {
  CrearInstitucionDatos,
  FiltrosInstituciones,
  Institucion,
} from './types';

function rutaConFiltros(filtros?: FiltrosInstituciones): string {
  const params = new URLSearchParams();
  if (filtros?.tipo) {
    params.set('tipo', filtros.tipo);
  }
  if (filtros?.activo !== undefined) {
    params.set('activo', String(filtros.activo));
  }
  const query = params.toString();
  return query ? `/v1/instituciones?${query}` : '/v1/instituciones';
}

export function listarInstituciones(
  filtros?: FiltrosInstituciones,
): Promise<Institucion[]> {
  return http.get<Institucion[]>(rutaConFiltros(filtros));
}

export function crearInstitucion(
  datos: CrearInstitucionDatos,
): Promise<Institucion> {
  return postConCsrf<Institucion>('/v1/instituciones', {
    nombre: datos.nombre,
    tipo: datos.tipo,
    pais: datos.pais,
    sitioWeb: datos.sitioWeb,
  });
}
