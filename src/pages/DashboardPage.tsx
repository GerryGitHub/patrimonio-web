import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarCuentas } from '../api/cuentas';
import { obtenerResumenPosiciones } from '../api/posiciones';
import type { CuentaFinanciera, ResumenPosiciones } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ChartContainer } from '../components/ChartContainer';
import { CostosMoneda } from '../components/CostosMoneda';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { LoadingState } from '../components/LoadingState';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { ResultadosMoneda } from '../components/ResultadosMoneda';
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
import { combinarResumenes, resumenVacio } from '../lib/inversiones';
import { PORTAFOLIO_TODOS, usePortafolios } from '../portfolio/PortfolioContext';

const CATEGORIAS_PENDIENTES = [
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

const CATEGORIAS_INVERSION = [
  {
    nombre: 'Renta fija',
    descripcion: 'Instrumentos de deuda y tasas pactadas.',
    Icono: IconoRentaFija,
    ruta: '/activos/renta-fija',
  },
  {
    nombre: 'Renta variable',
    descripcion: 'Acciones, ETFs y fondos cotizados.',
    Icono: IconoAcciones,
    ruta: '/activos/acciones-etfs',
  },
  {
    nombre: 'Activos digitales',
    descripcion: 'Criptomonedas y otros activos digitales.',
    Icono: IconoCripto,
    ruta: '/activos/criptomonedas',
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

  const [resumen, setResumen] = useState<ResumenPosiciones>(resumenVacio);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(false);
  const [errorPosiciones, setErrorPosiciones] = useState<string | null>(null);
  const [intentoPosiciones, setIntentoPosiciones] = useState(0);

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
  const recargarPosiciones = useCallback(
    () => setIntentoPosiciones((valor) => valor + 1),
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

  useEffect(() => {
    if (ids.length === 0) {
      setResumen(resumenVacio());
      setCargandoPosiciones(false);
      setErrorPosiciones(null);
      return;
    }

    let cancelado = false;
    setCargandoPosiciones(true);
    setErrorPosiciones(null);

    Promise.all(ids.map((id) => obtenerResumenPosiciones(id)))
      .then((resumenes) => {
        if (!cancelado) {
          setResumen(combinarResumenes(resumenes));
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
        setErrorPosiciones(mensajeDeError(fallo, 'posicion'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoPosiciones(false);
        }
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsClave, revision, intentoPosiciones, marcarSesionExpirada]);

  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activo).length;
  const sinPortafolios =
    !cargandoPortafolios && !errorPortafolios && portafolios.length === 0;
  const nombreContexto =
    seleccionadoId === PORTAFOLIO_TODOS
      ? 'Todos los portafolios'
      : (seleccionado?.nombre ?? 'Portafolio');

  const distribucionDe = useCallback(
    (nombre: string) =>
      resumen.distribucionPorCategoria.find(
        (categoria) =>
          categoria.claseActivoNombre.trim().toLowerCase() ===
          nombre.trim().toLowerCase(),
      ),
    [resumen.distribucionPorCategoria],
  );

  const conteoCuentas = cargandoCuentas ? (
    <span className="skeleton skeleton--line" aria-hidden="true" />
  ) : errorCuentas ? (
    '—'
  ) : (
    cuentas.length
  );

  const conteoPosiciones = cargandoPosiciones ? (
    <span className="skeleton skeleton--line" aria-hidden="true" />
  ) : errorPosiciones ? (
    '—'
  ) : (
    resumen.totalPosiciones
  );

  const conteoInstrumentos = cargandoPosiciones ? (
    <span className="skeleton skeleton--line" aria-hidden="true" />
  ) : errorPosiciones ? (
    '—'
  ) : (
    resumen.instrumentosDistintos
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resumen"
        titulo={`${saludo()}${usuario ? `, ${primerNombre(usuario.nombre)}` : ''}`}
        descripcion="Una vista consolidada de tu patrimonio. Los importes de posiciones corresponden al costo registrado, no a una valuación de mercado."
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
                {conteoCuentas}{' '}
                {cuentas.length === 1
                  ? 'cuenta registrada'
                  : 'cuentas registradas'}
                {' · '}
                {cuentasActivas} {cuentasActivas === 1 ? 'activa' : 'activas'}.
                Los importes no se muestran porque aún no existen valuaciones.
              </>
            )}
          </p>
        </FinancialCard>
      </section>

      <section aria-label="Inversiones registradas">
        <div className="metric-grid">
          <MetricCard etiqueta="Posiciones" valor={conteoPosiciones} />
          <MetricCard
            etiqueta="Instrumentos distintos"
            valor={conteoInstrumentos}
            tono="lavanda"
          />
          <MetricCard
            etiqueta="Costo de adquisición"
            valor={
              cargandoPosiciones ? (
                <span className="skeleton skeleton--line" aria-hidden="true" />
              ) : errorPosiciones ? (
                '—'
              ) : (
                <CostosMoneda
                  costos={resumen.costoPorMoneda}
                  compacto
                  vacio="Sin costo"
                />
              )
            }
            ayuda="Costo registrado por moneda. No es valor de mercado ni rendimiento."
          />
          <MetricCard
            etiqueta="Resultado realizado"
            valor={
              cargandoPosiciones ? (
                <span className="skeleton skeleton--line" aria-hidden="true" />
              ) : errorPosiciones ? (
                '—'
              ) : (
                <ResultadosMoneda
                  resultados={resumen.resultadoPorMoneda}
                  compacto
                  vacio="Sin ventas"
                />
              )
            }
            ayuda="Solo ventas y reversiones confirmadas, por moneda."
          />
          <MetricCard
            etiqueta="Cuentas activas"
            valor={
              cargandoCuentas ? (
                <span className="skeleton skeleton--line" aria-hidden="true" />
              ) : errorCuentas ? (
                '—'
              ) : (
                cuentasActivas
              )
            }
            tono="positivo"
          />
        </div>
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

        <FinancialCard
          titulo="Distribución por categoría"
          subtitulo="Posiciones e instrumentos reales por categoría de activo."
          acciones={
            <Link className="btn btn--secundario btn--sm" to="/activos">
              Ver Mis activos
            </Link>
          }
          pie="La distribución usa el costo registrado. No representa valor de mercado ni porcentajes estimados."
        >
          {cargandoPosiciones ? (
            <LoadingState mensaje="Consultando posiciones…" compacto />
          ) : errorPosiciones ? (
            <ErrorState
              mensaje={errorPosiciones}
              titulo="No se pudieron consultar las posiciones"
              onReintentar={recargarPosiciones}
            />
          ) : resumen.distribucionPorCategoria.length === 0 ? (
            <EmptyState
              compacta
              icono={<IconoGrafico />}
              titulo="Sin distribución disponible"
              descripcion="Registra posiciones en tus cuentas para ver la distribución por categoría."
            />
          ) : (
            <div className="distribucion-categorias">
              {resumen.distribucionPorCategoria.map((categoria) => (
                <div
                  className="distribucion-categoria"
                  key={categoria.claseActivoId}
                >
                  <span className="distribucion-categoria__nombre">
                    <strong>{categoria.claseActivoNombre}</strong>
                    <small>
                      {categoria.posiciones}{' '}
                      {categoria.posiciones === 1 ? 'posición' : 'posiciones'} ·{' '}
                      {categoria.instrumentos}{' '}
                      {categoria.instrumentos === 1
                        ? 'instrumento'
                        : 'instrumentos'}
                    </small>
                  </span>
                  <CostosMoneda
                    costos={categoria.costoPorMoneda}
                    compacto
                    vacio="Sin costo"
                  />
                </div>
              ))}
            </div>
          )}
        </FinancialCard>
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
          pie="Los importes de posiciones son costo de adquisición. La valuación de mercado se incorporará en una entrega posterior."
        >
          {cargandoCuentas || cargandoPosiciones ? (
            <LoadingState mensaje="Consultando inversiones…" compacto />
          ) : errorCuentas || errorPosiciones ? (
            <ErrorState
              mensaje={errorCuentas ?? errorPosiciones ?? ''}
              titulo="No se pudieron consultar las inversiones"
              onReintentar={() => {
                recargarCuentas();
                recargarPosiciones();
              }}
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
                    {cuentas.length === 1
                      ? 'cuenta registrada'
                      : 'cuentas registradas'}
                  </small>
                </span>
                <StatusBadge estado={cuentas.length > 0 ? 'activo' : 'neutral'}>
                  {cuentas.length > 0 ? 'Con datos' : 'Sin cuentas'}
                </StatusBadge>
              </div>

              {CATEGORIAS_INVERSION.map(
                ({ nombre, descripcion, Icono, ruta }) => {
                  const distribucion = distribucionDe(nombre);
                  const posiciones = distribucion?.posiciones ?? 0;
                  return (
                    <div className="investment-row" key={ruta}>
                      <span className="investment-row__icon" aria-hidden="true">
                        <Icono />
                      </span>
                      <span className="investment-row__body">
                        <strong>{nombre}</strong>
                        <small>
                          {posiciones}{' '}
                          {posiciones === 1 ? 'posición' : 'posiciones'} ·{' '}
                          {descripcion}
                        </small>
                      </span>
                      {posiciones > 0 ? (
                        <CostosMoneda
                          costos={distribucion?.costoPorMoneda ?? []}
                          compacto
                          vacio="Sin costo"
                        />
                      ) : (
                        <StatusBadge estado="neutral">Sin posiciones</StatusBadge>
                      )}
                    </div>
                  );
                },
              )}

              {CATEGORIAS_PENDIENTES.map(
                ({ nombre, descripcion, Icono, ruta }) => (
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
                ),
              )}
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
