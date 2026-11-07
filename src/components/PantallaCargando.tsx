import { Logo } from './Logo';

export function PantallaCargando({
  mensaje = 'Cargando…',
}: {
  mensaje?: string;
}) {
  return (
    <div className="pantalla-cargando" role="status" aria-live="polite">
      <Logo compacto />
      <span className="cargador" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}
