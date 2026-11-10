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
import {
  PORTAFOLIO_TODOS,
  PortfolioProvider,
  usePortafolios,
} from './portfolio/PortfolioContext';
import { ActivityPage } from './pages/ActivityPage';
import { AssetCategoryPage } from './pages/AssetCategoryPage';
import { AssetsPage } from './pages/AssetsPage';
import { CuentaDetailPage } from './pages/CuentaDetailPage';
import { CuentaFormPage } from './pages/CuentaFormPage';
import { DashboardPage } from './pages/DashboardPage';
import { FinancingPage } from './pages/FinancingPage';
import { InstitucionesPage } from './pages/InstitucionesPage';
import { InstrumentoDetailPage } from './pages/InstrumentoDetailPage';
import { InstrumentoFormPage } from './pages/InstrumentoFormPage';
import { InstrumentosPage } from './pages/InstrumentosPage';
import { LiquidezPage } from './pages/LiquidezPage';
import { LoginPage } from './pages/LoginPage';
import { MarketsPage } from './pages/MarketsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { PosicionDetailPage } from './pages/PosicionDetailPage';
import { PosicionFormPage } from './pages/PosicionFormPage';
import { PosicionesPage } from './pages/PosicionesPage';
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

function RedirigirPosiciones() {
  const { portafolios, seleccionadoId } = usePortafolios();
  const destino =
    seleccionadoId && seleccionadoId !== PORTAFOLIO_TODOS
      ? seleccionadoId
      : portafolios[0]?.id;

  if (!destino) {
    return <Navigate to="/activos/liquidez" replace />;
  }

  return (
    <Navigate
      to={`/activos/liquidez/${encodeURIComponent(destino)}/posiciones`}
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
                path="/activos/liquidez/:portafolioId/posiciones"
                element={<PosicionesPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/posiciones/nueva"
                element={<PosicionFormPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/posiciones/:posicionId"
                element={<PosicionDetailPage />}
              />
              <Route
                path="/activos/liquidez/:portafolioId/posiciones/:posicionId/editar"
                element={<PosicionFormPage />}
              />
              <Route path="/posiciones" element={<RedirigirPosiciones />} />
              <Route
                path="/activos/:categoria"
                element={<AssetCategoryPage />}
              />

              <Route path="/instrumentos" element={<InstrumentosPage />} />
              <Route
                path="/instrumentos/nuevo"
                element={<InstrumentoFormPage />}
              />
              <Route
                path="/instrumentos/:instrumentoId"
                element={<InstrumentoDetailPage />}
              />
              <Route
                path="/instrumentos/:instrumentoId/editar"
                element={<InstrumentoFormPage />}
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
