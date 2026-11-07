import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { IconoGrafico } from './icons';

export interface ChartContainerProps {
  titulo: string;
  subtitulo?: string;
  periodo?: string;
  children?: ReactNode;
  vacio?: boolean;
  tituloVacio?: string;
  descripcionVacia?: string;
  leyenda?: ReactNode;
  pie?: ReactNode;
  compacto?: boolean;
  className?: string;
}

/**
 * Contenedor común para visualizaciones.
 *
 * <p>Define título, periodo, leyenda y estado sin datos. Las series
 * patrimoniales usan azul, las categorías secundarias lavanda y las
 * variaciones verde o rojo. Las gráficas solo se renderizan cuando reciben
 * datos reales.</p>
 */
export function ChartContainer({
  titulo,
  subtitulo,
  periodo,
  children,
  vacio = false,
  tituloVacio = 'Todavía no hay datos para graficar',
  descripcionVacia = 'La visualización aparecerá cuando existan valuaciones o movimientos reales en el portafolio.',
  leyenda,
  pie,
  compacto = false,
  className,
}: ChartContainerProps) {
  return (
    <section
      className={`chart-container ${className ?? ''}`.trim()}
      aria-label={titulo}
    >
      <header className="chart-container__header">
        <div>
          <h2 className="chart-container__title">{titulo}</h2>
          {subtitulo ? (
            <p className="chart-container__subtitle">{subtitulo}</p>
          ) : null}
        </div>
        {periodo ? (
          <span className="chart-container__period">{periodo}</span>
        ) : null}
      </header>

      {leyenda ? <div className="chart-legend">{leyenda}</div> : null}

      <div
        className={`chart-container__body ${
          compacto ? 'chart-container__body--compacta' : ''
        }`.trim()}
      >
        {vacio ? (
          <EmptyState
            compacta
            icono={<IconoGrafico />}
            titulo={tituloVacio}
            descripcion={descripcionVacia}
          />
        ) : (
          children
        )}
      </div>

      {pie ? (
        <footer className="chart-container__footer">{pie}</footer>
      ) : null}
    </section>
  );
}
