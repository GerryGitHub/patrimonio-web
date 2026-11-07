import { EmptyState } from '../components/EmptyState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoAcciones,
  IconoCripto,
  IconoMercados,
  IconoMoneda,
} from '../components/icons';

const MERCADOS = [
  {
    titulo: 'Acciones',
    descripcion: 'Precios y variaciones de renta variable.',
    Icono: IconoAcciones,
  },
  {
    titulo: 'ETFs',
    descripcion: 'Fondos cotizados y su seguimiento de mercado.',
    Icono: IconoMercados,
  },
  {
    titulo: 'Criptomonedas',
    descripcion: 'Cotizaciones de activos digitales.',
    Icono: IconoCripto,
  },
  {
    titulo: 'Divisas',
    descripcion: 'Tipos de cambio para la moneda base del portafolio.',
    Icono: IconoMoneda,
  },
] as const;

export function MarketsPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Módulos"
        titulo="Mercados"
        descripcion="Espacio reservado para cotizaciones de acciones, ETFs, criptomonedas y divisas. Todavía no se integran proveedores externos."
        meta={<StatusBadge estado="pendiente">Sin proveedor conectado</StatusBadge>}
      />

      <FinancialCard
        titulo="Cobertura prevista"
        subtitulo="Las cotizaciones se mostrarán cuando el backend exponga una fuente de mercado autorizada."
      >
        <div className="pending-grid">
          {MERCADOS.map(({ titulo, descripcion, Icono }) => (
            <article className="pending-card" key={titulo}>
              <span className="pending-card__icon" aria-hidden="true">
                <Icono />
              </span>
              <div>
                <p className="asset-card__title">{titulo}</p>
                <p className="asset-card__description">{descripcion}</p>
              </div>
              <StatusBadge estado="pendiente">Pendiente</StatusBadge>
            </article>
          ))}
        </div>
      </FinancialCard>

      <FinancialCard
        titulo="Sin cotizaciones disponibles"
        subtitulo="No se muestran precios, variaciones ni series simuladas."
      >
        <EmptyState
          icono={<IconoMercados />}
          titulo="Mercados todavía no habilitado"
          descripcion="Cuando exista un proveedor de cotizaciones, esta sección mostrará precios, periodos y variaciones con formato monetario real."
        />
      </FinancialCard>
    </div>
  );
}
