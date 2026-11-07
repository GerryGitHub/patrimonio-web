import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoConfiguracion,
  IconoInstitucion,
  IconoPortafolio,
  IconoSalir,
  IconoUsuario,
} from '../components/icons';
import { iniciales } from '../lib/format';

export function SettingsPage() {
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
    <div className="page">
      <PageHeader
        eyebrow="Sistema"
        titulo="Configuración"
        descripcion="Cuenta, catálogos y preferencias. Las funcionalidades existentes se conservan sin cambios de contrato."
      />

      <div className="dashboard-grid">
        <FinancialCard
          titulo="Cuenta"
          subtitulo="Datos de la sesión autenticada."
          acciones={<IconoUsuario />}
        >
          <div className="detalle__cabecera">
            <span className="avatar" aria-hidden="true">
              {usuario ? iniciales(usuario.nombre) : '?'}
            </span>
            <div className="detalle__titulo">
              <h3>{usuario?.nombre ?? 'Usuario'}</h3>
              <StatusBadge estado="activo">Sesión activa</StatusBadge>
            </div>
          </div>
          <dl className="detail-grid">
            <div className="detail-item">
              <dt>Nombre</dt>
              <dd>{usuario?.nombre ?? 'No disponible'}</dd>
            </div>
            <div className="detail-item">
              <dt>Correo electrónico</dt>
              <dd>{usuario?.email ?? 'No disponible'}</dd>
            </div>
            <div className="detail-item">
              <dt>Identificador</dt>
              <dd className="dato-id">{usuario?.id ?? 'No disponible'}</dd>
            </div>
          </dl>
        </FinancialCard>

        <FinancialCard
          titulo="Catálogos"
          subtitulo="Datos compartidos por los portafolios y las cuentas."
          acciones={<IconoInstitucion />}
        >
          <div className="investment-list">
            <Link className="investment-row" to="/configuracion/instituciones">
              <span className="investment-row__icon" aria-hidden="true">
                <IconoInstitucion />
              </span>
              <span className="investment-row__body">
                <strong>Instituciones financieras</strong>
                <small>Bancos, SOFIPOs, casas de bolsa y exchanges.</small>
              </span>
              <StatusBadge estado="info">Abrir</StatusBadge>
            </Link>
            <Link className="investment-row" to="/activos/liquidez">
              <span className="investment-row__icon" aria-hidden="true">
                <IconoPortafolio />
              </span>
              <span className="investment-row__body">
                <strong>Portafolios y cuentas</strong>
                <small>Moneda base, cuentas financieras y estados.</small>
              </span>
              <StatusBadge estado="info">Abrir</StatusBadge>
            </Link>
          </div>
        </FinancialCard>
      </div>

      <div className="dashboard-grid">
        <FinancialCard
          titulo="Preferencias"
          subtitulo="Opciones de presentación y comportamiento."
          acciones={<IconoConfiguracion />}
        >
          <EmptyState
            compacta
            icono={<IconoConfiguracion />}
            titulo="Sin preferencias configurables"
            descripcion="No se agregan opciones que el backend todavía no pueda persistir. La sección queda preparada para futuras preferencias."
          />
        </FinancialCard>

        <FinancialCard
          titulo="Sesión"
          subtitulo="Cierre seguro de la sesión actual."
          acciones={<IconoSalir />}
        >
          <p className="card-note">
            La sesión usa cookies HttpOnly y protección CSRF. Al cerrar sesión se
            elimina el acceso desde este navegador.
          </p>
          <div className="acciones-en-linea" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn--peligro"
              onClick={salir}
              disabled={saliendo}
            >
              <IconoSalir />
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </FinancialCard>
      </div>
    </div>
  );
}
