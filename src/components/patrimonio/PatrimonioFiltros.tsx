import type {
  DimensionDistribucion,
  FiltrosPatrimonio,
  PeriodoPatrimonial,
} from '../../api/types';
import {
  ETIQUETAS_DIMENSION,
  ETIQUETAS_PERIODO,
  type OpcionMoneda,
} from '../../lib/patrimonio';
import { FilterBar } from '../FilterBar';
import { FormField } from '../FormField';

interface PatrimonioFiltrosProps {
  monedas: OpcionMoneda[];
  filtros: FiltrosPatrimonio;
  onCambiar: (filtros: FiltrosPatrimonio) => void;
  disabled?: boolean;
}

const PERIODOS: PeriodoPatrimonial[] = ['1M', '3M', '6M', '1A', 'TODO'];
const DIMENSIONES: DimensionDistribucion[] = [
  'CLASE_ACTIVO',
  'TIPO_INSTRUMENTO',
  'INSTITUCION',
  'CUENTA',
  'MONEDA',
];

/**
 * Filtros del Centro de Patrimonio.
 *
 * <p>La moneda limita las consultas sin convertir importes. El período solo
 * afecta a las series históricas y a los rendimientos; los saldos actuales no
 * cambian. La dimensión agrupa la distribución.</p>
 */
export function PatrimonioFiltros({
  monedas,
  filtros,
  onCambiar,
  disabled = false,
}: PatrimonioFiltrosProps) {
  return (
    <FilterBar
      className="patrimonio-filtros"
      acciones={
        <button
          type="button"
          className="btn btn--secundario btn--sm"
          onClick={() =>
            onCambiar({
              periodo: 'TODO',
              dimension: 'CLASE_ACTIVO',
            })
          }
          disabled={disabled}
        >
          Restablecer
        </button>
      }
    >
      <FormField etiqueta="Moneda" htmlFor="patrimonio-moneda">
        <select
          id="patrimonio-moneda"
          className="form-field__control form-field__control--select"
          value={filtros.moneda ?? ''}
          onChange={(evento) =>
            onCambiar({
              ...filtros,
              moneda: evento.target.value || undefined,
            })
          }
          disabled={disabled}
        >
          <option value="">Todas las monedas</option>
          {monedas.map((moneda) => (
            <option key={moneda.codigo} value={moneda.codigo}>
              {moneda.codigo} · {moneda.nombre}
            </option>
          ))}
        </select>
      </FormField>

      <FormField etiqueta="Período" htmlFor="patrimonio-periodo">
        <select
          id="patrimonio-periodo"
          className="form-field__control form-field__control--select"
          value={filtros.periodo ?? 'TODO'}
          onChange={(evento) =>
            onCambiar({
              ...filtros,
              periodo: evento.target.value as PeriodoPatrimonial,
            })
          }
          disabled={disabled}
        >
          {PERIODOS.map((periodo) => (
            <option key={periodo} value={periodo}>
              {ETIQUETAS_PERIODO[periodo]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField etiqueta="Distribución" htmlFor="patrimonio-dimension">
        <select
          id="patrimonio-dimension"
          className="form-field__control form-field__control--select"
          value={filtros.dimension ?? 'CLASE_ACTIVO'}
          onChange={(evento) =>
            onCambiar({
              ...filtros,
              dimension: evento.target.value as DimensionDistribucion,
            })
          }
          disabled={disabled}
        >
          {DIMENSIONES.map((dimension) => (
            <option key={dimension} value={dimension}>
              {ETIQUETAS_DIMENSION[dimension]}
            </option>
          ))}
        </select>
      </FormField>
    </FilterBar>
  );
}
