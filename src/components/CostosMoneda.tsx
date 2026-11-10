import type { CostoPorMoneda } from '../api/types';
import { formatearImporte } from '../lib/decimales';

interface CostosMonedaProps {
  costos: CostoPorMoneda[];
  vacio?: string;
  className?: string;
  compacto?: boolean;
}

/**
 * Presenta importes agrupados por moneda.
 *
 * <p>Nunca suma monedas distintas: cada importe conserva su código y sus
 * decimales. Se usa para el costo agregado de posiciones, que no es valor de
 * mercado.</p>
 */
export function CostosMoneda({
  costos,
  vacio = 'Sin costo registrado',
  className,
  compacto = false,
}: CostosMonedaProps) {
  if (costos.length === 0) {
    return <span className="costos-moneda costos-moneda--vacio">{vacio}</span>;
  }

  return (
    <span
      className={`costos-moneda ${
        compacto ? 'costos-moneda--compacto' : ''
      } ${className ?? ''}`.trim()}
    >
      {costos.map((costo) => (
        <span className="costo-moneda" key={costo.monedaId}>
          <span className="moneda-chip">{costo.codigo}</span>
          <strong>{formatearImporte(costo.costo, costo.decimales)}</strong>
        </span>
      ))}
    </span>
  );
}
