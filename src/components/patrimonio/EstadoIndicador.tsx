import type { EstadoInformacion, IndicadorPatrimonio } from '../../api/types';
import {
  ETIQUETAS_ESTADO,
  tonoEstado,
} from '../../lib/patrimonio';
import { StatusBadge } from '../StatusBadge';
import { ImportesMoneda } from './ImportesMoneda';

interface EstadoIndicadorProps {
  estado: EstadoInformacion;
  className?: string;
}

/** Insignia que distingue dato disponible, cobertura parcial y ausencia. */
export function EstadoIndicador({
  estado,
  className,
}: EstadoIndicadorProps) {
  return (
    <StatusBadge estado={tonoEstado(estado)} className={className}>
      {ETIQUETAS_ESTADO[estado]}
    </StatusBadge>
  );
}

interface ValorIndicadorProps {
  indicador: IndicadorPatrimonio;
  compacto?: boolean;
  colorearSigno?: boolean;
  vacio?: string;
}

/** Valor monetario de un indicador, sin convertir ceros en datos falsos. */
export function ValorIndicador({
  indicador,
  compacto = false,
  colorearSigno = false,
  vacio = 'No disponible',
}: ValorIndicadorProps) {
  if (indicador.importes.length === 0) {
    return (
      <span className="indicador-sin-valor" title={indicador.motivo ?? undefined}>
        {vacio}
      </span>
    );
  }
  return (
    <ImportesMoneda
      importes={indicador.importes}
      compacto={compacto}
      colorearSigno={colorearSigno}
    />
  );
}
