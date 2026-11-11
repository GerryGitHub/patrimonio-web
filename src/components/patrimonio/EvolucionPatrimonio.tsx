import { useMemo, useState } from 'react';
import type {
  EvolucionPatrimonio as EvolucionPatrimonioDatos,
  MonedaPatrimonio,
} from '../../api/types';
import { formatearImporte } from '../../lib/decimales';
import { formatearFecha } from '../../lib/format';
import {
  ETIQUETAS_GRANULARIDAD,
  monedasConPuntos,
  serieMoneda,
  ultimoValor,
} from '../../lib/patrimonio';
import { EmptyState } from '../EmptyState';
import { IconoGrafico } from '../icons';
import { GraficaLineas, type SerieLinea } from './GraficaLineas';

interface EvolucionPatrimonioProps {
  evolucion: EvolucionPatrimonioDatos;
}

const COLORES: Record<string, string> = {
  COSTO_ADQUISICION: 'var(--color-primary)',
  RESULTADO_REALIZADO: 'var(--color-lavender)',
};

const COLORES_ALTERNATIVOS = [
  'var(--color-sky)',
  'var(--color-positive)',
  'var(--color-warning)',
];

/**
 * Evolución histórica del patrimonio a partir de movimientos registrados.
 *
 * <p>Cada moneda se grafica por separado. La serie de costo vigente y la de
 * resultado realizado se construyen con movimientos confirmados; las series
 * que requieren valuación de mercado se muestran como no disponibles con su
 * motivo, sin inventar puntos.</p>
 */
export function EvolucionPatrimonio({
  evolucion,
}: EvolucionPatrimonioProps) {
  const monedas = useMemo(() => {
    const mapa = new Map<string, MonedaPatrimonio>();
    for (const serie of evolucion.series) {
      for (const moneda of monedasConPuntos(serie)) {
        mapa.set(moneda.codigo, moneda);
      }
    }
    return [...mapa.values()].sort((a, b) =>
      a.codigo.localeCompare(b.codigo),
    );
  }, [evolucion.series]);

  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(
    null,
  );
  const monedaActiva =
    monedas.find((moneda) => moneda.codigo === codigoSeleccionado) ??
    monedas[0];

  const seriesConDatos = evolucion.series
    .map((serie, indice) => {
      const datos = monedaActiva
        ? serieMoneda(serie, monedaActiva.codigo)
        : undefined;
      return {
        serie,
        datos,
        color:
          COLORES[serie.codigo] ??
          COLORES_ALTERNATIVOS[indice % COLORES_ALTERNATIVOS.length] ??
          'var(--color-primary)',
      };
    })
    .filter(
      (item) =>
        item.serie.estado !== 'NO_DISPONIBLE' &&
        Boolean(item.datos && item.datos.puntos.length > 0),
    );

  const lineas: SerieLinea[] = seriesConDatos.map((item) => ({
    clave: item.serie.codigo,
    etiqueta: item.serie.etiqueta,
    color: item.color,
    puntos: item.datos?.puntos ?? [],
  }));

  const seriesNoDisponibles = evolucion.series.filter(
    (serie) =>
      serie.estado === 'NO_DISPONIBLE' ||
      !serie.porMoneda.some((moneda) => moneda.puntos.length > 0),
  );

  const desglose = monedaActiva
    ? evolucion.desglosePorClase
        .map((clase) => {
          const datos = clase.porMoneda.find(
            (moneda) => moneda.moneda.codigo === monedaActiva.codigo,
          );
          return {
            nombre: clase.claseActivoNombre,
            valor: ultimoValor(datos),
          };
        })
        .filter((clase) => clase.valor !== null)
    : [];

  if (monedas.length === 0 || lineas.length === 0) {
    return (
      <EmptyState
        compacta
        icono={<IconoGrafico />}
        titulo="Sin historial para graficar"
        descripcion={
          evolucion.limitaciones[0] ??
          'La gráfica aparecerá cuando existan movimientos confirmados en el período.'
        }
      />
    );
  }

  const etiquetasSeries = lineas.map((linea) => linea.etiqueta).join(' y ');

  return (
    <div className="evolucion-patrimonio">
      <div className="evolucion-patrimonio__meta">
        <span>
          {formatearFecha(evolucion.desde)} —{' '}
          {formatearFecha(evolucion.hasta)}
        </span>
        <span className="chart-container__period">
          {ETIQUETAS_GRANULARIDAD[evolucion.granularidad]}
        </span>
      </div>

      {monedas.length > 1 ? (
        <div
          className="moneda-selector"
          role="group"
          aria-label="Moneda de la gráfica"
        >
          {monedas.map((moneda) => (
            <button
              key={moneda.codigo}
              type="button"
              className={`moneda-selector__opcion ${
                moneda.codigo === monedaActiva?.codigo
                  ? 'moneda-selector__opcion--activa'
                  : ''
              }`.trim()}
              aria-pressed={moneda.codigo === monedaActiva?.codigo}
              onClick={() => setCodigoSeleccionado(moneda.codigo)}
            >
              {moneda.codigo}
            </button>
          ))}
        </div>
      ) : null}

      {monedaActiva ? (
        <GraficaLineas
          series={lineas}
          moneda={monedaActiva}
          ariaLabel={`Evolución de ${etiquetasSeries} en ${
            monedaActiva.codigo
          } entre ${formatearFecha(evolucion.desde)} y ${formatearFecha(
            evolucion.hasta,
          )}`}
        />
      ) : null}

      <div className="evolucion-leyenda" aria-label="Series de la gráfica">
        {lineas.map((linea) => (
          <span className="evolucion-leyenda__item" key={linea.clave}>
            <span
              className="evolucion-leyenda__color"
              style={{ background: linea.color }}
              aria-hidden="true"
            />
            {linea.etiqueta}
          </span>
        ))}
      </div>

      {desglose.length > 0 && monedaActiva ? (
        <div className="evolucion-desglose">
          <p className="evolucion-desglose__titulo">
            Costo vigente por clase de activo
          </p>
          <ul className="evolucion-desglose__lista">
            {desglose.map((clase) => (
              <li key={clase.nombre}>
                <span>{clase.nombre}</span>
                <strong>
                  {formatearImporte(
                    clase.valor,
                    monedaActiva.decimales,
                  )}{' '}
                  {monedaActiva.codigo}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {seriesNoDisponibles.length > 0 ? (
        <details className="evolucion-no-disponible">
          <summary>
            Series no disponibles ({seriesNoDisponibles.length})
          </summary>
          <ul>
            {seriesNoDisponibles.map((serie) => (
              <li key={serie.codigo}>
                <strong>{serie.etiqueta}:</strong>{' '}
                {serie.motivo ?? 'Requiere una fuente de datos que aún no existe.'}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
