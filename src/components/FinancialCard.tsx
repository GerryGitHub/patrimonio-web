import type { ReactNode } from 'react';

export interface FinancialCardProps {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  sinRelleno?: boolean;
  className?: string;
  id?: string;
}

/**
 * Contenedor financiero reutilizable.
 *
 * <p>Agrupa título, acciones y contenido con la misma jerarquía visual en todo
 * el producto. No introduce cálculos propios: solo presenta los datos que
 * recibe.</p>
 */
export function FinancialCard({
  titulo,
  subtitulo,
  acciones,
  children,
  pie,
  sinRelleno = false,
  className,
  id,
}: FinancialCardProps) {
  return (
    <section
      className={`financial-card ${className ?? ''}`.trim()}
      aria-labelledby={id}
    >
      <header className="financial-card__header">
        <div>
          <h2 className="financial-card__title" id={id}>
            {titulo}
          </h2>
          {subtitulo ? (
            <p className="financial-card__subtitle">{subtitulo}</p>
          ) : null}
        </div>
        {acciones ? (
          <div className="financial-card__actions">{acciones}</div>
        ) : null}
      </header>
      <div
        className={`financial-card__body ${
          sinRelleno ? 'financial-card__body--flush' : ''
        }`.trim()}
      >
        {children}
      </div>
      {pie ? <footer className="financial-card__footer">{pie}</footer> : null}
    </section>
  );
}
