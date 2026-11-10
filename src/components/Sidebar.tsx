import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import {
  IconoAcciones,
  IconoActividad,
  IconoActivos,
  IconoCerrar,
  IconoConfiguracion,
  IconoCripto,
  IconoEscudo,
  IconoFinanciamiento,
  IconoInmueble,
  IconoLiquidez,
  IconoMercados,
  IconoOtros,
  IconoRentaFija,
  IconoResumen,
  IconoVehiculo,
} from './icons';

interface SidebarProps {
  abierto: boolean;
  onCerrar: () => void;
}

const SUBACTIVOS = [
  { ruta: '/activos/liquidez', etiqueta: 'Liquidez y cuentas', Icono: IconoLiquidez },
  { ruta: '/posiciones', etiqueta: 'Posiciones', Icono: IconoAcciones },
  { ruta: '/instrumentos', etiqueta: 'Instrumentos', Icono: IconoRentaFija },
  { ruta: '/activos/renta-fija', etiqueta: 'Renta fija', Icono: IconoRentaFija },
  { ruta: '/activos/acciones-etfs', etiqueta: 'Acciones y ETFs', Icono: IconoAcciones },
  { ruta: '/activos/criptomonedas', etiqueta: 'Criptomonedas', Icono: IconoCripto },
  { ruta: '/activos/inmuebles', etiqueta: 'Inmuebles', Icono: IconoInmueble },
  { ruta: '/activos/vehiculos', etiqueta: 'Vehículos', Icono: IconoVehiculo },
  { ruta: '/activos/otros', etiqueta: 'Otros activos', Icono: IconoOtros },
] as const;

function esRutaDeActivos(pathname: string): boolean {
  return (
    pathname === '/activos' ||
    pathname.startsWith('/activos/') ||
    pathname.startsWith('/instrumentos') ||
    pathname.startsWith('/posiciones')
  );
}

/** Navegación lateral de escritorio y cajón de navegación en móvil. */
export function Sidebar({ abierto, onCerrar }: SidebarProps) {
  const location = useLocation();
  const [activosAbierto, setActivosAbierto] = useState(
    esRutaDeActivos(location.pathname),
  );

  useEffect(() => {
    if (esRutaDeActivos(location.pathname)) {
      setActivosAbierto(true);
    }
  }, [location.pathname]);

  const activosActivo = esRutaDeActivos(location.pathname);

  return (
    <aside
      id="navegacion-principal"
      className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`.trim()}
      aria-label="Navegación principal"
    >
      <div className="sidebar__brand">
        <Logo />
        <button
          type="button"
          className="icon-button sidebar__close"
          onClick={onCerrar}
          aria-label="Cerrar navegación"
        >
          <IconoCerrar />
        </button>
      </div>

      <nav className="sidebar__nav">
        <p className="sidebar__section">Principal</p>

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`.trim()
          }
        >
          <IconoResumen />
          <span>Resumen</span>
        </NavLink>

        <div className="sidebar__group">
          <button
            type="button"
            className={`sidebar__link sidebar__link--parent ${
              activosActivo ? 'sidebar__link--activo' : ''
            } ${activosAbierto ? 'sidebar__link--abierto' : ''}`.trim()}
            onClick={() => setActivosAbierto((valor) => !valor)}
            aria-expanded={activosAbierto}
            aria-controls="subnavegacion-activos"
          >
            <IconoActivos />
            <span>Mis activos</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {activosAbierto ? (
            <ul className="sidebar__sublist" id="subnavegacion-activos">
              {SUBACTIVOS.map(({ ruta, etiqueta, Icono }) => (
                <li key={ruta}>
                  <NavLink
                    to={ruta}
                    className={({ isActive }) =>
                      `sidebar__sublink ${
                        isActive ? 'sidebar__sublink--activo' : ''
                      }`.trim()
                    }
                  >
                    <Icono />
                    <span>{etiqueta}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="sidebar__section">Módulos</p>

        <NavLink
          to="/mercados"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`.trim()
          }
        >
          <IconoMercados />
          <span>Mercados</span>
        </NavLink>

        <NavLink
          to="/actividad"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`.trim()
          }
        >
          <IconoActividad />
          <span>Actividad</span>
        </NavLink>

        <NavLink
          to="/financiamiento"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`.trim()
          }
        >
          <IconoFinanciamiento />
          <span>Financiamiento</span>
        </NavLink>

        <p className="sidebar__section">Sistema</p>

        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--activo' : ''}`.trim()
          }
        >
          <IconoConfiguracion />
          <span>Configuración</span>
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__note">
          <IconoEscudo />
          <p>
            Tus datos financieros se calculan y validan en el servidor. Esta
            interfaz solo presenta la información autorizada.
          </p>
        </div>
      </div>
    </aside>
  );
}
