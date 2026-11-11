import type {
  DistribucionMonedaPatrimonio,
  DistribucionPatrimonio,
} from '../../api/types';
import { formatearImporte } from '../../lib/decimales';
import { formatearPorcentaje } from '../../lib/patrimonio';
import { EmptyState } from '../EmptyState';
import { IconoGrafico } from '../icons';

interface DistribucionPatrimonioProps {
  distribucion: DistribucionPatrimonio;
}

const PALETA = [
  'var(--color-primary)',
  'var(--color-lavender)',
  'var(--color-sky)',
  'var(--color-positive)',
  'var(--color-warning)',
  'var(--color-navy-700)',
  'var(--color-negative)',
  'var(--color-text-soft)',
];

const RADIO = 54;
const GROSOR = 17;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function numero(valor: string): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function porcentajeDe(
  importe: string,
  porcentaje: string | null,
  total: string,
): number {
  if (porcentaje) {
    return numero(porcentaje);
  }
  const totalNumero = numero(total);
  return totalNumero === 0 ? 0 : (numero(importe) / totalNumero) * 100;
}

function DonutMoneda({
  distribucion,
}: {
  distribucion: DistribucionMonedaPatrimonio;
}) {
  const segmentos = distribucion.segmentos.map((segmento, indice) => ({
    ...segmento,
    color: PALETA[indice % PALETA.length] ?? PALETA[0],
    porcentajeCalculado: porcentajeDe(
      segmento.importe,
      segmento.porcentaje,
      distribucion.total,
    ),
  }));

  let acumulado = 0;
  const descripcion = segmentos
    .map(
      (segmento) =>
        `${segmento.nombre}: ${formatearPorcentaje(
          String(segmento.porcentajeCalculado),
        )}`,
    )
    .join(', ');

  return (
    <div className="distribucion-moneda">
      <div className="distribucion-moneda__cabecera">
        <span className="moneda-chip">{distribucion.moneda.codigo}</span>
        <span className="distribucion-moneda__total">
          {formatearImporte(
            distribucion.total,
            distribucion.moneda.decimales,
          )}
        </span>
      </div>

      <div className="distribucion-moneda__cuerpo">
        <div className="distribucion-donut">
          <svg
            viewBox="0 0 140 140"
            role="img"
            aria-label={`Distribución en ${distribucion.moneda.codigo}: ${descripcion}`}
            className="distribucion-donut__svg"
          >
            <title>
              {`Distribución en ${distribucion.moneda.codigo}`}
            </title>
            <circle
              cx="70"
              cy="70"
              r={RADIO}
              fill="none"
              stroke="var(--color-surface-sunken)"
              strokeWidth={GROSOR}
            />
            {segmentos.map((segmento) => {
              const longitud =
                (Math.max(0, segmento.porcentajeCalculado) / 100) *
                CIRCUNFERENCIA;
              const desplazamiento = -acumulado;
              acumulado += longitud;
              return (
                <circle
                  key={segmento.clave}
                  cx="70"
                  cy="70"
                  r={RADIO}
                  fill="none"
                  stroke={segmento.color}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${longitud} ${
                    CIRCUNFERENCIA - longitud
                  }`}
                  strokeDashoffset={desplazamiento}
                  transform="rotate(-90 70 70)"
                  className="distribucion-donut__segmento"
                >
                  <title>
                    {`${segmento.nombre}: ${formatearPorcentaje(
                      String(segmento.porcentajeCalculado),
                    )} · ${formatearImporte(
                      segmento.importe,
                      distribucion.moneda.decimales,
                    )} ${distribucion.moneda.codigo}`}
                  </title>
                </circle>
              );
            })}
          </svg>
          <div className="distribucion-donut__centro" aria-hidden="true">
            <strong>{distribucion.segmentos.length}</strong>
            <small>
              {distribucion.segmentos.length === 1
                ? 'segmento'
                : 'segmentos'}
            </small>
          </div>
        </div>

        <ul className="distribucion-leyenda">
          {segmentos.map((segmento) => (
            <li className="distribucion-leyenda__item" key={segmento.clave}>
              <span
                className="distribucion-leyenda__color"
                style={{ background: segmento.color }}
                aria-hidden="true"
              />
              <span className="distribucion-leyenda__texto">
                <strong>{segmento.nombre}</strong>
                <small>
                  {formatearPorcentaje(
                    String(segmento.porcentajeCalculado),
                  )}{' '}
                  ·{' '}
                  {formatearImporte(
                    segmento.importe,
                    distribucion.moneda.decimales,
                  )}{' '}
                  {distribucion.moneda.codigo}
                </small>
              </span>
              <span className="distribucion-leyenda__conteo">
                {segmento.posiciones}{' '}
                {segmento.posiciones === 1 ? 'posición' : 'posiciones'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Distribución patrimonial por dimensión.
 *
 * <p>Renderiza un donut independiente por moneda. Los porcentajes se calculan
 * dentro de cada divisa; nunca se mezclan monedas para obtener un total
 * agregado.</p>
 */
export function DistribucionPatrimonio({
  distribucion,
}: DistribucionPatrimonioProps) {
  if (distribucion.porMoneda.length === 0) {
    return (
      <EmptyState
        compacta
        icono={<IconoGrafico />}
        titulo="Sin distribución disponible"
        descripcion={
          distribucion.limitaciones[0] ??
          'Registra posiciones activas para ver la distribución patrimonial.'
        }
      />
    );
  }

  return (
    <div className="distribucion-patrimonio">
      {distribucion.porMoneda.map((moneda) => (
        <DonutMoneda key={moneda.moneda.id} distribucion={moneda} />
      ))}
    </div>
  );
}
