import type { ReactNode } from 'react';
import { IconoAlerta } from './icons';

export interface ErrorStateProps {
  mensaje: string;
  titulo?: string;
  onReintentar?: () => void;
  textoReintentar?: string;
  accion?: ReactNode;
}

/** Error recuperable con acción de reintento explícita. */
export function ErrorState({
  mensaje,
  titulo = 'No se pudo cargar la información',
  onReintentar,
  textoReintentar = 'Reintentar',
  accion,
}: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        <IconoAlerta />
      </span>
      <div className="error-state__body">
        <p className="error-state__title">{titulo}</p>
        <p>{mensaje}</p>
        {onReintentar || accion ? (
          <div className="error-state__actions">
            {onReintentar ? (
              <button
                type="button"
                className="btn btn--secundario btn--sm"
                onClick={onReintentar}
              >
                {textoReintentar}
              </button>
            ) : null}
            {accion}
          </div>
        ) : null}
      </div>
    </div>
  );
}
