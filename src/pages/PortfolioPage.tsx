import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarCuentas, listarTiposCuenta } from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import { obtenerResumenPosiciones } from '../api/posiciones';
import type {
  CuentaFinanciera,
  FiltrosCuentas,
  Institucion,
  Moneda,
  Portafolio,
  ResumenPosiciones,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CostosMoneda } from '../components/CostosMoneda';
import { DataTable, type ColumnaTabla } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Boton, CampoSelect, Esqueleto } from '../components/ui';
import {
  IconoCuenta,
  IconoInstitucion,
  IconoMas,
  IconoMoneda,
  IconoRecargar,
  IconoRentaFija,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFecha } from '../lib/format';
import { usePortafolios } from '../portfolio/PortfolioContext';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export function PortfolioPage() {
  const { portafolioId = '' } = useParams();
  const { marcarSesionExpirada } = useAuth();
  const { seleccionar, revision } = usePortafolios();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [errorCuentas, setErrorCuentas] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [resumen, setResumen] = useState<ResumenPosiciones | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);
  const [intentoResumen, setIntentoResumen] = useState(0);

  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoInicial(true);
      setErrorInicial(null);
      setNoEncontrado(false);

      try {
        const [lista, catalogoMonedas, catalogoInstituciones, catalogoTipos] =
          await Promise.all([
            listarPortafolios(),
            listarMonedas(),
            listarInstituciones(),
            listarTiposCuenta(),
          ]);
        if (cancelado) {
          return;
        }

        const encontrado =
          lista.find((elemento) => elemento.id === portafolioId) ?? null;
        setMonedas(catalogoMonedas);
        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);

        if (!encontrado) {
          setPortafolio(null);
          setCuentas([]);
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
        seleccionar(encontrado.id);
      } catch (fallo) {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        if (esNoEncontrado(fallo)) {
          setNoEncontrado(true);
          return;
        }
        setErrorInicial(mensajeDeError(fallo, 'datos'));
      } finally {
        if (!cancelado) {
          setCargandoInicial(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [portafolioId, intento, marcarSesionExpirada, seleccionar]);

  useEffect(() => {
    if (cargandoInicial || noEncontrado) {
      return;
    }

    let cancelado = false;

    const filtros: FiltrosCuentas = {};
    if (filtroInstitucion) {
      filtros.institucionId = filtroInstitucion;
    }
    if (filtroTipo) {
      filtros.tipoCuentaId = filtroTipo;
    }
    if (filtroEstado !== 'todos') {
      filtros.activo = filtroEstado === 'activos';
    }

    setCargandoCuentas(true);
    setErrorCuentas(null);

    listarCuentas(portafolioId, filtros)
      .then((datos) => {
        if (!cancelado) {
          setCuentas(datos);
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
        if (esNoEncontrado(fallo)) {
          setNoEncontrado(true);
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
  }, [
    portafolioId,
    cargandoInicial,
    noEncontrado,
    filtroInstitucion,
    filtroTipo,
    filtroEstado,
    intento,
    revision,
    marcarSesionExpirada,
  ]);

  useEffect(() => {
    if (cargandoInicial || noEncontrado) {
      return;
    }

    let cancelado = false;
    setCargandoResumen(true);
    setErrorResumen(null);

    obtenerResumenPosiciones(portafolioId)
      .then((datos) => {
        if (!cancelado) {
          setResumen(datos);
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
        if (esNoEncontrado(fallo)) {
          setNoEncontrado(true);
          return;
        }
        setErrorResumen(mensajeDeError(fallo, 'posicion'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoResumen(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [
    portafolioId,
    cargandoInicial,
    noEncontrado,
    intentoResumen,
    revision,
    marcarSesionExpirada,
  ]);

  const nombre = portafolio?.nombre ?? 'Portafolio';
  const monedaBase = portafolio?.monedaBase;
  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activo).length;
  const monedasDistintas = new Set(cuentas.map((cuenta) => cuenta.monedaId)).size;

  const monedasPorId = new Map<string, Moneda>(
    monedas.map((moneda) => [moneda.id, moneda] as const),
  );
  const institucionesPorId = new Map<string, Institucion>(
    instituciones.map((institucion) => [institucion.id, institucion] as const),
  );
  const tiposPorId = new Map<string, TipoCuenta>(
    tiposCuenta.map((tipo) => [tipo.id, tipo] as const),
  );

  const hayFiltros =
    filtroInstitucion !== '' || filtroTipo !== '' || filtroEstado !== 'todos';

  function limpiarFiltros() {
    setFiltroInstitucion('');
    setFiltroTipo('');
    setFiltroEstado('todos');
  }

  const columnas: ColumnaTabla<CuentaFinanciera>[] = [
    {
      clave: 'cuenta',
      encabezado: 'Cuenta',
      render: (cuenta) => (
        <Link
          className="data-table__celda-principal"
          to={`/activos/liquidez/${encodeURIComponent(
            portafolioId,
          )}/cuentas/${encodeURIComponent(cuenta.id)}`}
          aria-label={`Ver el detalle de la cuenta ${cuenta.nombre}`}
        >
          <span>
            <strong>{cuenta.nombre}</strong>
            <small>{cuenta.numeroCuenta ?? 'Sin número registrado'}</small>
          </span>
        </Link>
      ),
    },
    {
      clave: 'institucion',
      encabezado: 'Institución',
      ocultarEnMovil: true,
      render: (cuenta) =>
        institucionesPorId.get(cuenta.institucionId)?.nombre ?? 'No disponible',
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      ocultarEnMovil: true,
      render: (cuenta) =>
        tiposPorId.get(cuenta.tipoCuentaId)?.nombre ?? 'No disponible',
    },
    {
      clave: 'moneda',
      encabezado: 'Moneda',
      render: (cuenta) => (
        <span className="moneda-chip">
          {monedasPorId.get(cuenta.monedaId)?.codigo ?? '—'}
        </span>
      ),
    },
    {
      clave: 'apertura',
      encabezado: 'Apertura',
      ocultarEnMovil: true,
      render: (cuenta) => formatearFecha(cuenta.fechaApertura),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (cuenta) => (
        <StatusBadge estado={cuenta.activo ? 'activo' : 'inactivo'}>
          {cuenta.activo ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (cuenta) => (
        <Link
          className="btn btn--fantasma btn--sm"
          to={`/activos/liquidez/${encodeURIComponent(
            portafolioId,
          )}/cuentas/${encodeURIComponent(cuenta.id)}`}
        >
          Ver
        </Link>
      ),
    },
  ];

  const esqueletoTabla = (
    <div className="cuentas" aria-hidden="true">
      {[0, 1, 2].map((indice) => (
        <div className="cuenta cuenta--esqueleto" key={indice}>
          <Esqueleto className="esqueleto--icono" />
          <Esqueleto className="esqueleto--titulo" />
          <Esqueleto className="esqueleto--linea" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <Link className="volver" to="/activos/liquidez">
        <IconoVolver />
        Volver a Liquidez y cuentas
      </Link>

      <PageHeader
        eyebrow="Mis activos · Liquidez y cuentas"
        titulo={
          cargandoInicial
            ? 'Cargando portafolio…'
            : noEncontrado
              ? 'Portafolio no encontrado'
              : nombre
        }
        descripcion={
          noEncontrado
            ? 'Puede que ya no exista o que no tengas acceso a él.'
            : 'Información general, moneda base y cuentas financieras asociadas.'
        }
        acciones={
          noEncontrado || cargandoInicial ? null : (
            <>
              <Link
                className="btn btn--secundario"
                to={`/activos/liquidez/${encodeURIComponent(
                  portafolioId,
                )}/posiciones`}
              >
                <IconoRentaFija />
                Posiciones
              </Link>
              <Link
                className="btn btn--secundario"
                to="/configuracion/instituciones"
              >
                <IconoInstitucion />
                Instituciones
              </Link>
              <Link
                className="btn btn--primario"
                to={`/activos/liquidez/${encodeURIComponent(
                  portafolioId,
                )}/cuentas/nueva`}
              >
                <IconoMas />
                Nueva cuenta
              </Link>
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar portafolio"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            </>
          )
        }
        meta={
          cargandoInicial || errorInicial || noEncontrado ? null : (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          )
        }
      />

      {cargandoInicial ? (
        <>
          <div className="detalle detalle--esqueleto" aria-hidden="true">
            <Esqueleto className="esqueleto--titulo" />
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
          <div className="cuentas" aria-hidden="true">
            {[0, 1].map((indice) => (
              <div className="cuenta cuenta--esqueleto" key={indice}>
                <Esqueleto className="esqueleto--icono" />
                <Esqueleto className="esqueleto--titulo" />
                <Esqueleto className="esqueleto--linea" />
              </div>
            ))}
          </div>
        </>
      ) : noEncontrado ? (
        <EmptyState
          icono={<IconoVacio />}
          titulo="No encontramos este portafolio"
          descripcion="Comprueba que sigues teniendo acceso o vuelve a Liquidez y cuentas para elegir otro portafolio."
          accion={
            <Link className="btn btn--secundario" to="/activos/liquidez">
              Volver a Liquidez y cuentas
            </Link>
          }
        />
      ) : errorInicial ? (
        <ErrorState
          mensaje={errorInicial}
          titulo="No se pudo cargar el portafolio"
          onReintentar={recargar}
        />
      ) : portafolio ? (
        <>
          <FinancialCard
            titulo="Información general"
            subtitulo="Datos de identificación y moneda base del portafolio."
          >
            <div className="detalle__cabecera">
              <span className="detalle__icono" aria-hidden="true">
                <IconoMoneda />
              </span>
              <div className="detalle__titulo">
                <h3>{portafolio.nombre}</h3>
                <StatusBadge estado={portafolio.activo ? 'activo' : 'inactivo'}>
                  {portafolio.activo ? 'Activo' : 'Inactivo'}
                </StatusBadge>
              </div>
            </div>

            <p className="detalle__descripcion">
              {portafolio.descripcion ?? 'Sin descripción.'}
            </p>

            <dl className="detail-grid">
              <div className="detail-item">
                <dt>Moneda base</dt>
                <dd>
                  {monedaBase
                    ? `${monedaBase.codigo} · ${monedaBase.nombre}`
                    : 'No disponible'}
                </dd>
              </div>
              <div className="detail-item">
                <dt>Símbolo</dt>
                <dd>{monedaBase?.simbolo ?? monedaBase?.codigo ?? '—'}</dd>
              </div>
              <div className="detail-item">
                <dt>Decimales</dt>
                <dd>{monedaBase?.decimales ?? '—'}</dd>
              </div>
              <div className="detail-item">
                <dt>Estado</dt>
                <dd>{portafolio.activo ? 'Activo' : 'Inactivo'}</dd>
              </div>
            </dl>
          </FinancialCard>

          <section aria-label="Resumen de cuentas">
            <div className="metric-grid">
              <MetricCard etiqueta="Cuentas" valor={cuentas.length} />
              <MetricCard
                etiqueta="Activas"
                valor={cuentasActivas}
                tono="positivo"
              />
              <MetricCard
                etiqueta="Inactivas"
                valor={cuentas.length - cuentasActivas}
                tono="lavanda"
              />
              <MetricCard etiqueta="Monedas" valor={monedasDistintas} />
            </div>
          </section>

          <FinancialCard
            titulo="Posiciones del portafolio"
            subtitulo="Costo registrado de las posiciones. No es valor de mercado."
            acciones={
              <Link
                className="btn btn--secundario btn--sm"
                to={`/activos/liquidez/${encodeURIComponent(
                  portafolioId,
                )}/posiciones`}
              >
                <IconoRentaFija />
                Ver posiciones
              </Link>
            }
            pie="El costo agregado se muestra por moneda. No se suman monedas distintas sin conversión."
          >
            {cargandoResumen ? (
              <div className="section-stack" aria-hidden="true">
                <Esqueleto className="esqueleto--linea" />
                <Esqueleto className="esqueleto--linea" />
              </div>
            ) : errorResumen ? (
              <ErrorState
                mensaje={errorResumen}
                titulo="No se pudieron consultar las posiciones"
                onReintentar={() => setIntentoResumen((valor) => valor + 1)}
              />
            ) : resumen && resumen.totalPosiciones > 0 ? (
              <div className="metric-grid">
                <MetricCard
                  etiqueta="Posiciones"
                  valor={resumen.totalPosiciones}
                />
                <MetricCard
                  etiqueta="Activas"
                  valor={resumen.posicionesActivas}
                  tono="positivo"
                />
                <MetricCard
                  etiqueta="Instrumentos distintos"
                  valor={resumen.instrumentosDistintos}
                  tono="lavanda"
                />
                <MetricCard
                  etiqueta="Costo agregado"
                  valor={
                    <CostosMoneda
                      costos={resumen.costoPorMoneda}
                      compacto
                      vacio="Sin costo"
                    />
                  }
                />
              </div>
            ) : (
              <EmptyState
                compacta
                icono={<IconoRentaFija />}
                titulo="Este portafolio no tiene posiciones"
                descripcion="Registra la posición inicial de un instrumento en una de sus cuentas para ver el resumen aquí."
                accion={
                  <Link
                    className="btn btn--primario"
                    to={`/activos/liquidez/${encodeURIComponent(
                      portafolioId,
                    )}/posiciones/nueva`}
                  >
                    <IconoMas />
                    Registrar posición
                  </Link>
                }
              />
            )}
          </FinancialCard>

          <FinancialCard
            titulo="Cuentas financieras"
            subtitulo="Los números de cuenta se muestran enmascarados por seguridad."
            acciones={
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar cuentas"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            }
          >
            <div className="section-stack">
              <FilterBar
                acciones={
                  hayFiltros ? (
                    <Boton variante="fantasma" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Boton>
                  ) : null
                }
              >
                <CampoSelect
                  etiqueta="Institución"
                  value={filtroInstitucion}
                  onChange={(evento) =>
                    setFiltroInstitucion(evento.target.value)
                  }
                >
                  <option value="">Todas las instituciones</option>
                  {instituciones.map((institucion) => (
                    <option key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                      {!institucion.activo ? ' (inactiva)' : ''}
                    </option>
                  ))}
                </CampoSelect>

                <CampoSelect
                  etiqueta="Tipo de cuenta"
                  value={filtroTipo}
                  onChange={(evento) => setFiltroTipo(evento.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {tiposCuenta.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </CampoSelect>

                <CampoSelect
                  etiqueta="Estado"
                  value={filtroEstado}
                  onChange={(evento) =>
                    setFiltroEstado(evento.target.value as FiltroEstado)
                  }
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activos">Solo activas</option>
                  <option value="inactivos">Solo inactivas</option>
                </CampoSelect>
              </FilterBar>

              {errorCuentas ? (
                <ErrorState
                  mensaje={errorCuentas}
                  titulo="No se pudieron consultar las cuentas"
                  onReintentar={recargar}
                />
              ) : (
                <DataTable
                  columnas={columnas}
                  filas={cuentas}
                  obtenerClave={(cuenta) => cuenta.id}
                  cargando={cargandoCuentas}
                  esqueleto={esqueletoTabla}
                  vacio={
                    hayFiltros ? (
                      <EmptyState
                        compacta
                        icono={<IconoVacio />}
                        titulo="No hay cuentas con estos filtros"
                        descripcion="Prueba con otra institución, tipo o estado, o limpia los filtros para ver todas las cuentas."
                        accion={
                          <Boton variante="secundario" onClick={limpiarFiltros}>
                            Limpiar filtros
                          </Boton>
                        }
                      />
                    ) : (
                      <EmptyState
                        compacta
                        icono={<IconoCuenta />}
                        titulo="Este portafolio no tiene cuentas"
                        descripcion="Registra una cuenta financiera para empezar a organizar su información."
                        accion={
                          <Link
                            className="btn btn--primario"
                            to={`/activos/liquidez/${encodeURIComponent(
                              portafolioId,
                            )}/cuentas/nueva`}
                          >
                            <IconoMas />
                            Registrar cuenta
                          </Link>
                        }
                      />
                    )
                  }
                />
              )}
            </div>
          </FinancialCard>
        </>
      ) : null}
    </div>
  );
}
