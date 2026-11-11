import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerCentroPatrimonio } from '../api/patrimonio';
import type { CentroPatrimonio, FiltrosPatrimonio } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { DistribucionPatrimonio } from '../components/patrimonio/DistribucionPatrimonio';
import { EstadoIndicador } from '../components/patrimonio/EstadoIndicador';
import { EvolucionPatrimonio } from '../components/patrimonio/EvolucionPatrimonio';
import { EventosPatrimonio } from '../components/patrimonio/EventosPatrimonio';
import { LiquidezPatrimonio } from '../components/patrimonio/LiquidezPatrimonio';
import { PatrimonioFiltros } from '../components/patrimonio/PatrimonioFiltros';
import { RendimientosPatrimonio } from '../components/patrimonio/RendimientosPatrimonio';
import { ResumenPatrimonio } from '../components/patrimonio/ResumenPatrimonio';
import { SnapshotsPatrimonio } from '../components/patrimonio/SnapshotsPatrimonio';
import { IconoGrafico, IconoRecargar } from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import {
  etiquetaCobertura,
  monedasDeCentro,
  type OpcionMoneda,
} from '../lib/patrimonio';
import {
  PORTAFOLIO_TODOS,
  usePortafolios,
} from '../portfolio/PortfolioContext';

function fusionarMonedas(
  actuales: OpcionMoneda[],
  nuevas: OpcionMoneda[],
): OpcionMoneda[] {
  const mapa = new Map(actuales.map((moneda) => [moneda.codigo, moneda]));
  for (const moneda of nuevas) {
    if (!mapa.has(moneda.codigo)) {
      mapa.set(moneda.codigo, moneda);
    }
  }
  return [...mapa.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

interface CoberturaProps {
  centro: CentroPatrimonio;
}

/**
 * Explica qué parte del patrimonio cubre la vista.
 *
 * <p>La cobertura se muestra antes de los importes para que el usuario no
 * interprete el costo de las inversiones como patrimonio neto completo. Los
 * conceptos sin fuente aparecen como exclusiones explícitas.</p>
 */
function CoberturaPatrimonio({ centro }: CoberturaProps) {
  const { meta } = centro;

  return (
    <section
      className="cobertura-patrimonio"
      aria-label="Cobertura de la información"
    >
      <div className="cobertura-patrimonio__cabecera">
        <div>
          <p className="eyebrow">Cobertura</p>
          <h2 className="cobertura-patrimonio__titulo">
            Qué incluye este centro
          </h2>
        </div>
        <EstadoIndicador estado={meta.estado} />
      </div>

      <div className="cobertura-patrimonio__grupos">
        <div className="cobertura-grupo">
          <span className="cobertura-grupo__titulo">Incluye</span>
          <ul className="cobertura-chips">
            {meta.cobertura.incluye.map((codigo) => (
              <li className="dato-chip dato-chip--incluye" key={codigo}>
                {etiquetaCobertura(codigo)}
              </li>
            ))}
          </ul>
        </div>

        <div className="cobertura-grupo">
          <span className="cobertura-grupo__titulo">No incluye todavía</span>
          <ul className="cobertura-chips">
            {meta.cobertura.excluye.map((codigo) => (
              <li className="dato-chip dato-chip--excluye" key={codigo}>
                {etiquetaCobertura(codigo)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {meta.limitaciones.length > 0 ? (
        <ul className="cobertura-limitaciones">
          {meta.limitaciones.map((limitacion) => (
            <li key={limitacion}>{limitacion}</li>
          ))}
        </ul>
      ) : null}

      <p className="card-note">
        Los indicadores marcados como no disponibles no se rellenan con ceros.
        Esta vista no representa el patrimonio neto completo mientras falten
        efectivo, activos físicos o pasivos.
      </p>
    </section>
  );
}

/**
 * Centro de Patrimonio.
 *
 * <p>Consolida los activos registrados de todos los portafolios autorizados o
 * de uno concreto. Cada importe conserva su moneda: la interfaz no convierte
 * divisas ni suma monedas distintas. Los indicadores sin fuente se presentan
 * como no disponibles con su motivo.</p>
 */
export function DashboardPage() {
  const {
    portafolios,
    cargando: cargandoPortafolios,
    seleccionadoId,
    seleccionado,
    revision,
  } = usePortafolios();
  const { marcarSesionExpirada } = useAuth();

  const [centro, setCentro] = useState<CentroPatrimonio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [monedas, setMonedas] = useState<OpcionMoneda[]>([]);
  const [filtros, setFiltros] = useState<FiltrosPatrimonio>({
    periodo: 'TODO',
    dimension: 'CLASE_ACTIVO',
  });

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  const portafolioId =
    seleccionadoId && seleccionadoId !== PORTAFOLIO_TODOS
      ? seleccionadoId
      : null;
  const sinPortafolios = !cargandoPortafolios && portafolios.length === 0;

  useEffect(() => {
    if (cargandoPortafolios || !seleccionadoId) {
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    obtenerCentroPatrimonio(portafolioId, filtros)
      .then((datos) => {
        if (cancelado) {
          return;
        }
        setCentro(datos);
        setMonedas((actuales) =>
          fusionarMonedas(actuales, monedasDeCentro(datos)),
        );
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'patrimonio'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [
    cargandoPortafolios,
    seleccionadoId,
    portafolioId,
    filtros,
    revision,
    intento,
    marcarSesionExpirada,
  ]);

  const alcance = seleccionado
    ? seleccionado.nombre
    : seleccionadoId === PORTAFOLIO_TODOS
      ? 'Todos los portafolios'
      : null;

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="Centro de Patrimonio"
        titulo="Centro de Patrimonio"
        descripcion="Vista consolidada de los activos registrados. Los importes se agrupan por moneda y nunca se convierten ni se suman entre divisas."
        meta={
          <>
            {centro ? <EstadoIndicador estado={centro.meta.estado} /> : null}
            {alcance ? (
              <span className="page-header__scope">{alcance}</span>
            ) : null}
          </>
        }
        acciones={
          <button
            type="button"
            className="btn btn--secundario btn--sm"
            onClick={recargar}
            disabled={cargando}
          >
            <IconoRecargar />
            Actualizar
          </button>
        }
      />

      {sinPortafolios ? (
        <FinancialCard titulo="Aún no hay portafolios">
          <EmptyState
            icono={<IconoGrafico />}
            titulo="Crea tu primer portafolio"
            descripcion="El Centro de Patrimonio se construye con las posiciones y movimientos confirmados de tus portafolios. Crea uno para empezar a registrar activos."
            accion={
              <Link className="btn btn--primario" to="/activos/liquidez">
                Ir a mis activos
              </Link>
            }
          />
        </FinancialCard>
      ) : (
        <>
          <PatrimonioFiltros
            monedas={monedas}
            filtros={filtros}
            onCambiar={setFiltros}
            disabled={cargando}
          />

          {cargando && !centro ? (
            <LoadingState mensaje="Consolidando tu patrimonio…" />
          ) : error && !centro ? (
            <ErrorState
              mensaje={error}
              titulo="No se pudo cargar el Centro de Patrimonio"
              onReintentar={recargar}
            />
          ) : centro ? (
            <>
              {error ? (
                <div className="alerta alerta--error" role="alert">
                  <span className="alerta__texto">
                    No se pudo actualizar la vista con los filtros elegidos.
                    Se muestran los últimos datos disponibles. {error}
                  </span>
                </div>
              ) : null}

              <CoberturaPatrimonio centro={centro} />

              <ResumenPatrimonio centro={centro} />

              <div className="dashboard-grid dashboard-grid--principal">
                <FinancialCard
                  titulo="Distribución del patrimonio"
                  subtitulo="Costo de adquisición de las posiciones activas agrupado por la dimensión elegida. Cada donut corresponde a una moneda."
                  id="distribucion-patrimonio"
                >
                  <DistribucionPatrimonio
                    distribucion={centro.distribucion}
                  />
                </FinancialCard>

                <FinancialCard
                  titulo="Evolución histórica"
                  subtitulo="Series construidas con movimientos confirmados. El valor de mercado se mostrará cuando exista una fuente de valuación."
                  id="evolucion-patrimonio"
                >
                  <EvolucionPatrimonio evolucion={centro.evolucion} />
                </FinancialCard>
              </div>

              <div className="dashboard-grid">
                <FinancialCard
                  titulo="Rendimientos realizados"
                  subtitulo="Resultado de operaciones confirmadas en el período, incluidas las posiciones cerradas."
                  id="rendimientos-patrimonio"
                >
                  <RendimientosPatrimonio
                    rendimientos={centro.rendimientos}
                  />
                </FinancialCard>

                <FinancialCard
                  titulo="Liquidez y capital comprometido"
                  subtitulo="Las cuentas se listan con su moneda. Los saldos de efectivo permanecen sin información en esta entrega."
                  id="liquidez-patrimonio"
                >
                  <LiquidezPatrimonio liquidez={centro.liquidez} />
                </FinancialCard>
              </div>

              <div className="dashboard-grid">
                <FinancialCard
                  titulo="Eventos y vencimientos"
                  subtitulo="Solo se muestran eventos registrados. No se generan fechas estimadas."
                  id="eventos-patrimonio"
                >
                  <EventosPatrimonio eventos={centro.eventos} />
                </FinancialCard>

                <FinancialCard
                  titulo="Snapshots patrimoniales"
                  subtitulo="Fotografías manuales del capital invertido y el resultado realizado."
                  id="snapshots-patrimonio"
                >
                  <SnapshotsPatrimonio portafolioId={portafolioId} />
                </FinancialCard>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
