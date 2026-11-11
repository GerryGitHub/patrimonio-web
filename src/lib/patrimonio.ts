import type {
  CentroPatrimonio,
  DimensionDistribucion,
  EstadoInformacion,
  EvolucionPatrimonio,
  GranularidadEvolucion,
  ImporteMonedaPatrimonio,
  IndicadorPatrimonio,
  MonedaPatrimonio,
  PeriodoPatrimonial,
  SerieEvolucionPatrimonio,
  SerieMonedaPatrimonio,
} from '../api/types';

/** Opción ligera para los selectores de moneda. */
export interface OpcionMoneda {
  codigo: string;
  nombre: string;
}

export const ETIQUETAS_ESTADO: Record<EstadoInformacion, string> = {
  DISPONIBLE: 'Disponible',
  PARCIAL: 'Cobertura parcial',
  NO_DISPONIBLE: 'No disponible',
};

export type TonoEstado = 'activo' | 'pendiente' | 'neutral';

export function tonoEstado(estado: EstadoInformacion): TonoEstado {
  switch (estado) {
    case 'DISPONIBLE':
      return 'activo';
    case 'PARCIAL':
      return 'pendiente';
    case 'NO_DISPONIBLE':
      return 'neutral';
  }
}

export const ETIQUETAS_PERIODO: Record<PeriodoPatrimonial, string> = {
  '1M': 'Último mes',
  '3M': 'Últimos 3 meses',
  '6M': 'Últimos 6 meses',
  '1A': 'Último año',
  TODO: 'Todo el historial',
};

export const ETIQUETAS_DIMENSION: Record<DimensionDistribucion, string> = {
  CLASE_ACTIVO: 'Clase de activo',
  TIPO_INSTRUMENTO: 'Tipo de instrumento',
  INSTITUCION: 'Institución',
  CUENTA: 'Cuenta',
  MONEDA: 'Moneda',
};

export const ETIQUETAS_GRANULARIDAD: Record<GranularidadEvolucion, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  MENSUAL: 'Mensual',
};

const ETIQUETAS_COBERTURA: Record<string, string> = {
  INVERSIONES_A_COSTO: 'Inversiones registradas a costo',
  RESULTADO_REALIZADO: 'Resultado realizado',
  COMISIONES: 'Comisiones',
  IMPUESTOS: 'Impuestos',
  EFECTIVO: 'Efectivo',
  ACTIVOS_FISICOS: 'Activos físicos',
  PASIVOS: 'Pasivos',
  VALOR_MERCADO: 'Valor de mercado',
  INTERESES: 'Intereses',
  DIVIDENDOS: 'Dividendos',
  CAPITAL_APORTADO: 'Capital aportado histórico',
};

export function etiquetaCobertura(codigo: string): string {
  return ETIQUETAS_COBERTURA[codigo] ?? codigo;
}

function agregarMoneda(
  mapa: Map<string, OpcionMoneda>,
  moneda: MonedaPatrimonio | null | undefined,
): void {
  if (!moneda?.codigo || mapa.has(moneda.codigo)) {
    return;
  }
  mapa.set(moneda.codigo, {
    codigo: moneda.codigo,
    nombre: moneda.nombre || moneda.codigo,
  });
}

function agregarImportes(
  mapa: Map<string, OpcionMoneda>,
  importes: ImporteMonedaPatrimonio[],
): void {
  for (const importe of importes) {
    if (!mapa.has(importe.codigo)) {
      mapa.set(importe.codigo, {
        codigo: importe.codigo,
        nombre: importe.nombre || importe.codigo,
      });
    }
  }
}

function agregarIndicador(
  mapa: Map<string, OpcionMoneda>,
  indicador: IndicadorPatrimonio | null | undefined,
): void {
  if (indicador) {
    agregarImportes(mapa, indicador.importes);
  }
}

/**
 * Reúne las monedas presentes en el Centro de Patrimonio.
 *
 * <p>Se usa para poblar el selector. La lista se acumula en la interfaz para
 * que elegir una moneda no haga desaparecer las demás opciones. No se suman
 * divisas ni se inventan tipos de cambio.</p>
 */
export function monedasDeCentro(centro: CentroPatrimonio): OpcionMoneda[] {
  const mapa = new Map<string, OpcionMoneda>();

  const resumen = centro.resumen;
  agregarIndicador(mapa, resumen.patrimonioNeto);
  agregarIndicador(mapa, resumen.activosRegistrados);
  agregarIndicador(mapa, resumen.pasivos);
  agregarIndicador(mapa, resumen.capitalInvertido);
  agregarIndicador(mapa, resumen.capitalAportado);
  agregarIndicador(mapa, resumen.liquidezDisponible);
  agregarIndicador(mapa, resumen.resultadoRealizado);
  agregarIndicador(mapa, resumen.resultadoNoRealizado);

  for (const distribucion of centro.distribucion.porMoneda) {
    agregarMoneda(mapa, distribucion.moneda);
  }

  for (const serie of centro.evolucion.series) {
    for (const moneda of serie.porMoneda) {
      agregarMoneda(mapa, moneda.moneda);
    }
  }

  for (const desglose of centro.evolucion.desglosePorClase) {
    for (const moneda of desglose.porMoneda) {
      agregarMoneda(mapa, moneda.moneda);
    }
  }

  for (const cuenta of centro.liquidez.efectivoPorCuenta.cuentas) {
    agregarMoneda(mapa, cuenta.moneda);
  }

  agregarIndicador(mapa, centro.liquidez.disponibilidadInmediata);
  agregarIndicador(mapa, centro.liquidez.capitalComprometido);

  const rendimientos = centro.rendimientos;
  agregarIndicador(mapa, rendimientos.resultadoRealizado);
  agregarIndicador(mapa, rendimientos.comisionesPagadas);
  agregarIndicador(mapa, rendimientos.impuestosPagados);
  agregarIndicador(mapa, rendimientos.interesesRecibidos);
  agregarIndicador(mapa, rendimientos.dividendosRecibidos);
  agregarIndicador(mapa, rendimientos.resultadoNoRealizado);
  agregarIndicador(mapa, rendimientos.rendimientoPorcentual);

  for (const evento of centro.eventos.eventos) {
    agregarMoneda(mapa, evento.moneda);
  }

  // Las monedas base de los portafolios se añaden al final para no perder el
  // nombre completo que ya aportaron las posiciones, cuentas o series.
  for (const portafolio of centro.meta.portafolios) {
    const codigo = portafolio.monedaBaseCodigo;
    if (codigo && !mapa.has(codigo)) {
      mapa.set(codigo, { codigo, nombre: codigo });
    }
  }

  if (centro.meta.monedaFiltro && !mapa.has(centro.meta.monedaFiltro)) {
    mapa.set(centro.meta.monedaFiltro, {
      codigo: centro.meta.monedaFiltro,
      nombre: centro.meta.monedaFiltro,
    });
  }

  return [...mapa.values()].sort((a, b) =>
    a.codigo.localeCompare(b.codigo),
  );
}

/** Devuelve una serie por su código estable. */
export function serieDeEvolucion(
  evolucion: EvolucionPatrimonio,
  codigo: string,
): SerieEvolucionPatrimonio | undefined {
  return evolucion.series.find((serie) => serie.codigo === codigo);
}

/** Serie de una moneda concreta dentro de una serie de evolución. */
export function serieMoneda(
  serie: SerieEvolucionPatrimonio | undefined,
  codigoMoneda: string,
): SerieMonedaPatrimonio | undefined {
  return serie?.porMoneda.find(
    (moneda) => moneda.moneda.codigo === codigoMoneda,
  );
}

/** Monedas con puntos disponibles en una serie. */
export function monedasConPuntos(
  serie: SerieEvolucionPatrimonio | undefined,
): MonedaPatrimonio[] {
  if (!serie) {
    return [];
  }
  return serie.porMoneda
    .filter((moneda) => moneda.puntos.length > 0)
    .map((moneda) => moneda.moneda);
}

/** Último valor registrado de una serie monetaria. */
export function ultimoValor(
  serie: SerieMonedaPatrimonio | undefined,
): string | null {
  if (!serie || serie.puntos.length === 0) {
    return null;
  }
  return serie.puntos[serie.puntos.length - 1]?.valor ?? null;
}

/** Formatea un porcentaje ya serializado como cadena. */
export function formatearPorcentaje(
  valor: string | null | undefined,
): string {
  if (!valor) {
    return '—';
  }
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return valor;
  }
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero)} %`;
}

/** Cuentas registradas y activas de la sección de liquidez. */
export function contarCuentas(centro: CentroPatrimonio): {
  total: number;
  activas: number;
} {
  const cuentas = centro.liquidez.efectivoPorCuenta.cuentas;
  return {
    total: cuentas.length,
    activas: cuentas.filter((cuenta) => cuenta.activa).length,
  };
}

/** Indica si un indicador tiene al menos un importe real. */
export function tieneImportes(
  indicador: IndicadorPatrimonio | null | undefined,
): boolean {
  return Boolean(indicador && indicador.importes.length > 0);
}
