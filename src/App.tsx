import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { CuentaDetailPage } from './pages/CuentaDetailPage';
import { CuentaFormPage } from './pages/CuentaFormPage';
import { DashboardPage } from './pages/DashboardPage';
import { InstitucionesPage } from './pages/InstitucionesPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { RegisterPage } from './pages/RegisterPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/instituciones" element={<InstitucionesPage />} />
            <Route
              path="/portafolios/:portafolioId"
              element={<PortfolioPage />}
            />
            <Route
              path="/portafolios/:portafolioId/cuentas/nueva"
              element={<CuentaFormPage />}
            />
            <Route
              path="/portafolios/:portafolioId/cuentas/:cuentaId"
              element={<CuentaDetailPage />}
            />
            <Route
              path="/portafolios/:portafolioId/cuentas/:cuentaId/editar"
              element={<CuentaFormPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
