import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { iniciales } from '../lib/format';
import { Logo } from './Logo';
import { IconoSalir } from './icons';

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await cerrarSesion();
      navigate('/login', { replace: true });
    } finally {
      setSaliendo(false);
    }
  }

  return (
    <div className="app">
      <header className="cabecera">
        <div className="contenedor cabecera__interior">
          <Logo />

          <nav className="cabecera__nav" aria-label="Navegación principal">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `cabecera__enlace ${isActive ? 'cabecera__enlace--activo' : ''}`
              }
            >
              Resumen
            </NavLink>
            <NavLink
              to="/instituciones"
              className={({ isActive }) =>
                `cabecera__enlace ${isActive ? 'cabecera__enlace--activo' : ''}`
              }
            >
              Instituciones
            </NavLink>
          </nav>

          <div className="cabecera__usuario">
            <div className="usuario-chip" title={usuario?.email}>
              <span className="avatar" aria-hidden="true">
                {usuario ? iniciales(usuario.nombre) : '?'}
              </span>
              <span className="usuario-chip__datos">
                <strong>{usuario?.nombre}</strong>
                <small>{usuario?.email}</small>
              </span>
            </div>
            <button
              type="button"
              className="boton boton--fantasma boton--icono"
              onClick={salir}
              disabled={saliendo}
              aria-label="Cerrar sesión"
            >
              <IconoSalir />
              <span className="solo-escritorio">
                {saliendo ? 'Saliendo…' : 'Salir'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="contenedor app-main">{children}</main>

      <footer className="pie">
        <div className="contenedor pie__interior">
          <span>Patrimonio · Gestión patrimonial</span>
          <span>Sesión privada · MVP</span>
        </div>
      </footer>
    </div>
  );
}
