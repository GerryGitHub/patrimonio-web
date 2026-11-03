import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppShell } from './AppShell';
import { PantallaCargando } from './PantallaCargando';

export function ProtectedRoute() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <PantallaCargando mensaje="Recuperando tu sesión…" />;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: location.pathname }}
      />
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
