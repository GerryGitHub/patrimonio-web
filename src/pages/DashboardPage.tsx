import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCuentas } from '../api/cuentas';
import type { CuentaFinanciera } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ChartContainer } from '../components/ChartContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoAcciones,
  IconoActividad,
  IconoCalendario,
  IconoCripto,
  IconoGrafico,
  IconoInmueble,
  IconoLiquidez,
  IconoMas,
  IconoOtros,
  IconoRentaFija,
  IconoVehiculo,
} from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import { primerNombre, saludo } from '../lib/format';
import { PORTAFOLIO_TODOS, usePortafolios } from '../portfolio/PortfolioContext';

const CATEGORIAS_PENDIENTES = [
  {
    nombre: 'Renta fija',
    descripcion: 'Instrumentos de deuda y tasas pactadas.',
    Icono: IconoRentaFija,
    ruta: '/activos/renta-fija',
  },
  {
    nombre: 'Acciones y ETFs',
    descripcion: 'Posiciones de renta variable y fondos cotizados.',
    Icono: IconoAcciones,
    ruta: '/activos/acciones-etfs',
  },
  {
    nombre: 'Criptomonedas',
    descripcion: 'Activos digitales y saldos en exchanges.',
    Icono: IconoCripto,
    ruta: '/activos/criptomonedas',
  },
  {
    nombre: 'Inmuebles',
    descripcion: 'Propiedades y activos inmobiliarios.',
    Icono: IconoInmueble,
    ruta: '/activos/inmuebles',
  },
  {
    nombre: 'Vehículos',
    descripcion: 'Vehículos y otros bienes muebles.',
    Icono: IconoVehiculo,
    ruta: '/activos/vehiculos',
  },
  {
    nombre: 'Otros activos',
    descripcion: 'Bienes, colecciones y activos no clasificados.',
    Icono: IconoOtros,
    ruta: '/activos/otros',
  },
] as const;

export function DashboardPage() {
  const { usuario, marcarSesionExpirada } = useAuth();
  const {
    portafolios,
    cargando: cargandoPortafolios,
    error: errorPortafolios,
    seleccionadoId,
    seleccionado,
    revision,
    recargar: recargarPortafolios,
  } = usePortafolios();

  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [errorCuentas, setErrorCuentas] = useState<string | null>(null);
  const [intentoCuentas, setIntentoCuentas] = useState(0);

  const ids = useMemo(() => {
    if (seleccionadoId === PORTAFOLIO_TODOS || seleccionadoId === null) {
      return portafolios.map((portafolio) => portafolio.id);
    }
    return [seleccionadoId];
  }, [portafolios, seleccionadoId]);

  const idsClave = ids.join(',');

  const recargarCuentas = useCallback(
    () => setIntentoCuentas((valor) => valor + 1),
    [],
  );

  useEffect(() => {
    if (ids.length === 0) {
      setCuentas([]);
      setCargandoCuentas(false);
      setErrorCuentas(null);
      return;
    }

    let cancelado = false;
    setCargandoCuentas(true);
    setErrorCuentas(null);

    Promise.all(ids.map((id) => listarCuentas(id)))
      .then((listas) => {
        if (!cancelado) {
          setCuentas(listas.flat());
        }
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorCuentas(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoCuentas(false);
        }
      });

    return () => {
      cancelado = true;
    };
    // `idsClave` resume la lista de identificadores para evitar bucles por
    // identidad de arreglo; `revision` refresca al cambiar de portafolio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsClave, revision, intentoCuentas, marcarSesionExpirada]);

  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activo).length;
  const sinPortafolios = !cargandoPortafolios && !errorPortafolios && portafolios.length === 0;
  const nombreContexto =
    seleccionadoId === PORTAFOLIO_TODOS
      ? 'Todos los portafolios'
      : (seleccionado?.nombre ?? 'Portafolio');

  const conteoCuentas = cargandoCuentas ? (
    <span className="skeleton skeleton--line" aria-hidden="true" />
  ) : errorCuentas ? (
    '—'
  ) : (
    cuentas.length
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resumen"
        titulo={`${saludo()}${usuario ? `, ${primerNombre(usuario.nombre)}` : ''}`}
        descripcion="Una vista consolidada de tu patrimonio. Los importes se mostrarán cuando existan valuaciones reales."
        meta={
          <>
            <span className="dato-chip">
              <strong>{nombreContexto}</strong>
            </span>
            <StatusBadge estado="info">Solo datos reales</StatusBadge>
          </>
        }
      />

      {errorPortafolios ? (
        <ErrorState
          mensaje={errorPortafolios}
          titulo="No se pudieron consultar tus portafolios"
          onReintentar={recargarPortafolios}
        />
      ) : cargandoPortafolios ? (
        <LoadingState mensaje="Consultando tus portafolios…" />
      ) : sinPortafolios ? (
        <FinancialCard
          titulo="Empieza con un portafolio"
          subtitulo="El portafolio define la moneda base y agrupa tus cuentas y activos."
        >
          <EmptyState
            compacta
            icono={<IconoLiquidez />}
            titulo="Aún no tienes portafolios"
            descripcion="Crea tu primer portafolio para habilitar el resumen patrimonial, las cuentas y los próximos módulos."
            accion={
              <Link className="btn btn--primario" to="/activos/liquidez">
                <IconoMas />
                Crear portafolio
              </Link>
            }
          />
        </FinancialCard>
      ) : null}

      <section className="dashboard-hero" aria-label="Patrimonio neto y balance">
        <MetricCard
          etiqueta="Patrimonio neto"
          valor={<span className="metric-card__placeholder">—</span>}
          icono={<IconoGrafico />}
          ayuda="Todavía no hay valuaciones de activos y pasivos registradas. El patrimonio neto se calculará cuando el backend exponga esa información."
          pie={<StatusBadge estado="pendiente">Pendiente de valuación</StatusBadge>}
        />

        <FinancialCard
          titulo="Activos y pasivos"
          subtitulo="Balance patrimonial consolidado en la moneda base del portafolio."
        >
          <div className="balance-grid">
            <div className="balance-item">
              <p className="balance-item__label">
                <span className="balance-item__dot" aria-hidden="true" />
                Activos
              </p>
              <p className="balance-item__value">—</p>
              <p className="balance-item__helper">Sin valuaciones registradas.</p>
            </div>
            <div className="balance-item">
              <p className="balance-item__label">
                <span
                  className="balance-item__dot balance-item__dot--lavanda"
                  aria-hidden="true"
                />
                Pasivos
              </p>
              <p className="balance-item__value">—</p>
              <p className="balance-item__helper">Sin pasivos registrados.</p>
            </div>
          </div>

          <p className="card-note">
            {cargandoCuentas ? (
              'Consultando cuentas registradas…'
            ) : errorCuentas ? (
              'No fue posible consultar el conteo de cuentas. Las valuaciones seguirán pendientes.'
            ) : (
              <>
                {conteoCuentas} {cuentas.length === 1 ? 'cuenta registrada' : 'cuentas registradas'}
                {' · '}
                {cuentasActivas} {cuentasActivas === 1 ? 'activa' : 'activas'}.
                Los importes no se muestran porque aún no existen valuaciones.
              </>
            )}
          </p>
        </FinancialCard>
      </section>

      <div className="dashboard-grid">
        <ChartContainer
          titulo="Evolución patrimonial"
          subtitulo="Serie histórica del patrimonio neto y sus variaciones."
          periodo="Sin periodo"
          vacio
          tituloVacio="Sin historial de valuaciones"
          descripcionVacia="La gráfica se habilitará cuando existan valuaciones reales en más de una fecha."
          pie="Azul para la serie patrimonial; verde y rojo para variaciones positivas y negativas."
        />

        <ChartContainer
          titulo="Distribución por categoría"
          subtitulo="Participación de cada categoría de activo."
          periodo="Sin periodo"
          vacio
          tituloVacio="Sin distribución disponible"
          descripcionVacia="La distribución requiere valuaciones por categoría. No se muestran porcentajes estimados."
          pie="Azul para la serie principal; lavanda para categorías secundarias."
        />
      </div>

      <div className="dashboard-grid dashboard-grid--ancho">
        <FinancialCard
          titulo="Resumen de inversiones"
          subtitulo="Estado de las categorías de activos y las cuentas registradas."
          acciones={
            <Link className="btn btn--secundario btn--sm" to="/activos">
              Ver Mis activos
            </Link>
          }
          pie="Los importes y rendimientos se incorporarán cuando el backend exponga las valuaciones correspondientes."
        >
          {cargandoCuentas ? (
            <LoadingState mensaje="Consultando cuentas…" compacto />
          ) : errorCuentas ? (
            <ErrorState
              mensaje={errorCuentas}
              titulo="No se pudieron consultar las cuentas"
              onReintentar={recargarCuentas}
            />
          ) : (
            <div className="investment-list">
              <div className="investment-row">
                <span className="investment-row__icon" aria-hidden="true">
                  <IconoLiquidez />
                </span>
                <span className="investment-row__body">
                  <strong>Liquidez y cuentas</strong>
                  <small>
                    {cuentas.length}{' '}
                    {cuentas.length === 1 ? 'cuenta registrada' : 'cuentas registradas'}
                  </small>
                </span>
                <StatusBadge estado={cuentas.length > 0 ? 'activo' : 'neutral'}>
                  {cuentas.length > 0 ? 'Con datos' : 'Sin cuentas'}
                </StatusBadge>
              </div>

              {CATEGORIAS_PENDIENTES.map(({ nombre, descripcion, Icono, ruta }) => (
                <div className="investment-row" key={ruta}>
                  <span className="investment-row__icon" aria-hidden="true">
                    <Icono />
                  </span>
                  <span className="investment-row__body">
                    <strong>{nombre}</strong>
                    <small>{descripcion}</small>
                  </span>
                  <StatusBadge estado="pendiente">Pendiente</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </FinancialCard>

        <FinancialCard
          titulo="Próximos vencimientos"
          subtitulo="Pagos, cupones y fechas relevantes de tus instrumentos."
          acciones={<IconoCalendario />}
        >
          <EmptyState
            compacta
            icono={<IconoCalendario />}
            titulo="Sin vencimientos registrados"
            descripcion="Los vencimientos aparecerán cuando existan instrumentos con fechas reales en el portafolio."
          />
        </FinancialCard>
      </div>

      <FinancialCard
        titulo="Actividad reciente"
        subtitulo="Últimos movimientos y operaciones registradas."
        acciones={
          <Link className="btn btn--secundario btn--sm" to="/actividad">
            Ver actividad
          </Link>
        }
      >
        <EmptyState
          compacta
          icono={<IconoActividad />}
          titulo="Todavía no hay actividad"
          descripcion="No se inventan movimientos. La actividad aparecerá cuando registres operaciones reales en los próximos módulos."
        />
      </FinancialCard>
    </div>
  );
}
