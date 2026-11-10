import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarCuentas } from '../api/cuentas';
import { listarCategoriasInstrumento, listarInstrumentos } from '../api/instrumentos';
import { listarPortafolios } from '../api/portafolios';
import {
  listarPosiciones,
  obtenerResumenPosiciones,
} from '../api/posiciones';
import type {
  ClaseActivo,
  CuentaFinanciera,
  FiltrosPosiciones,
  Instrumento,
  Portafolio,
  Posicion,
  ResumenPosiciones,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CostosMoneda } from '../components/CostosMoneda';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { PosicionesTabla } from '../components/PosicionesTabla';
import { Boton, CampoSelect, Esqueleto } from '../components/ui';
import {
  IconoMas,
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
import { usePortafolios } from '../portfolio/PortfolioContext';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export function PosicionesPage() {
  const { portafolioId = '' } = useParams();
  const { marcarSesionExpirada } = useAuth();
  const { seleccionar } = usePortafolios();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [categorias, setCategorias] = useState<ClaseActivo[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [resumen, setResumen] = useState<ResumenPosiciones | null>(null);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [filtroCuenta, setFiltroCuenta] = useState('');
  const [filtroInstrumento, setFiltroInstrumento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoInicial(true);
      setErrorInicial(null);
      setNoEncontrado(false);

      try {
        const [lista, cuentasPortafolio, catalogoCategorias, catalogoInstrumentos] =
          await Promise.all([
            listarPortafolios(),
            listarCuentas(portafolioId),
            listarCategoriasInstrumento(),
            listarInstrumentos(),
          ]);

        if (cancelado) {
          return;
        }

        const encontrado =
          lista.find((elemento) => elemento.id === portafolioId) ?? null;

        if (!encontrado) {
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
        setCuentas(cuentasPortafolio);
        setCategorias(catalogoCategorias);
        setInstrumentos(catalogoInstrumentos);
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
        setErrorInicial(mensajeDeError(fallo, 'posicion'));
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

    const filtros: FiltrosPosiciones = {};
    if (filtroCuenta) {
      filtros.cuentaId = filtroCuenta;
    }
    if (filtroInstrumento) {
      filtros.instrumentoId = filtroInstrumento;
    }
    if (filtroCategoria) {
      filtros.claseActivoId = filtroCategoria;
    }
    if (filtroEstado !== 'todos') {
      filtros.activo = filtroEstado === 'activos';
    }

    setCargando(true);
    setError(null);

    Promise.all([
      listarPosiciones(portafolioId, filtros),
      obtenerResumenPosiciones(portafolioId),
    ])
      .then(([listaPosiciones, resumenPortafolio]) => {
        if (!cancelado) {
          setPosiciones(listaPosiciones);
          setResumen(resumenPortafolio);
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
        setError(mensajeDeError(fallo, 'posicion'));
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
    portafolioId,
    cargandoInicial,
    noEncontrado,
    filtroCuenta,
    filtroInstrumento,
    filtroCategoria,
    filtroEstado,
    intento,
    marcarSesionExpirada,
  ]);

  const instrumentosFiltrados = useMemo(
    () =>
      filtroCategoria
        ? instrumentos.filter(
            (instrumento) => instrumento.claseActivoId === filtroCategoria,
          )
        : instrumentos,
    [instrumentos, filtroCategoria],
  );

  const hayFiltros =
    filtroCuenta !== '' ||
    filtroInstrumento !== '' ||
    filtroCategoria !== '' ||
    filtroEstado !== 'todos';

  function limpiarFiltros() {
    setFiltroCuenta('');
    setFiltroInstrumento('');
    setFiltroCategoria('');
    setFiltroEstado('todos');
  }

  function cambiarCategoria(valor: string) {
    setFiltroCategoria(valor);
    if (
      valor &&
      !instrumentos.some(
        (instrumento) =>
          instrumento.id === filtroInstrumento &&
          instrumento.claseActivoId === valor,
      )
    ) {
      setFiltroInstrumento('');
    }
  }

  const enlacePortafolio = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}`;
  const enlaceNueva = `${enlacePortafolio}/posiciones/nueva`;

  return (
    <div className="page">
      <Link className="volver" to={enlacePortafolio}>
        <IconoVolver />
        Volver al portafolio
      </Link>

      <PageHeader
        eyebrow="Mis activos · Posiciones"
        titulo={
          cargandoInicial
            ? 'Cargando posiciones…'
            : noEncontrado
              ? 'Portafolio no encontrado'
              : `Posiciones de ${portafolio?.nombre ?? 'tu portafolio'}`
        }
        descripcion="Cada posición pertenece a una cuenta e instrumento. El costo total es cantidad × costo unitario; no es valor de mercado."
        acciones={
          noEncontrado || cargandoInicial ? null : (
            <>
              <Link className="btn btn--secundario" to="/instrumentos">
                <IconoRentaFija />
                Instrumentos
              </Link>
              <Link className="btn btn--primario" to={enlaceNueva}>
                <IconoMas />
                Nueva posición
              </Link>
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar posiciones"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            </>
          )
        }
        meta={
          noEncontrado || cargandoInicial ? null : (
            <span className="dato-chip">
              <strong>{resumen?.totalPosiciones ?? 0}</strong>
              {resumen?.totalPosiciones === 1 ? 'posición' : 'posiciones'}
            </span>
          )
        }
      />

      {cargandoInicial ? (
        <FinancialCard
          titulo="Resumen de posiciones"
          subtitulo="Cargando información del portafolio…"
        >
          <div className="section-stack" aria-hidden="true">
            <Esqueleto className="esqueleto--titulo" />
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
        </FinancialCard>
      ) : noEncontrado ? (
        <EmptyState
          icono={<IconoVacio />}
          titulo="No encontramos este portafolio"
          descripcion="Puede que ya no exista o que no tengas acceso a él. Vuelve a Liquidez y cuentas para elegir otro portafolio."
          accion={
            <Link className="btn btn--secundario" to="/activos/liquidez">
              Volver a Liquidez y cuentas
            </Link>
          }
        />
      ) : errorInicial ? (
        <ErrorState
          mensaje={errorInicial}
          titulo="No se pudieron cargar las posiciones"
          onReintentar={recargar}
        />
      ) : (
        <>
          <section aria-label="Resumen de posiciones">
            <div className="metric-grid">
              <MetricCard
                etiqueta="Posiciones"
                valor={resumen?.totalPosiciones ?? 0}
              />
              <MetricCard
                etiqueta="Activas"
                valor={resumen?.posicionesActivas ?? 0}
                tono="positivo"
              />
              <MetricCard
                etiqueta="Instrumentos distintos"
                valor={resumen?.instrumentosDistintos ?? 0}
                tono="lavanda"
              />
              <MetricCard
                etiqueta="Costo agregado"
                valor={
                  <CostosMoneda
                    costos={resumen?.costoPorMoneda ?? []}
                    compacto
                    vacio="Sin costo"
                  />
                }
                ayuda="Suma del costo registrado por moneda. No es valor de mercado."
              />
            </div>
          </section>

          <FinancialCard
            titulo="Posiciones del portafolio"
            subtitulo="Filtra por cuenta, instrumento, categoría o estado. Una cuenta puede tener varias posiciones."
            acciones={
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar posiciones"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            }
            pie="El costo total mostrado corresponde al costo de adquisición registrado. La valuación de mercado llegará en una entrega posterior."
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
                  etiqueta="Cuenta"
                  value={filtroCuenta}
                  onChange={(evento) => setFiltroCuenta(evento.target.value)}
                >
                  <option value="">Todas las cuentas</option>
                  {cuentas.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre}
                      {!cuenta.activo ? ' (inactiva)' : ''}
                    </option>
                  ))}
                </CampoSelect>

                <CampoSelect
                  etiqueta="Categoría"
                  value={filtroCategoria}
                  onChange={(evento) => cambiarCategoria(evento.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </CampoSelect>

                <CampoSelect
                  etiqueta="Instrumento"
                  value={filtroInstrumento}
                  onChange={(evento) =>
                    setFiltroInstrumento(evento.target.value)
                  }
                >
                  <option value="">Todos los instrumentos</option>
                  {instrumentosFiltrados.map((instrumento) => (
                    <option key={instrumento.id} value={instrumento.id}>
                      {instrumento.nombre}
                      {instrumento.simbolo ? ` · ${instrumento.simbolo}` : ''}
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

              {error ? (
                <ErrorState
                  mensaje={error}
                  titulo="No se pudieron consultar las posiciones"
                  onReintentar={recargar}
                />
              ) : (
                <PosicionesTabla
                  portafolioId={portafolioId}
                  posiciones={posiciones}
                  cargando={cargando}
                  vacio={
                    hayFiltros ? (
                      <EmptyState
                        compacta
                        icono={<IconoVacio />}
                        titulo="No hay posiciones con estos filtros"
                        descripcion="Prueba con otra cuenta, instrumento, categoría o estado, o limpia los filtros para ver todas las posiciones."
                        accion={
                          <Boton variante="secundario" onClick={limpiarFiltros}>
                            Limpiar filtros
                          </Boton>
                        }
                      />
                    ) : (
                      <EmptyState
                        compacta
                        icono={<IconoRentaFija />}
                        titulo="Este portafolio no tiene posiciones"
                        descripcion="Registra la posición inicial de un instrumento en una de tus cuentas para empezar a construir el portafolio."
                        accion={
                          <Link className="btn btn--primario" to={enlaceNueva}>
                            <IconoMas />
                            Registrar posición
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
      )}
    </div>
  );
}
