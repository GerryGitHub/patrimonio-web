import { Link } from 'react-router-dom';
import { NOMBRE_APP } from '../config';

interface LogoProps {
  to?: string;
  compacto?: boolean;
}

/**
 * Marca institucional de Patrimonio 360.
 *
 * <p>El símbolo es un monograma «P» sobre azul noche con un punto azul cielo,
 * coherente con la identidad Financial Atlas Blue. No usa degradados ni
 * imágenes externas.</p>
 */
export function Logo({ to = '/', compacto = false }: LogoProps) {
  return (
    <Link className="brand" to={to} aria-label={`${NOMBRE_APP}, ir al inicio`}>
      <span className="brand__mark" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 18V6h4.5a3.5 3.5 0 0 1 0 7H8" />
        </svg>
      </span>
      {!compacto ? (
        <span className="brand__text">
          <span className="brand__name">
            Patrimonio <em>360</em>
          </span>
          <span className="brand__tag">Financial Atlas Blue</span>
        </span>
      ) : null}
    </Link>
  );
}
