import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { IconoVacio } from '../components/icons';

export function NotFoundPage() {
  return (
    <div className="pantalla-simple">
      <Logo to="/" />
      <div className="pantalla-simple__caja">
        <span className="pantalla-simple__icono" aria-hidden="true">
          <IconoVacio />
        </span>
        <p className="eyebrow">Error 404</p>
        <h1>No encontramos esta página</h1>
        <p>
          Puede que el enlace haya cambiado o que ya no tengas acceso a este
          contenido.
        </p>
        <Link className="btn btn--primario" to="/">
          Volver al resumen
        </Link>
      </div>
    </div>
  );
}
