import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icono?: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  compacta?: boolean;
  className?: string;
}

/**
 * Estado vacío explicativo.
 *
 * <p>Se usa cuando todavía no existen datos reales. Nunca rellena la interfaz
 * con importes, porcentajes ni movimientos simulados.</p>
 */
export function EmptyState({
  icono,
  titulo,
  descripcion,
  accion,
  compacta = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${compacta ? 'empty-state--compacta' : ''} ${
        className ?? ''
      }`.trim()}
    >
      {icono ? (
        <span className="empty-state__icon" aria-hidden="true">
          {icono}
        </span>
      ) : null}
      <p className="empty-state__title">{titulo}</p>
      <p className="empty-state__description">{descripcion}</p>
      {accion ? <div className="empty-state__action">{accion}</div> : null}
    </div>
  );
}
