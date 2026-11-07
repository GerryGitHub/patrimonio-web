import type { TipoInstitucion } from '../api/types';

export interface OpcionTipoInstitucion {
  valor: TipoInstitucion;
  etiqueta: string;
}

/**
 * Categorías del catálogo de instituciones.
 *
 * <p>Se mantiene una única lista en el cliente para los filtros y los
 * formularios. Los valores coinciden con el enum estable del backend.</p>
 */
export const TIPOS_INSTITUCION: OpcionTipoInstitucion[] = [
  { valor: 'BANCO', etiqueta: 'Banco' },
  { valor: 'SOFIPO', etiqueta: 'SOFIPO' },
  { valor: 'CASA_BOLSA', etiqueta: 'Casa de bolsa' },
  { valor: 'EXCHANGE', etiqueta: 'Exchange' },
  { valor: 'OTRA', etiqueta: 'Otra institución' }
];

const ETIQUETAS = new Map<TipoInstitucion, string>(
  TIPOS_INSTITUCION.map((opcion) => [opcion.valor, opcion.etiqueta]),
);

export function etiquetaTipoInstitucion(tipo: TipoInstitucion): string {
  return ETIQUETAS.get(tipo) ?? tipo;
}

/**
 * Devuelve una URL solo si usa HTTP o HTTPS.
 *
 * <p>El valor procede del backend y se muestra como enlace, así que se evita
 * cualquier esquema ejecutable como {@code javascript:}.</p>
 */
export function urlSegura(valor: string | null | undefined): string | null {
  if (!valor) {
    return null;
  }
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
