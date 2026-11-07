import type { ReactNode } from 'react';

export type EstadoBadge =
  | 'activo'
  | 'inactivo'
  | 'pendiente'
  | 'positivo'
  | 'negativo'
  | 'neutral'
  | 'info'
  | 'lavanda';

export interface StatusBadgeProps {
  estado?: EstadoBadge;
  children: ReactNode;
  className?: string;
}

/**
 * Insignia de estado.
 *
 * <p>El verde se reserva para estados o variaciones positivas y el rojo para
 * negativas o errores. El lavanda identifica información secundaria.</p>
 */
export function StatusBadge({
  estado = 'neutral',
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${estado} ${className ?? ''}`.trim()}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
