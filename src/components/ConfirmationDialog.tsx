import { useEffect, useId, type ReactNode } from 'react';
import { IconoCerrar } from './icons';

export interface ConfirmationDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  tono?: 'primario' | 'peligro';
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmación accesible.
 *
 * <p>Cierra con Escape o con el botón de cancelar. Mientras la operación está
 * en curso, las acciones quedan deshabilitadas para evitar envíos dobles.</p>
 */
export function ConfirmationDialog({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tono = 'primario',
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmationDialogProps) {
  const tituloId = useId();
  const descripcionId = useId();

  useEffect(() => {
    if (!abierto) {
      return;
    }

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !cargando) {
        onCancelar();
      }
    }

    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto, cargando, onCancelar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !cargando) {
          onCancelar();
        }
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcionId}
      >
        <div className="dialog__header">
          <h2 className="dialog__title" id={tituloId}>
            {titulo}
          </h2>
          <button
            type="button"
            className="icon-button"
            onClick={onCancelar}
            disabled={cargando}
            aria-label="Cerrar diálogo"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className="dialog__body">
          <p className="dialog__description" id={descripcionId}>
            {descripcion}
          </p>
        </div>
        <div className="dialog__actions">
          <button
            type="button"
            className="btn btn--secundario"
            onClick={onCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn btn--${tono === 'peligro' ? 'peligro' : 'primario'}`}
            onClick={onConfirmar}
            disabled={cargando}
            aria-busy={cargando || undefined}
          >
            {cargando ? <span className="btn__spinner" aria-hidden="true" /> : null}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
