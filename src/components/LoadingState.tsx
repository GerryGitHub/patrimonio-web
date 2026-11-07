export interface LoadingStateProps {
  mensaje?: string;
  compacto?: boolean;
}

/** Indicador de carga compartido por páginas y secciones. */
export function LoadingState({
  mensaje = 'Cargando información…',
  compacto = false,
}: LoadingStateProps) {
  return (
    <div
      className="loading-state"
      role="status"
      aria-live="polite"
      style={compacto ? { padding: '1.5rem 1rem' } : undefined}
    >
      <span className="loading-state__spinner" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}
