import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  listarMovimientos,
  obtenerResumenPosicion,
  reconstruirPosicion,
  registrarMovimiento,
  revertirMovimiento,
} from '../api/movimientos';
import { listarPortafolios } from '../api/portafolios';
import {
  cambiarEstadoPosicion,
  obtenerPosicion,
} from '../api/posiciones';
import type {
  Movimiento,
  PaginaMovimientos,
  Portafolio,
  Posicion,
  RegistrarMovimientoDatos,
  ResumenPosicion,
  TipoMovimiento,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { MovimientoDetalleDialog } from '../components/MovimientoDetalleDialog';
import { MovimientosTabla } from '../components/MovimientosTabla';
import { PageHeader } from '../components/PageHeader';
import { RegistrarMovimientoForm } from '../components/RegistrarMovimientoForm';
import { StatusBadge } from '../components/StatusBadge';
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  Esqueleto,
} from '../components/ui';
import {
  IconoEditar,
  IconoMas,
  IconoPower,
  IconoRecargar,
  IconoRentaFija,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { formatearCantidad, formatearImporte } from '../lib/decimales';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFecha, formatearFechaHora } from '../lib/format';
import {
  ETIQUETAS_TIPO_MOVIMIENTO,
  etiquetaTipoMovimiento,
  nuevaClaveIdempotencia,
  tonoResultado,
} from '../lib/movimientos';

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

const TAMANO_HISTORIAL = 20;

export function PosicionDetailPage() {
  const { portafolioId = '', posicionId = '' } = useParams();
  const location = useLocation();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [resumen, setResumen] = useState<ResumenPosicion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const [paginaMovimientos, setPaginaMovimientos] =
    useState<PaginaMovimientos | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoMovimiento | ''>('');
  const [desdeFiltro, setDesdeFiltro] = useState('');
  const [hastaFiltro, setHastaFiltro] = useState('');
  const [ordenFiltro, setOrdenFiltro] = useState<'asc' | 'desc'>('desc');
  const [numeroPagina, setNumeroPagina] = useState(0);
  const [recargaHistorial, setRecargaHistorial] = useState(0);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);
  const [errorMovimiento, setErrorMovimiento] = useState<string | null>(null);

  const [movimientoDetalle, setMovimientoDetalle] = useState<Movimiento | null>(
    null,
  );
  const [movimientoARevertir, setMovimientoARevertir] =
    useState<Movimiento | null>(null);
  const [revirtiendo, setRevirtiendo] = useState(false);
  const [errorReversion, setErrorReversion] = useState<string | null>(null);

  const [reconstruyendo, setReconstruyendo] = useState(false);
  const [errorReconstruccion, setErrorReconstruccion] = useState<string | null>(
    null,
  );
  const [diferenciasReconstruccion, setDiferenciasReconstruccion] = useState<
    string[]
  >([]);
  const [confirmandoReparacion, setConfirmandoReparacion] = useState(false);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creada
      ? 'Posición creada correctamente.'
      : estadoNavegacion?.actualizada
        ? 'Cambios guardados correctamente.'
        : null,
  );

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);
  const recargarHistorial = useCallback(
    () => setRecargaHistorial((valor) => valor + 1),
    [],
  );

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      setNoEncontrado(false);

      try {
        const [portafolios, actual, saldos] = await Promise.all([
          listarPortafolios(),
          obtenerPosicion(portafolioId, posicionId),
          obtenerResumenPosicion(portafolioId, posicionId),
        ]);

        if (cancelado) {
          return;
        }

        const encontrado =
          portafolios.find((elemento) => elemento.id === portafolioId) ?? null;

        if (!encontrado) {
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
        setPosicion(actual);
        setResumen(saldos);
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
        setError(mensajeDeError(fallo, 'posicion'));
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [portafolioId, posicionId, intento, marcarSesionExpirada]);

  useEffect(() => {
    let cancelado = false;

    async function cargarHistorial() {
      setCargandoHistorial(true);
      setErrorHistorial(null);

      try {
        const pagina = await listarMovimientos(portafolioId, posicionId, {
          tipo: tipoFiltro || undefined,
          desde: desdeFiltro || undefined,
          hasta: hastaFiltro || undefined,
          orden: ordenFiltro,
          pagina: numeroPagina,
          tamano: TAMANO_HISTORIAL,
        });
        if (!cancelado) {
          setPaginaMovimientos(pagina);
        }
      } catch (fallo) {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorHistorial(mensajeDeError(fallo, 'movimiento'));
      } finally {
        if (!cancelado) {
          setCargandoHistorial(false);
        }
      }
    }

    cargarHistorial();

    return () => {
      cancelado = true;
    };
  }, [
    portafolioId,
    posicionId,
    tipoFiltro,
    desdeFiltro,
    hastaFiltro,
    ordenFiltro,
    numeroPagina,
    recargaHistorial,
    marcarSesionExpirada,
  ]);

  async function cambiarEstado(nuevoActivo: boolean) {
    setCambiandoEstado(true);
    setErrorEstado(null);

    try {
      const actualizada = await cambiarEstadoPosicion(
        portafolioId,
        posicionId,
        nuevoActivo,
      );
      setPosicion(actualizada);
      setConfirmandoEstado(false);
      setAviso(
        nuevoActivo
          ? 'Posición reactivada correctamente.'
          : 'Posición desactivada correctamente. Su historial se conserva.',
      );
      setIntento((valor) => valor + 1);
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEstado(mensajeDeError(fallo, 'posicion'));
    } finally {
      setCambiandoEstado(false);
    }
  }

  async function registrar(datos: RegistrarMovimientoDatos): Promise<boolean> {
    setEnviandoMovimiento(true);
    setErrorMovimiento(null);

    try {
      await registrarMovimiento(portafolioId, posicionId, datos);
      setFormularioAbierto(false);
      setAviso('Movimiento registrado correctamente.');
      recargar();
      recargarHistorial();
      return true;
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return false;
      }
      setErrorMovimiento(mensajeDeError(fallo, 'movimiento'));
      return false;
    } finally {
      setEnviandoMovimiento(false);
    }
  }

  async function confirmarReversion() {
    if (!movimientoARevertir) {
      return;
    }
    setRevirtiendo(true);
    setErrorReversion(null);

    try {
      await revertirMovimiento(portafolioId, movimientoARevertir.id, {
        claveIdempotencia: nuevaClaveIdempotencia(),
      });
      setMovimientoARevertir(null);
      setAviso(
        'Movimiento revertido. Se registró un compensatorio y los saldos se actualizaron.',
      );
      recargar();
      recargarHistorial();
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setMovimientoARevertir(null);
      setErrorReversion(mensajeDeError(fallo, 'movimiento'));
    } finally {
      setRevirtiendo(false);
    }
  }

  async function reconstruir(reparar: boolean) {
    setReconstruyendo(true);
    setErrorReconstruccion(null);

    try {
      const resultado = await reconstruirPosicion(
        portafolioId,
        posicionId,
        reparar,
      );
      if (resultado.coincide) {
        setDiferenciasReconstruccion([]);
        setAviso(
          'Los saldos materializados coinciden con el historial de movimientos.',
        );
      } else if (reparar) {
        setDiferenciasReconstruccion([]);
        setAviso(
          'Saldos reparados desde el historial. Los movimientos no se modificaron.',
        );
        recargar();
        recargarHistorial();
      } else {
        setDiferenciasReconstruccion(resultado.diferencias);
      }
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorReconstruccion(mensajeDeError(fallo, 'posicion'));
    } finally {
      setReconstruyendo(false);
      setConfirmandoReparacion(false);
    }
  }

  function cambiarFiltroTipo(valor: TipoMovimiento | '') {
    setTipoFiltro(valor);
    setNumeroPagina(0);
  }

  function limpiarFiltros() {
    setTipoFiltro('');
    setDesdeFiltro('');
    setHastaFiltro('');
    setOrdenFiltro('desc');
    setNumeroPagina(0);
  }

  const enlacePosiciones = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}/posiciones`;
  const hayFiltros =
    tipoFiltro !== '' ||
    desdeFiltro !== '' ||
    hastaFiltro !== '' ||
    ordenFiltro !== 'desc';

  const cantidadMostrada = resumen?.cantidad ?? posicion?.cantidad ?? '0';
  const costoTotalMostrado = resumen?.costoTotal ?? posicion?.costoTotal ?? '0';
  const costoUnitarioMostrado =
    resumen?.costoUnitario ?? posicion?.costoUnitario ?? '0';
  const resultadoMostrado =
    resumen?.resultadoRealizado ?? posicion?.resultadoRealizado ?? '0';
  const monedaDecimales = posicion?.monedaDecimales ?? 2;
  const monedaCodigo = posicion?.monedaCodigo ?? '';
  const tonoRealizado = tonoResultado(resultadoMostrado);

  return (
    <div className="page">
      <Link className="volver" to={enlacePosiciones}>
        <IconoVolver />
        Volver a las posiciones
      </Link>

      <PageHeader
        eyebrow="Mis activos · Posición"
        titulo={
          cargando
            ? 'Cargando posición…'
            : noEncontrado
              ? 'Posición no encontrada'
              : (posicion?.instrumentoNombre ?? 'Posición')
        }
        descripcion={
          portafolio
            ? `Portafolio ${portafolio.nombre}. El costo es de adquisición; no es valor de mercado.`
            : 'Detalle de la posición registrada en la cuenta.'
        }
        acciones={
          !cargando && posicion ? (
            <>
              <Boton
                onClick={() => {
                  setAviso(null);
                  setErrorMovimiento(null);
                  setFormularioAbierto(true);
                }}
                disabled={!posicion.activo}
                title={
                  posicion.activo
                    ? undefined
                    : 'Reactiva la posición para registrar movimientos.'
                }
              >
                <IconoMas />
                Registrar movimiento
              </Boton>
              <Link
                className="btn btn--secundario"
                to={`${enlacePosiciones}/${encodeURIComponent(
                  posicion.id,
                )}/editar`}
              >
                <IconoEditar />
                Editar
              </Link>
              <Boton
                variante={posicion.activo ? 'peligro' : 'primario'}
                onClick={() => {
                  setAviso(null);
                  setErrorEstado(null);
                  setConfirmandoEstado(true);
                }}
                disabled={cambiandoEstado}
              >
                <IconoPower />
                {posicion.activo ? 'Desactivar' : 'Reactivar'}
              </Boton>
            </>
          ) : null
        }
        meta={
          !cargando && posicion ? (
            <StatusBadge estado={posicion.activo ? 'activo' : 'inactivo'}>
              {posicion.activo ? 'Posición activa' : 'Posición inactiva'}
            </StatusBadge>
          ) : null
        }
      />

      {aviso ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>{aviso}</span>
            <Boton variante="secundario" onClick={() => setAviso(null)}>
              Entendido
            </Boton>
          </div>
        </Alerta>
      ) : null}

      {errorEstado ? <Alerta variante="error">{errorEstado}</Alerta> : null}
      {errorReconstruccion ? (
        <Alerta variante="error">{errorReconstruccion}</Alerta>
      ) : null}

      {diferenciasReconstruccion.length > 0 ? (
        <Alerta variante="info">
          <div className="alerta__accion">
            <span>
              La posición materializada no coincide con el historial:{' '}
              {diferenciasReconstruccion.join(' · ')}
            </span>
            <Boton
              variante="secundario"
              onClick={() => setConfirmandoReparacion(true)}
            >
              Reparar saldos
            </Boton>
          </div>
        </Alerta>
      ) : null}

      {cargando ? (
        <FinancialCard
          titulo="Detalle de la posición"
          subtitulo="Cargando información de la posición…"
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
          titulo="No encontramos esta posición"
          descripcion="Puede que ya no exista o que no tengas acceso a ella. Vuelve a las posiciones del portafolio para elegir otra."
          accion={
            <Link className="btn btn--secundario" to={enlacePosiciones}>
              Volver a las posiciones
            </Link>
          }
        />
      ) : error ? (
        <ErrorState
          mensaje={error}
          titulo="No se pudo cargar la posición"
          onReintentar={recargar}
        />
      ) : posicion ? (
        <>
          <div className="metric-grid">
            <MetricCard
              etiqueta="Cantidad mantenida"
              valor={formatearCantidad(cantidadMostrada)}
              ayuda="Unidades registradas por los movimientos confirmados."
              icono={<IconoRentaFija />}
            />
            <MetricCard
              etiqueta="Costo de adquisición"
              valor={`${formatearImporte(
                costoTotalMostrado,
                monedaDecimales,
              )} ${monedaCodigo}`}
              ayuda="Costo acumulado. No es valor de mercado."
            />
            <MetricCard
              etiqueta="Costo promedio"
              valor={`${formatearImporte(
                costoUnitarioMostrado,
                monedaDecimales,
              )} ${monedaCodigo}`}
              ayuda="Costo total ÷ cantidad mantenida."
            />
            <MetricCard
              etiqueta="Resultado realizado"
              tono={tonoRealizado}
              valor={
                <span className={`resultado resultado--${tonoRealizado}`}>
                  {formatearImporte(resultadoMostrado, monedaDecimales)}{' '}
                  {monedaCodigo}
                </span>
              }
              ayuda="Solo ventas y reversiones confirmadas."
            />
          </div>

          <FinancialCard
            id="titulo-detalle-posicion"
            titulo="Detalle de la posición"
            subtitulo="Datos de la cuenta, el instrumento y el estado materializado."
            acciones={
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar posición"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            }
          >
            <div className="section-stack">
              <div className="detalle__cabecera">
                <span className="detalle__icono" aria-hidden="true">
                  <IconoRentaFija />
                </span>
                <div className="detalle__titulo">
                  <h3>
                    {posicion.instrumentoNombre}
                    {posicion.instrumentoSimbolo ? (
                      <span className="instrumento-simbolo">
                        {posicion.instrumentoSimbolo}
                      </span>
                    ) : null}
                  </h3>
                  <StatusBadge estado={posicion.activo ? 'activo' : 'inactivo'}>
                    {posicion.activo ? 'Activa' : 'Inactiva'}
                  </StatusBadge>
                </div>
              </div>

              <p className="detalle__descripcion">
                {posicion.observaciones ?? 'Sin observaciones.'}
              </p>

              <dl className="detalle__datos">
                <div>
                  <dt>Cuenta</dt>
                  <dd>{posicion.cuentaNombre}</dd>
                </div>
                <div>
                  <dt>Categoría</dt>
                  <dd>{posicion.claseActivoNombre}</dd>
                </div>
                <div>
                  <dt>Tipo de instrumento</dt>
                  <dd>{posicion.tipoInstrumentoNombre}</dd>
                </div>
                <div>
                  <dt>Cantidad mantenida</dt>
                  <dd>{formatearCantidad(cantidadMostrada)}</dd>
                </div>
                <div>
                  <dt>Costo promedio</dt>
                  <dd>
                    {formatearImporte(costoUnitarioMostrado, monedaDecimales)}{' '}
                    {monedaCodigo}
                  </dd>
                </div>
                <div>
                  <dt>Costo de adquisición</dt>
                  <dd>
                    <strong>
                      {formatearImporte(costoTotalMostrado, monedaDecimales)}{' '}
                      {monedaCodigo}
                    </strong>
                  </dd>
                </div>
                <div>
                  <dt>Resultado realizado</dt>
                  <dd>
                    <span className={`resultado resultado--${tonoRealizado}`}>
                      {formatearImporte(resultadoMostrado, monedaDecimales)}{' '}
                      {monedaCodigo}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Moneda</dt>
                  <dd>
                    {posicion.monedaCodigo} · {posicion.monedaNombre}
                  </dd>
                </div>
                <div>
                  <dt>Fecha de apertura</dt>
                  <dd>{formatearFecha(posicion.fechaApertura)}</dd>
                </div>
                <div>
                  <dt>Último movimiento</dt>
                  <dd>
                    {formatearFechaHora(
                      resumen?.fechaUltimoMovimiento ??
                        posicion.fechaUltimoMovimiento,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{posicion.activo ? 'Activa' : 'Inactiva'}</dd>
                </div>
                <div>
                  <dt>Creada</dt>
                  <dd>{formatearFechaHora(posicion.fechaCreacion)}</dd>
                </div>
                <div>
                  <dt>Actualizada</dt>
                  <dd>{formatearFechaHora(posicion.fechaActualizacion)}</dd>
                </div>
                <div>
                  <dt>Identificador</dt>
                  <dd className="dato-id">{posicion.id}</dd>
                </div>
              </dl>

              <p className="card-note">
                La cantidad y el costo son un estado materializado de los
                movimientos confirmados. No se editan libremente cuando existe
                historial: las correcciones se registran con un ajuste o una
                reversión.
              </p>
            </div>
          </FinancialCard>

          {formularioAbierto ? (
            <FinancialCard
              titulo="Registrar movimiento"
              subtitulo="Compra, venta, apertura o ajuste de la posición."
              acciones={
                <Boton
                  variante="fantasma"
                  onClick={() => {
                    setFormularioAbierto(false);
                    setErrorMovimiento(null);
                  }}
                  disabled={enviandoMovimiento}
                >
                  Cerrar
                </Boton>
              }
            >
              <RegistrarMovimientoForm
                monedaCodigo={posicion.monedaCodigo}
                monedaDecimales={posicion.monedaDecimales}
                cantidadActual={cantidadMostrada}
                costoUnitarioActual={costoUnitarioMostrado}
                costoTotalActual={costoTotalMostrado}
                activa={posicion.activo}
                enviando={enviandoMovimiento}
                errorServidor={errorMovimiento}
                onCancelar={() => {
                  setFormularioAbierto(false);
                  setErrorMovimiento(null);
                }}
                onRegistrar={registrar}
              />
            </FinancialCard>
          ) : null}

          <FinancialCard
            titulo="Historial de movimientos"
            subtitulo="Los movimientos confirmados son inmutables y están ordenados por fecha."
            acciones={
              <Boton
                variante="secundario"
                onClick={() => reconstruir(false)}
                cargando={reconstruyendo}
                aria-label="Verificar saldos contra el historial"
              >
                <IconoRecargar />
                Verificar saldos
              </Boton>
            }
          >
            <div className="section-stack">
              <FilterBar
                acciones={
                  <Boton
                    variante="fantasma"
                    onClick={limpiarFiltros}
                    disabled={!hayFiltros}
                  >
                    Limpiar
                  </Boton>
                }
              >
                <CampoSelect
                  etiqueta="Tipo"
                  value={tipoFiltro}
                  onChange={(evento) =>
                    cambiarFiltroTipo(
                      evento.target.value as TipoMovimiento | '',
                    )
                  }
                >
                  <option value="">Todos los tipos</option>
                  {(
                    Object.keys(ETIQUETAS_TIPO_MOVIMIENTO) as TipoMovimiento[]
                  ).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {etiquetaTipoMovimiento(tipo)}
                    </option>
                  ))}
                </CampoSelect>
                <Campo
                  etiqueta="Desde"
                  type="date"
                  value={desdeFiltro}
                  onChange={(evento) => {
                    setDesdeFiltro(evento.target.value);
                    setNumeroPagina(0);
                  }}
                />
                <Campo
                  etiqueta="Hasta"
                  type="date"
                  value={hastaFiltro}
                  onChange={(evento) => {
                    setHastaFiltro(evento.target.value);
                    setNumeroPagina(0);
                  }}
                />
                <CampoSelect
                  etiqueta="Orden"
                  value={ordenFiltro}
                  onChange={(evento) => {
                    setOrdenFiltro(evento.target.value as 'asc' | 'desc');
                    setNumeroPagina(0);
                  }}
                >
                  <option value="desc">Más recientes primero</option>
                  <option value="asc">Más antiguos primero</option>
                </CampoSelect>
              </FilterBar>

              {errorHistorial ? (
                <ErrorState
                  mensaje={errorHistorial}
                  titulo="No se pudo cargar el historial"
                  onReintentar={recargarHistorial}
                />
              ) : (
                <>
                  <MovimientosTabla
                    movimientos={paginaMovimientos?.items ?? []}
                    cargando={cargandoHistorial}
                    onVerDetalle={setMovimientoDetalle}
                    onRevertir={(movimiento) => {
                      setErrorReversion(null);
                      setMovimientoARevertir(movimiento);
                    }}
                    vacio={
                      <EmptyState
                        icono={<IconoVacio />}
                        titulo={
                          hayFiltros
                            ? 'Sin movimientos con estos filtros'
                            : 'Sin movimientos registrados'
                        }
                        descripcion={
                          hayFiltros
                            ? 'Prueba con otro tipo o rango de fechas, o limpia los filtros.'
                            : 'Registra una compra, venta o ajuste para construir el historial de la posición.'
                        }
                      />
                    }
                  />

                  {paginaMovimientos &&
                  paginaMovimientos.totalPaginas > 1 ? (
                    <div className="paginacion">
                      <Boton
                        variante="secundario"
                        onClick={() =>
                          setNumeroPagina((valor) => Math.max(0, valor - 1))
                        }
                        disabled={numeroPagina === 0}
                      >
                        Anterior
                      </Boton>
                      <span>
                        Página {paginaMovimientos.pagina + 1} de{' '}
                        {paginaMovimientos.totalPaginas}
                      </span>
                      <Boton
                        variante="secundario"
                        onClick={() => setNumeroPagina((valor) => valor + 1)}
                        disabled={
                          numeroPagina + 1 >= paginaMovimientos.totalPaginas
                        }
                      >
                        Siguiente
                      </Boton>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </FinancialCard>
        </>
      ) : null}

      {posicion ? (
        <ConfirmationDialog
          abierto={confirmandoEstado}
          titulo={posicion.activo ? 'Desactivar posición' : 'Reactivar posición'}
          descripcion={
            posicion.activo
              ? 'La posición dejará de estar activa, pero su historial se conservará. Puedes reactivarla más adelante.'
              : 'La posición volverá a estar disponible en el portafolio y en los agregados por categoría.'
          }
          textoConfirmar={
            posicion.activo ? 'Sí, desactivar' : 'Sí, reactivar'
          }
          tono={posicion.activo ? 'peligro' : 'primario'}
          cargando={cambiandoEstado}
          onConfirmar={() => cambiarEstado(!posicion.activo)}
          onCancelar={() => {
            if (!cambiandoEstado) {
              setConfirmandoEstado(false);
            }
          }}
        />
      ) : null}

      <MovimientoDetalleDialog
        movimiento={movimientoDetalle}
        onCerrar={() => setMovimientoDetalle(null)}
      />

      <ConfirmationDialog
        abierto={movimientoARevertir !== null}
        titulo="Revertir movimiento"
        descripcion={
          movimientoARevertir ? (
            <>
              Se registrará un movimiento compensatorio por{' '}
              <strong>
                {etiquetaTipoMovimiento(movimientoARevertir.tipo)} de{' '}
                {formatearCantidad(movimientoARevertir.cantidad)} unidades
              </strong>{' '}
              del {formatearFecha(movimientoARevertir.fechaOperacion)}. El
              movimiento original no se modifica ni se elimina.
            </>
          ) : (
            ''
          )
        }
        textoConfirmar="Sí, revertir"
        tono="peligro"
        cargando={revirtiendo}
        onConfirmar={confirmarReversion}
        onCancelar={() => {
          if (!revirtiendo) {
            setMovimientoARevertir(null);
            setErrorReversion(null);
          }
        }}
      />

      {errorReversion ? <Alerta variante="error">{errorReversion}</Alerta> : null}

      <ConfirmationDialog
        abierto={confirmandoReparacion}
        titulo="Reparar saldos de la posición"
        descripcion="La cantidad y el costo materializados se recalcularán desde el historial confirmado. Los movimientos no se modifican ni se eliminan."
        textoConfirmar="Sí, reparar saldos"
        tono="peligro"
        cargando={reconstruyendo}
        onConfirmar={() => reconstruir(true)}
        onCancelar={() => {
          if (!reconstruyendo) {
            setConfirmandoReparacion(false);
          }
        }}
      />
    </div>
  );
}
