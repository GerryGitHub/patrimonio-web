import type { ResultadoPorMoneda } from '../api/types';
import { formatearImporte } from '../lib/decimales';
import { tonoResultado } from '../lib/movimientos';

interface ResultadosMonedaProps {
  resultados: ResultadoPorMoneda[];
  vacio?: string;
  className?: string;
  compacto?: boolean;
}

/**
 * Presenta el resultado realizado agrupado por moneda.
 *
 * <p>Solo incluye ventas y reversiones confirmadas. No es rendimiento no
 * realizado ni valor de mercado, y nunca suma monedas distintas.</p>
 */
export function ResultadosMoneda({
  resultados,
  vacio = 'Sin resultados realizados',
  className,
  compacto = false,
}: ResultadosMonedaProps) {
  if (resultados.length === 0) {
    return (
      <span className="costos-moneda costos-moneda--vacio">{vacio}</span>
    );
  }

  return (
    <span
      className={`costos-moneda ${
        compacto ? 'costos-moneda--compacto' : ''
      } ${className ?? ''}`.trim()}
    >
      {resultados.map((resultado) => (
        <span className="costo-moneda" key={resultado.monedaId}>
          <span className="moneda-chip">{resultado.codigo}</span>
          <strong
            className={`resultado resultado--${tonoResultado(
              resultado.resultado,
            )}`}
          >
            {formatearImporte(resultado.resultado, resultado.decimales)}
          </strong>
        </span>
      ))}
    </span>
  );
}
