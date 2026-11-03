import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { PantallaCargando } from './PantallaCargando';

export function PublicOnlyRoute() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <PantallaCargando mensaje="Comprobando tu sesión…" />;
  }

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
