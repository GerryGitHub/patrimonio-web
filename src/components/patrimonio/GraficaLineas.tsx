import { useId } from 'react';
import type { MonedaPatrimonio } from '../../api/types';
import { formatearImporte } from '../../lib/decimales';

export interface PuntoLinea {
  fecha: string;
  valor: string;
}

export interface SerieLinea {
  clave: string;
  etiqueta: string;
  color: string;
  puntos: PuntoLinea[];
}

interface GraficaLineasProps {
  series: SerieLinea[];
  moneda: MonedaPatrimonio;
  ariaLabel: string;
  className?: string;
}

const ANCHO = 720;
const ALTO = 280;
const MARGEN = { arriba: 18, derecha: 18, abajo: 38, izquierda: 76 };
const INTERVALOS_Y = 4;

function aNumero(valor: string): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function fechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) {
    return fecha;
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(anio, mes - 1, dia));
}

function fechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) {
    return fecha;
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(anio, mes - 1, dia));
}

function formatearEje(valor: number): string {
  return new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(valor);
}

/**
 * Gráfica de líneas SVG accesible y sin dependencias externas.
 *
 * <p>Recibe series ya agrupadas por moneda. No suma divisas ni interpola
 * valores: cada punto corresponde a una fecha devuelta por el backend. Los
 * puntos y la línea incluyen texto alternativo para lectores de pantalla.</p>
 */
export function GraficaLineas({
  series,
  moneda,
  ariaLabel,
  className,
}: GraficaLineasProps) {
  const idGradiente = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const fechas = [
    ...new Set(series.flatMap((serie) => serie.puntos.map((p) => p.fecha))),
  ].sort();

  if (fechas.length === 0) {
    return null;
  }

  const valores = series.flatMap((serie) =>
    serie.puntos.map((punto) => aNumero(punto.valor)),
  );
  let minimo = Math.min(0, ...valores);
  let maximo = Math.max(0, ...valores);

  if (minimo === maximo) {
    minimo = -1;
    maximo = 1;
  } else {
    const relleno = (maximo - minimo) * 0.08;
    if (minimo < 0) {
      minimo -= relleno;
    }
    if (maximo > 0) {
      maximo += relleno;
    }
  }

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

  function xDe(fecha: string): number {
    const indice = fechas.indexOf(fecha);
    if (fechas.length === 1) {
      return MARGEN.izquierda + anchoUtil / 2;
    }
    return MARGEN.izquierda + (indice / (fechas.length - 1)) * anchoUtil;
  }

  function yDe(valor: number): number {
    return (
      MARGEN.arriba +
      ((maximo - valor) / (maximo - minimo)) * altoUtil
    );
  }

  const yCero = yDe(0);
  const etiquetasX = [
    fechas[0],
    fechas[Math.floor((fechas.length - 1) / 2)],
    fechas[fechas.length - 1],
  ].filter((fecha, indice, lista) => Boolean(fecha) && lista.indexOf(fecha) === indice);

  return (
    <div className={`grafica-lineas ${className ?? ''}`.trim()}>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={ariaLabel}
        className="grafica-lineas__svg"
      >
        <title>{ariaLabel}</title>
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={series[0]?.color ?? 'var(--color-primary)'}
              stopOpacity="0.2"
            />
            <stop
              offset="100%"
              stopColor={series[0]?.color ?? 'var(--color-primary)'}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {Array.from({ length: INTERVALOS_Y + 1 }, (_, indice) => {
          const valor = minimo + ((maximo - minimo) * indice) / INTERVALOS_Y;
          const y = yDe(valor);
          return (
            <g key={`y-${indice}`}>
              <line
                x1={MARGEN.izquierda}
                x2={ANCHO - MARGEN.derecha}
                y1={y}
                y2={y}
                className="grafica-lineas__grid"
              />
              <text
                x={MARGEN.izquierda - 10}
                y={y + 4}
                textAnchor="end"
                className="grafica-lineas__eje"
              >
                {formatearEje(valor)}
              </text>
            </g>
          );
        })}

        {minimo < 0 && maximo > 0 ? (
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO - MARGEN.derecha}
            y1={yCero}
            y2={yCero}
            className="grafica-lineas__cero"
          />
        ) : null}

        {series.map((serie, indiceSerie) => {
          const puntos = serie.puntos.map((punto) => ({
            x: xDe(punto.fecha),
            y: yDe(aNumero(punto.valor)),
            fecha: punto.fecha,
            valor: punto.valor,
          }));
          if (puntos.length === 0) {
            return null;
          }
          const trazo = puntos
            .map(
              (punto, indice) =>
                `${indice === 0 ? 'M' : 'L'}${punto.x.toFixed(2)},${punto.y.toFixed(2)}`,
            )
            .join(' ');
          const base = yDe(Math.min(Math.max(0, minimo), maximo));
          const area = `M${puntos[0]?.x.toFixed(2)},${base.toFixed(2)} ${puntos
            .map((punto) => `L${punto.x.toFixed(2)},${punto.y.toFixed(2)}`)
            .join(' ')} L${puntos[puntos.length - 1]?.x.toFixed(2)},${base.toFixed(2)} Z`;

          return (
            <g key={serie.clave}>
              {indiceSerie === 0 ? (
                <path
                  d={area}
                  fill={`url(#${idGradiente})`}
                  stroke="none"
                />
              ) : null}
              <path
                d={trazo}
                fill="none"
                stroke={serie.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="grafica-lineas__serie"
              />
              {puntos.length <= 32
                ? puntos.map((punto) => (
                    <circle
                      key={`${serie.clave}-${punto.fecha}`}
                      cx={punto.x}
                      cy={punto.y}
                      r="3.2"
                      fill={serie.color}
                      className="grafica-lineas__punto"
                      tabIndex={0}
                    >
                      <title>
                        {`${serie.etiqueta} · ${fechaLarga(punto.fecha)}: ${formatearImporte(
                          punto.valor,
                          moneda.decimales,
                        )} ${moneda.codigo}`}
                      </title>
                    </circle>
                  ))
                : null}
            </g>
          );
        })}

        {etiquetasX.map((fecha) => (
          <text
            key={`x-${fecha}`}
            x={xDe(fecha)}
            y={ALTO - 12}
            textAnchor={
              fecha === fechas[0]
                ? 'start'
                : fecha === fechas[fechas.length - 1]
                  ? 'end'
                  : 'middle'
            }
            className="grafica-lineas__eje"
          >
            {fechaCorta(fecha)}
          </text>
        ))}
      </svg>
    </div>
  );
}
