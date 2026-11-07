import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import {
  IconoCheck,
  IconoEscudo,
  IconoGrafico,
} from './icons';

interface AuthLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

export function AuthLayout({
  titulo,
  subtitulo,
  children,
}: AuthLayoutProps) {
  return (
    <div className="auth">
      <aside className="auth__marca" aria-label="Patrimonio 360">
        <div className="auth__marca-contenido">
          <Logo to="/login" />

          <div className="auth__mensaje">
            <p className="eyebrow">Patrimonio personal</p>
            <h1>Una vista clara de todo lo que construyes.</h1>
            <p>
              Portafolios, activos y cuentas en un solo lugar. Información real,
              sin ruido y con los cálculos en el servidor.
            </p>
          </div>

          <ul className="auth__lista">
            <li>
              <IconoEscudo />
              <span>Sesión protegida con cookies HttpOnly y CSRF.</span>
            </li>
            <li>
              <IconoGrafico />
              <span>Tus portafolios y cuentas, solo para ti.</span>
            </li>
            <li>
              <IconoCheck />
              <span>Una experiencia cuidada en escritorio y móvil.</span>
            </li>
          </ul>

          <p className="auth__nota">Financial Atlas Blue · Acceso privado</p>
        </div>
      </aside>

      <main className="auth__panel">
        <div className="auth__caja">
          <div className="auth__logo-movil">
            <Logo to="/login" />
          </div>
          <header className="auth__encabezado">
            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
          </header>
          {children}
        </div>
        <p className="auth__legal">
          <Link to="/login">Patrimonio 360</Link> · Gestión patrimonial
        </p>
      </main>
    </div>
  );
}
