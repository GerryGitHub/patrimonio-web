import type {
  CentroPatrimonio,
  ImporteMonedaPatrimonio,
  IndicadorPatrimonio,
  MonedaPatrimonio,
} from '../../api/types';

export const MONEDA_USD: MonedaPatrimonio = {
  id: 'moneda-usd',
  codigo: 'USD',
  nombre: 'Dólar estadounidense',
  simbolo: '$',
  decimales: 2,
};

export function importe(
  valor: string,
  moneda: MonedaPatrimonio = MONEDA_USD,
): ImporteMonedaPatrimonio {
  return {
    monedaId: moneda.id,
    codigo: moneda.codigo,
    nombre: moneda.nombre,
    simbolo: moneda.simbolo,
    decimales: moneda.decimales,
    importe: valor,
  };
}

export function indicador(
  codigo: string,
  etiqueta: string,
  importes: ImporteMonedaPatrimonio[],
  estado: IndicadorPatrimonio['estado'] = 'DISPONIBLE',
  motivo: string | null = null,
): IndicadorPatrimonio {
  return { codigo, etiqueta, estado, motivo, importes };
}

/**
 * Centro de Patrimonio de prueba.
 *
 * <p>Reproduce la semántica parcial de la Entrega 4: los activos a costo y el
 * resultado realizado están disponibles; efectivo, pasivos y valor de mercado
 * no lo están. Sirve para comprobar que la interfaz no rellena ausencias con
 * ceros.</p>
 */
export function crearCentroPatrimonio(
  parcial: Partial<CentroPatrimonio> = {},
): CentroPatrimonio {
  const base: CentroPatrimonio = {
    meta: {
      portafolios: [
        {
          id: 'portafolio-1',
          nombre: 'Portafolio principal',
          monedaBaseCodigo: 'USD',
          monedaBaseDecimales: 2,
        },
      ],
      monedaFiltro: null,
      periodo: 'TODO',
      generadoEn: '2026-02-01T12:00:00Z',
      estado: 'PARCIAL',
      cobertura: {
        incluye: ['INVERSIONES_A_COSTO', 'RESULTADO_REALIZADO'],
        excluye: ['EFECTIVO', 'PASIVOS', 'VALOR_MERCADO'],
      },
      limitaciones: [
        'La cobertura incluye solo inversiones registradas a costo.',
      ],
    },
    resumen: {
      patrimonioNeto: indicador(
        'PATRIMONIO_NETO',
        'Patrimonio neto',
        [],
        'NO_DISPONIBLE',
        'Faltan efectivo y pasivos para calcular el patrimonio neto.',
      ),
      activosRegistrados: indicador(
        'ACTIVOS_REGISTRADOS',
        'Activos registrados a costo',
        [importe('1500.00')],
        'PARCIAL',
        'Solo incluye inversiones registradas a costo.',
      ),
      pasivos: indicador(
        'PASIVOS',
        'Pasivos',
        [],
        'NO_DISPONIBLE',
        'El módulo de pasivos aún no está disponible.',
      ),
      capitalInvertido: indicador(
        'CAPITAL_INVERTIDO',
        'Capital invertido a costo',
        [importe('1500.00')],
      ),
      capitalAportado: indicador(
        'CAPITAL_APORTADO',
        'Capital aportado histórico',
        [],
        'NO_DISPONIBLE',
        'Falta el historial de aportes y retiros.',
      ),
      liquidezDisponible: indicador(
        'LIQUIDEZ_DISPONIBLE',
        'Liquidez disponible',
        [],
        'NO_DISPONIBLE',
        'Los saldos de efectivo aún no se registran.',
      ),
      resultadoRealizado: indicador(
        'RESULTADO_REALIZADO',
        'Resultado realizado acumulado',
        [importe('250.00')],
      ),
      resultadoNoRealizado: indicador(
        'RESULTADO_NO_REALIZADO',
        'Resultado no realizado',
        [],
        'NO_DISPONIBLE',
        'Requiere valuación de mercado.',
      ),
    },
    distribucion: {
      dimension: 'CLASE_ACTIVO',
      porMoneda: [
        {
          moneda: MONEDA_USD,
          total: '1500.00',
          segmentos: [
            {
              clave: 'acciones',
              nombre: 'Acciones y ETFs',
              importe: '1000.00',
              porcentaje: '66.6667',
              posiciones: 2,
              instrumentos: 2,
            },
            {
              clave: 'renta-fija',
              nombre: 'Renta fija',
              importe: '500.00',
              porcentaje: '33.3333',
              posiciones: 1,
              instrumentos: 1,
            },
          ],
        },
      ],
      limitaciones: [
        'Los porcentajes se calculan dentro de cada moneda.',
      ],
    },
    evolucion: {
      periodo: 'TODO',
      desde: '2026-01-01',
      hasta: '2026-02-01',
      granularidad: 'MENSUAL',
      series: [
        {
          codigo: 'COSTO_ADQUISICION',
          etiqueta: 'Costo de adquisición vigente',
          estado: 'DISPONIBLE',
          motivo: null,
          porMoneda: [
            {
              moneda: MONEDA_USD,
              puntos: [
                { fecha: '2026-01-01', valor: '1000.00' },
                { fecha: '2026-02-01', valor: '1500.00' },
              ],
            },
          ],
        },
        {
          codigo: 'RESULTADO_REALIZADO',
          etiqueta: 'Resultado realizado acumulado',
          estado: 'DISPONIBLE',
          motivo: null,
          porMoneda: [
            {
              moneda: MONEDA_USD,
              puntos: [
                { fecha: '2026-01-01', valor: '0.00' },
                { fecha: '2026-02-01', valor: '250.00' },
              ],
            },
          ],
        },
        {
          codigo: 'VALOR_MERCADO',
          etiqueta: 'Valor de mercado',
          estado: 'NO_DISPONIBLE',
          motivo: 'Requiere una fuente de valuación de mercado.',
          porMoneda: [],
        },
      ],
      desglosePorClase: [
        {
          claseActivoId: 'clase-acciones',
          claseActivoNombre: 'Acciones y ETFs',
          porMoneda: [
            {
              moneda: MONEDA_USD,
              puntos: [{ fecha: '2026-02-01', valor: '1000.00' }],
            },
          ],
        },
      ],
      limitaciones: ['No se interpolan fechas sin registros.'],
    },
    rendimientos: {
      desde: '2026-01-01',
      hasta: '2026-02-01',
      resultadoRealizado: indicador(
        'RESULTADO_REALIZADO',
        'Resultado realizado',
        [importe('250.00')],
      ),
      comisionesPagadas: indicador(
        'COMISIONES',
        'Comisiones pagadas',
        [importe('12.00')],
      ),
      impuestosPagados: indicador(
        'IMPUESTOS',
        'Impuestos pagados',
        [importe('3.00')],
      ),
      interesesRecibidos: indicador(
        'INTERESES',
        'Intereses recibidos',
        [],
        'NO_DISPONIBLE',
        'El registro de intereses aún no está disponible.',
      ),
      dividendosRecibidos: indicador(
        'DIVIDENDOS',
        'Dividendos recibidos',
        [],
        'NO_DISPONIBLE',
        'El registro de dividendos aún no está disponible.',
      ),
      resultadoNoRealizado: indicador(
        'RESULTADO_NO_REALIZADO',
        'Resultado no realizado',
        [],
        'NO_DISPONIBLE',
        'Requiere valuación de mercado.',
      ),
      rendimientoPorcentual: indicador(
        'RENDIMIENTO_PORCENTUAL',
        'Rendimiento porcentual',
        [],
        'NO_DISPONIBLE',
        'Requiere capital aportado y flujos completos.',
      ),
      metodologiasPrevistas: ['TWR', 'IRR'],
      nota: 'El resultado realizado ya descuenta comisiones e impuestos de venta.',
    },
    liquidez: {
      estado: 'PARCIAL',
      efectivoPorCuenta: {
        estado: 'NO_DISPONIBLE',
        motivo: 'El saldo de efectivo no está registrado en el esquema actual.',
        cuentas: [
          {
            cuentaId: 'cuenta-1',
            nombre: 'Cuenta de corretaje',
            institucionNombre: 'Casa de bolsa',
            moneda: MONEDA_USD,
            activa: true,
            saldo: null,
          },
        ],
      },
      efectivoPorInstitucion: {
        estado: 'NO_DISPONIBLE',
        motivo: 'No hay saldos de efectivo para agrupar.',
        segmentos: [],
      },
      disponibilidadInmediata: indicador(
        'DISPONIBILIDAD_INMEDIATA',
        'Disponibilidad inmediata',
        [],
        'NO_DISPONIBLE',
        'Los saldos de efectivo aún no se registran.',
      ),
      capitalComprometido: indicador(
        'CAPITAL_COMPROMETIDO',
        'Capital comprometido',
        [importe('1500.00')],
      ),
      proximosVencimientos: {
        estado: 'NO_DISPONIBLE',
        motivo: 'No existen contratos con vencimientos registrados.',
        eventos: [],
      },
    },
    eventos: {
      estado: 'NO_DISPONIBLE',
      motivo: 'No existen contratos, pagos ni dividendos registrados.',
      eventos: [],
    },
  };

  return { ...base, ...parcial };
}
