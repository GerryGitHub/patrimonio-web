import type { ImporteMonedaPatrimonio } from '../../api/types';
import { formatearImporte } from '../../lib/decimales';
import { tonoResultado } from '../../lib/movimientos';

interface ImportesMonedaProps {
  importes: ImporteMonedaPatrimonio[];
  vacio?: string;
  className?: string;
  compacto?: boolean;
  colorearSigno?: boolean;
}

/**
 * Presenta importes agrupados por moneda.
 *
 * <p>Cada importe conserva su código y sus decimales. La interfaz nunca suma
 * monedas distintas ni aplica tipos de cambio. El color por signo es opcional
 * y solo se usa en resultados realizados.</p>
 */
export function ImportesMoneda({
  importes,
  vacio = 'Sin importes disponibles',
  className,
  compacto = false,
  colorearSigno = false,
}: ImportesMonedaProps) {
  if (importes.length === 0) {
    return (
      <span className="importes-moneda importes-moneda--vacio">{vacio}</span>
    );
  }

  return (
    <span
      className={`importes-moneda ${
        compacto ? 'importes-moneda--compacto' : ''
      } ${className ?? ''}`.trim()}
    >
      {importes.map((importe) => (
        <span className="importe-moneda" key={importe.monedaId}>
          <span className="moneda-chip">{importe.codigo}</span>
          <strong
            className={
              colorearSigno
                ? `resultado resultado--${tonoResultado(importe.importe)}`
                : undefined
            }
          >
            {formatearImporte(importe.importe, importe.decimales)}
          </strong>
        </span>
      ))}
    </span>
  );
}
