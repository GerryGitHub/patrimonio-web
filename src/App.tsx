import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { PortfolioProvider } from './portfolio/PortfolioContext';
import { ActivityPage } from './pages/ActivityPage';
import { AssetCategoryPage } from './pages/AssetCategoryPage';
import { AssetsPage } from './pages/AssetsPage';
import { CuentaDetailPage } from './pages/CuentaDetailPage';
import { CuentaFormPage } from './pages/CuentaFormPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancingPage } from './pages/FinancingPage';
import { InstitucionesPage } from './pages/InstitucionesPage';
import { LiquidezPage } from './pages/LiquidezPage';
import { LoginPage } from './pages/LoginPage';
import { MarketsPage } from './pages/MarketsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';

function RedirigirPortafolio() {
  const { portafolioId = '' } = useParams();
  return (
    <Navigate
      to={`/activos/liquidez/${encodeURIComponent(portafolioId)}`}
      replace
    />
  );
}

function RedirigirNuevaCuenta() {
  const { portafolioId = '' } = useParams();
  return (
    <Navigate
      to={`/activos/liquidez/${encodeURIComponent(
        portafolioId,
      )}/cuentas/nueva`}
      replace
    />
  );
}

function RedirigirCuenta() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  return (
    <Navigate
      to={`/activos/liquidez/${encodeURIComponent(
        portafolioId,
      )}/cuentas/${encodeURIComponent(cuentaId)}`}
      replace
    />
  );
}

function RedirigirEdicionCuenta() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  return (
    <Navigate
      to={`/activos/liquidez/${encodeURIComponent(
        portafolioId,
      )}/cuentas/${encodeURIComponent(cuentaId)}/editar`}
      replace
    />
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/activos" element={<AssetsPage />} />
              <Route path="/activos/liquidez" element={<LiquidezPage />} />
              <Route
                path="/activos/liquidez/:portafolioId"
                element={<PortfolioPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/cuentas/nueva"
                element={<CuentaFormPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/cuentas/:cuentaId"
                element={<CuentaDetailPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/cuentas/:cuentaId/editar"
                element={<CuentaFormPage />}
              />
              <Route
                path="/activos/:categoria"
                element={<AssetCategoryPage />}
              />

              <Route path="/mercados" element={<MarketsPage />} />
              <Route path="/actividad" element={<ActivityPage />} />
              <Route path="/financiamiento" element={<FinancingPage />} />

              <Route path="/configuracion" element={<SettingsPage />} />
              <Route
                path="/configuracion/instituciones"
                element={<InstitucionesPage />}
              />

              <Route
                path="/instituciones"
                element={
                  <Navigate to="/configuracion/instituciones" replace />
                }
              />
              <Route
                path="/portafolios"
                element={<Navigate to="/activos/liquidez" replace />}
              />
              <Route
                path="/portafolios/:portafolioId"
                element={<RedirigirPortafolio />}
              />
              <Route
                path="/portafolios/:portafolioId/cuentas/nueva"
                element={<RedirigirNuevaCuenta />}
              />
              <Route
                path="/portafolios/:portafolioId/cuentas/:cuentaId"
                element={<RedirigirCuenta />}
              />
              <Route
                path="/portafolios/:portafolioId/cuentas/:cuentaId/editar"
                element={<RedirigirEdicionCuenta />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
