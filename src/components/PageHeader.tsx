import type { ReactNode } from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  meta?: ReactNode;
}

/** Encabezado de página con jerarquía consistente. */
export function PageHeader({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  meta,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{titulo}</h1>
        {descripcion ? <p className="page-subtitle">{descripcion}</p> : null}
      </div>
      {acciones || meta ? (
        <div className="page-header__actions">
          {meta ? <div className="page-header__meta">{meta}</div> : null}
          {acciones}
        </div>
      ) : null}
    </header>
  );
}
