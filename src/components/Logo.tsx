import { Link } from 'react-router-dom';
import { NOMBRE_APP } from '../config';

interface LogoProps {
  to?: string;
  compacto?: boolean;
}

export function Logo({ to = '/', compacto = false }: LogoProps) {
  return (
    <Link className="marca" to={to} aria-label={`${NOMBRE_APP}, ir al inicio`}>
      <span className="marca__simbolo" aria-hidden="true">
        P
      </span>
      {!compacto ? (
        <span className="marca__texto">
          <strong>{NOMBRE_APP}</strong>
          <small>Gestión patrimonial</small>
        </span>
      ) : null}
    </Link>
  );
}
