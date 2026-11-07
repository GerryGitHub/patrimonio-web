import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Estructura principal de la aplicación autenticada.
 *
 * <p>En escritorio usa navegación lateral fija. En tablet y móvil la
 * navegación se convierte en un cajón superpuesto con cierre explícito, sin
 * reducir la sidebar a iconos.</p>
 */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />

      {menuAbierto ? (
        <button
          type="button"
          className="sidebar__overlay"
          onClick={() => setMenuAbierto(false)}
          aria-label="Cerrar navegación"
        />
      ) : null}

      <div className="app-shell__main">
        <Header onAbrirMenu={() => setMenuAbierto(true)} />

        <main className="app-main">{children}</main>

        <footer className="pie">
          <div className="pie__interior">
            <span>Patrimonio 360 · Financial Atlas Blue</span>
            <span>Los cálculos financieros se realizan en el backend.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
