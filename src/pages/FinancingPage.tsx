import { EmptyState } from '../components/EmptyState';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoFinanciamiento,
  IconoGrafico,
  IconoMoneda,
} from '../components/icons';

export function FinancingPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Módulos"
        titulo="Financiamiento"
        descripcion="Espacio reservado para pasivos, préstamos y financiamientos. Los cálculos de deuda permanecerán en el backend."
        meta={<StatusBadge estado="pendiente">Módulo pendiente</StatusBadge>}
      />

      <div className="metric-grid">
        <MetricCard
          etiqueta="Pasivos registrados"
          valor={<span className="metric-card__placeholder">—</span>}
          icono={<IconoFinanciamiento />}
          ayuda="Todavía no existe un contrato de pasivos en el backend."
        />
        <MetricCard
          etiqueta="Cuotas del periodo"
          valor={<span className="metric-card__placeholder">—</span>}
          icono={<IconoGrafico />}
          ayuda="Las cuotas se mostrarán cuando existan financiamientos reales."
        />
        <MetricCard
          etiqueta="Costo financiero"
          valor={<span className="metric-card__placeholder">—</span>}
          icono={<IconoMoneda />}
          ayuda="No se estiman tasas ni intereses sin datos del backend."
        />
      </div>

      <FinancialCard
        titulo="Préstamos y financiamientos"
        subtitulo="Deudas, tasas, plazos y próximos pagos."
      >
        <EmptyState
          icono={<IconoFinanciamiento />}
          titulo="Sin financiamientos registrados"
          descripcion="No se muestran pasivos, cuotas ni intereses simulados. La sección se habilitará cuando exista el contrato correspondiente."
        />
      </FinancialCard>
    </div>
  );
}
