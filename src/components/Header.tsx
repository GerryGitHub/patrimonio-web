import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { iniciales } from '../lib/format';
import { IconoMenu, IconoSalir } from './icons';
import { PortfolioSelector } from './PortfolioSelector';

interface HeaderProps {
  onAbrirMenu: () => void;
}

const TITULOS: Array<{ prefijo: string; titulo: string }> = [
  { prefijo: '/activos/liquidez', titulo: 'Liquidez y cuentas' },
  { prefijo: '/activos/renta-fija', titulo: 'Renta fija' },
  { prefijo: '/activos/acciones-etfs', titulo: 'Acciones y ETFs' },
  { prefijo: '/activos/criptomonedas', titulo: 'Criptomonedas' },
  { prefijo: '/activos/inmuebles', titulo: 'Inmuebles' },
  { prefijo: '/activos/vehiculos', titulo: 'Vehículos' },
  { prefijo: '/activos/otros', titulo: 'Otros activos' },
  { prefijo: '/activos', titulo: 'Mis activos' },
  { prefijo: '/mercados', titulo: 'Mercados' },
  { prefijo: '/actividad', titulo: 'Actividad' },
  { prefijo: '/financiamiento', titulo: 'Financiamiento' },
  { prefijo: '/configuracion', titulo: 'Configuración' },
  { prefijo: '/', titulo: 'Resumen' },
];

function tituloDeSeccion(pathname: string): string {
  return (
    TITULOS.find(({ prefijo }) => pathname.startsWith(prefijo))?.titulo ??
    'Patrimonio 360'
  );
}

/** Barra superior con contexto, selector de portafolio y sesión. */
export function Header({ onAbrirMenu }: HeaderProps) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-button topbar__menu"
          onClick={onAbrirMenu}
          aria-label="Abrir navegación"
          aria-controls="navegacion-principal"
        >
          <IconoMenu />
        </button>

        <div className="topbar__context">
          <span className="topbar__context-label">Espacio de trabajo</span>
          <strong className="topbar__context-title">
            {tituloDeSeccion(location.pathname)}
          </strong>
        </div>
      </div>

      <div className="topbar__right">
        <PortfolioSelector />

        {usuario ? (
          <div className="topbar__user">
            <div className="usuario-chip">
              <span className="avatar" aria-hidden="true">
                {iniciales(usuario.nombre)}
              </span>
              <span className="usuario-chip__datos">
                <strong>{usuario.nombre}</strong>
                <small>{usuario.email}</small>
              </span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={salir}
              disabled={saliendo}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconoSalir />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
