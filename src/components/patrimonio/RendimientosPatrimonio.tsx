import type { RendimientosPatrimonio as RendimientosDatos } from '../../api/types';
import { formatearFecha } from '../../lib/format';
import { EstadoIndicador, ValorIndicador } from './EstadoIndicador';

interface RendimientosPatrimonioProps {
  rendimientos: RendimientosDatos;
}

/**
 * Rendimientos realizados y flujos conocidos.
 *
 * <p>El resultado realizado ya descuenta comisiones e impuestos de venta; por
 * eso los importes se muestran informativos y no se restan otra vez. Las
 * métricas que requieren flujos completos (intereses, dividendos, rendimiento
 * porcentual) permanecen no disponibles.</p>
 */
export function RendimientosPatrimonio({
  rendimientos,
}: RendimientosPatrimonioProps) {
  const indicadores = [
    rendimientos.resultadoRealizado,
    rendimientos.comisionesPagadas,
    rendimientos.impuestosPagados,
    rendimientos.interesesRecibidos,
    rendimientos.dividendosRecibidos,
    rendimientos.rendimientoPorcentual,
  ];

  return (
    <div className="rendimientos-patrimonio">
      <p className="rendimientos-patrimonio__periodo">
        {formatearFecha(rendimientos.desde)} —{' '}
        {formatearFecha(rendimientos.hasta)}
      </p>

      <div className="rendimientos-grid">
        {indicadores.map((indicador) => (
          <div className="rendimiento-item" key={indicador.codigo}>
            <div className="rendimiento-item__cabecera">
              <span className="rendimiento-item__etiqueta">
                {indicador.etiqueta}
              </span>
              <EstadoIndicador estado={indicador.estado} />
            </div>
            <p className="rendimiento-item__valor">
              <ValorIndicador
                indicador={indicador}
                colorearSigno={indicador.codigo === 'RESULTADO_REALIZADO'}
                vacio="No disponible"
              />
            </p>
            {indicador.motivo ? (
              <p className="rendimiento-item__motivo">{indicador.motivo}</p>
            ) : null}
          </div>
        ))}
      </div>

      <p className="card-note">{rendimientos.nota}</p>

      {rendimientos.metodologiasPrevistas.length > 0 ? (
        <div className="rendimientos-patrimonio__pendientes">
          <span>Metodologías previstas:</span>
          {rendimientos.metodologiasPrevistas.map((metodologia) => (
            <span className="dato-chip" key={metodologia}>
              {metodologia}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
