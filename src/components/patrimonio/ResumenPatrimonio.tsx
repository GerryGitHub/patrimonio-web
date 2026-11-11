import type {
  CentroPatrimonio,
  IndicadorPatrimonio,
} from '../../api/types';
import { contarCuentas } from '../../lib/patrimonio';
import { FinancialCard } from '../FinancialCard';
import { MetricCard } from '../MetricCard';
import { IconoActivos, IconoLiquidez, IconoMoneda } from '../icons';
import { EstadoIndicador, ValorIndicador } from './EstadoIndicador';

interface ResumenPatrimonioProps {
  centro: CentroPatrimonio;
}

function FilaIndicador({
  indicador,
  colorearSigno = false,
}: {
  indicador: IndicadorPatrimonio;
  colorearSigno?: boolean;
}) {
  return (
    <div className="indicador-fila">
      <div className="indicador-fila__cabecera">
        <span className="indicador-fila__etiqueta">{indicador.etiqueta}</span>
        <EstadoIndicador estado={indicador.estado} />
      </div>
      <p className="indicador-fila__valor">
        <ValorIndicador
          indicador={indicador}
          colorearSigno={colorearSigno}
          vacio="No disponible"
        />
      </p>
      {indicador.motivo ? (
        <p className="indicador-fila__motivo">{indicador.motivo}</p>
      ) : null}
    </div>
  );
}

/**
 * Resumen patrimonial y balance.
 *
 * <p>Separa explícitamente los activos registrados a costo del capital
 * aportado histórico, la liquidez y el patrimonio neto. Los indicadores sin
 * fuente se muestran como no disponibles, nunca como cero.</p>
 */
export function ResumenPatrimonio({ centro }: ResumenPatrimonioProps) {
  const { resumen, liquidez } = centro;
  const cuentas = contarCuentas(centro);

  return (
    <>
      <section className="dashboard-hero" aria-label="Patrimonio y balance">
        <MetricCard
          etiqueta={resumen.activosRegistrados.etiqueta}
          valor={
            <ValorIndicador
              indicador={resumen.activosRegistrados}
              vacio="Sin activos a costo"
            />
          }
          icono={<IconoActivos />}
          ayuda={
            resumen.activosRegistrados.motivo ??
            'Costo de adquisición de las posiciones activas.'
          }
          pie={
            <EstadoIndicador estado={resumen.activosRegistrados.estado} />
          }
        />

        <FinancialCard
          titulo="Balance patrimonial"
          subtitulo="Cada indicador conserva su cobertura. No se rellenan ausencias con costo ni con ceros."
        >
          <div className="indicador-lista">
            <FilaIndicador indicador={resumen.patrimonioNeto} />
            <FilaIndicador indicador={resumen.pasivos} />
            <FilaIndicador indicador={resumen.capitalAportado} />
            <FilaIndicador indicador={resumen.liquidezDisponible} />
            <FilaIndicador
              indicador={resumen.resultadoRealizado}
              colorearSigno
            />
          </div>
        </FinancialCard>
      </section>

      <section aria-label="Indicadores patrimoniales">
        <div className="metric-grid">
          <MetricCard
            etiqueta="Capital invertido a costo"
            valor={
              <ValorIndicador
                indicador={resumen.capitalInvertido}
                vacio="Sin inversiones"
              />
            }
            ayuda="Costo vigente de las posiciones activas. No es capital aportado histórico ni efectivo."
            tono="lavanda"
          />
          <MetricCard
            etiqueta="Resultado realizado acumulado"
            valor={
              <ValorIndicador
                indicador={resumen.resultadoRealizado}
                colorearSigno
                vacio="Sin resultados"
              />
            }
            ayuda="Solo movimientos confirmados; incluye posiciones cerradas y descuenta reversiones."
          />
          <MetricCard
            etiqueta="Capital comprometido"
            valor={
              <ValorIndicador
                indicador={liquidez.capitalComprometido}
                vacio="Sin capital comprometido"
              />
            }
            icono={<IconoLiquidez />}
            ayuda="Costo de adquisición de inversiones activas. No es efectivo disponible."
          />
          <MetricCard
            etiqueta="Cuentas registradas"
            valor={cuentas.total}
            icono={<IconoMoneda />}
            ayuda={`${cuentas.activas} ${
              cuentas.activas === 1 ? 'cuenta activa' : 'cuentas activas'
            } de ${cuentas.total}. Los saldos de efectivo no están disponibles.`}
          />
        </div>
      </section>
    </>
  );
}
