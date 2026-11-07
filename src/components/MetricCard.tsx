import type { ReactNode } from 'react';
import { IconoTendencia } from './icons';

export type TonoMetrica = 'neutral' | 'positivo' | 'negativo' | 'lavanda';

export interface MetricCardProps {
  etiqueta: string;
  valor: ReactNode;
  ayuda?: string;
  icono?: ReactNode;
  tono?: TonoMetrica;
  tendencia?: {
    texto: string;
    tono: 'positivo' | 'negativo' | 'neutral';
  };
  pie?: ReactNode;
}

/**
 * Tarjeta de métrica principal.
 *
 * <p>El valor es siempre un dato real. Cuando todavía no existe una valuación,
 * se pasa el marcador «—» y un texto de ayuda que explica la ausencia de
 * datos.</p>
 */
export function MetricCard({
  etiqueta,
  valor,
  ayuda,
  icono,
  tono = 'neutral',
  tendencia,
  pie,
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tono}`}>
      <div className="metric-card__top">
        <span className="metric-card__label">{etiqueta}</span>
        {icono ? (
          <span className="metric-card__icon" aria-hidden="true">
            {icono}
          </span>
        ) : null}
      </div>
      <p className="metric-card__value">{valor}</p>
      {tendencia ? (
        <p className={`metric-card__trend metric-card__trend--${tendencia.tono}`}>
          <IconoTendencia />
          {tendencia.texto}
        </p>
      ) : null}
      {ayuda ? <p className="metric-card__helper">{ayuda}</p> : null}
      {pie}
    </article>
  );
}
