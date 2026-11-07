import type { ReactNode } from 'react';

export interface FilterBarProps {
  children: ReactNode;
  acciones?: ReactNode;
  className?: string;
}

/** Barra de filtros compartida por listados y tablas. */
export function FilterBar({ children, acciones, className }: FilterBarProps) {
  return (
    <div className={`filter-bar ${className ?? ''}`.trim()}>
      <div className="filter-bar__fields">{children}</div>
      {acciones ? (
        <div className="filter-bar__actions">{acciones}</div>
      ) : null}
    </div>
  );
}
