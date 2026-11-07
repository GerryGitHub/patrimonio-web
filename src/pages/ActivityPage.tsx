import { EmptyState } from '../components/EmptyState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { IconoActividad } from '../components/icons';

export function ActivityPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Módulos"
        titulo="Actividad"
        descripcion="Historial de operaciones y movimientos del portafolio. La estructura queda preparada para los siguientes módulos."
        meta={<StatusBadge estado="pendiente">Sin movimientos</StatusBadge>}
      />

      <FinancialCard
        titulo="Historial de operaciones"
        subtitulo="Compras, ventas, aportes, retiros y otros movimientos reales."
      >
        <EmptyState
          icono={<IconoActividad />}
          titulo="Todavía no hay actividad registrada"
          descripcion="No se crean movimientos ficticios. La actividad aparecerá cuando existan operaciones reales registradas en el backend."
        />
      </FinancialCard>
    </div>
  );
}
