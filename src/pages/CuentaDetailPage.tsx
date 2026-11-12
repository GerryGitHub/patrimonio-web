import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  cambiarEstadoCuenta,
  listarCuentas,
  listarTiposCuenta,
  obtenerCuenta,
} from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import {
  listarPosiciones,
  obtenerResumenPosiciones,
} from '../api/posiciones';
import type {
  CostoPorMoneda,
  CuentaFinanciera,
  Institucion,
  Moneda,
  Portafolio,
  Posicion,
  ResumenPosiciones,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { CostosMoneda } from '../components/CostosMoneda';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { PosicionesTabla } from '../components/PosicionesTabla';
import { SeccionNoDisponible } from '../components/SeccionNoDisponible';
import { StatusBadge } from '../components/StatusBadge';
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  Esqueleto,
} from '../components/ui';
import {
  IconoActividad,
  IconoCheck,
  IconoCuenta,
  IconoEditar,
  IconoEscudo,
  IconoGrafico,
  IconoLiquidez,
  IconoMas,
  IconoPower,
  IconoRecargar,
  IconoRentaFija,
  IconoResumen,
  IconoTendencia,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { etiquetaTipoInstitucion } from '../lib/catalogos';
import { sumarDecimales } from '../lib/decimales';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFecha } from '../lib/format';

type PestanaCuenta =
  | 'resumen'
  | 'movimientos'
  | 'posiciones'
  | 'contratos'
  | 'rendimientos'
  | 'valuacion';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';
type FiltroEstadoPosiciones = 'todas' | 'activas' | 'inactivas';

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

const PESTANAS: Array<{
  id: PestanaCuenta;
  etiqueta: string;
  Icono: typeof IconoResumen;
}> = [
  { id: 'resumen', etiqueta: 'Resumen', Icono: IconoResumen },
  { id: 'movimientos', etiqueta: 'Movimientos', Icono: IconoActividad },
  { id: 'posiciones', etiqueta: 'Posiciones', Icono: IconoRentaFija },
  { id: 'contratos', etiqueta: 'Contratos', Icono: IconoEscudo },
  { id: 'rendimientos', etiqueta: 'Rendimientos', Icono: IconoTendencia },
  { id: 'valuacion', etiqueta: 'Valuación', Icono: IconoGrafico },
];

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

function TextoNoDisponible() {
  return <span className="dato-no-disponible">NO_DISPONIBLE</span>;
}

export function CuentaDetailPage() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [resumenPortafolio, setResumenPortafolio] =
    useState<ResumenPosiciones | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);

  const [cuenta, setCuenta] = useState<CuentaFinanciera | null>(null);
  const [cargandoCuenta, setCargandoCuenta] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);
  const [cuentaNoEncontrada, setCuentaNoEncontrada] = useState(false);
  const [intentoCuenta, setIntentoCuenta] = useState(0);

  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(false);
  const [errorPosiciones, setErrorPosiciones] = useState<string | null>(null);
  const [intentoPosiciones, setIntentoPosiciones] = useState(0);

  const [pestana, setPestana] = useState<PestanaCuenta>('resumen');

  const [busqueda, setBusqueda] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const [busquedaPosiciones, setBusquedaPosiciones] = useState('');
  const [filtroEstadoPosiciones, setFiltroEstadoPosiciones] =
    useState<FiltroEstadoPosiciones>('todas');

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creada
      ? 'Cuenta creada correctamente.'
      : estadoNavegacion?.actualizada
        ? 'Cambios guardados correctamente.'
        : null,
  );

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);
  const recargarCuenta = useCallback(
    () => setIntentoCuenta((valor) => valor + 1),
    [],
  );
  const recargarPosiciones = useCallback(
    () => setIntentoPosiciones((valor) => valor + 1),
    [],
  );

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoInicial(true);
      setErrorInicial(null);
      setNoEncontrado(false);

      try {
        const [
          portafolios,
          cuentasPortafolio,
          catalogoInstituciones,
          catalogoTipos,
          catalogoMonedas,
        ] = await Promise.all([
          listarPortafolios(),
          listarCuentas(portafolioId),
          listarInstituciones(),
          listarTiposCuenta(),
          listarMonedas(),
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
        setCuentas(cuentasPortafolio);
        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);
        setMonedas(catalogoMonedas);
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
  }, [portafolioId, intento, marcarSesionExpirada]);

  useEffect(() => {
    if (cargandoInicial || noEncontrado || errorInicial) {
      return;
    }

    let cancelado = false;
    setCargandoResumen(true);
    setErrorResumen(null);

    obtenerResumenPosiciones(portafolioId)
      .then((datos) => {
        if (!cancelado) {
          setResumenPortafolio(datos);
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
    errorInicial,
    marcarSesionExpirada,
  ]);

  useEffect(() => {
    if (!cuentaId || cargandoInicial || noEncontrado || errorInicial) {
      setCuenta(null);
      setCargandoCuenta(false);
      setErrorCuenta(null);
      setCuentaNoEncontrada(false);
      return;
    }

    let cancelado = false;
    setCuenta(null);
    setCargandoCuenta(true);
    setErrorCuenta(null);
    setCuentaNoEncontrada(false);

    obtenerCuenta(portafolioId, cuentaId)
      .then((datos) => {
        if (!cancelado) {
          setCuenta(datos);
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
          setCuentaNoEncontrada(true);
          return;
        }
        setErrorCuenta(mensajeDeError(fallo, 'cuenta'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoCuenta(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [
    portafolioId,
    cuentaId,
    cargandoInicial,
    noEncontrado,
    errorInicial,
    intentoCuenta,
    marcarSesionExpirada,
  ]);

  const cuentaCargadaId = cuenta?.id ?? '';

  useEffect(() => {
    if (!cuentaId || cuentaCargadaId !== cuentaId) {
      setPosiciones([]);
      setCargandoPosiciones(false);
      setErrorPosiciones(null);
      return;
    }

    let cancelado = false;
    setCargandoPosiciones(true);
    setErrorPosiciones(null);

    listarPosiciones(portafolioId, { cuentaId })
      .then((registradas) => {
        if (cancelado) {
          return;
        }

        // El backend ya filtra por cuenta. Se vuelve a comprobar para no
        // mostrar posiciones ajenas si la respuesta llegara mezclada.
        setPosiciones(
          registradas.filter((posicion) => posicion.cuentaId === cuentaId),
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
  }, [
    portafolioId,
    cuentaId,
    cuentaCargadaId,
    intentoPosiciones,
    marcarSesionExpirada,
  ]);

  const enlacePortafolio = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}`;
  const enlaceCuentas = `${enlacePortafolio}/cuentas`;

  useEffect(() => {
    if (
      cargandoInicial ||
      noEncontrado ||
      errorInicial ||
      cuentaId ||
      cuentas.length === 0
    ) {
      return;
    }

    navigate(`${enlaceCuentas}/${encodeURIComponent(cuentas[0].id)}`, {
      replace: true,
    });
  }, [
    cargandoInicial,
    noEncontrado,
    errorInicial,
    cuentaId,
    cuentas,
    navigate,
    enlaceCuentas,
  ]);

  useEffect(() => {
    setPestana('resumen');
    setBusquedaPosiciones('');
    setFiltroEstadoPosiciones('todas');
  }, [cuentaId]);

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [institucion.id, institucion]),
      ),
    [instituciones],
  );
  const tiposPorId = useMemo(
    () => new Map(tiposCuenta.map((tipo) => [tipo.id, tipo])),
    [tiposCuenta],
  );
  const monedasPorId = useMemo(
    () => new Map(monedas.map((moneda) => [moneda.id, moneda])),
    [monedas],
  );

  const cuentasActivas = cuentas.filter((elemento) => elemento.activo).length;
  const hayFiltrosCuentas =
    busqueda.trim() !== '' ||
    filtroInstitucion !== '' ||
    filtroTipo !== '' ||
    filtroEstado !== 'todos';

  const cuentasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return cuentas.filter((elemento) => {
      if (
        filtroInstitucion &&
        elemento.institucionId !== filtroInstitucion
      ) {
        return false;
      }
      if (filtroTipo && elemento.tipoCuentaId !== filtroTipo) {
        return false;
      }
      if (
        filtroEstado !== 'todos' &&
        elemento.activo !== (filtroEstado === 'activos')
      ) {
        return false;
      }
      if (!texto) {
        return true;
      }

      const institucion = institucionesPorId.get(elemento.institucionId);
      const tipo = tiposPorId.get(elemento.tipoCuentaId);
      const moneda = monedasPorId.get(elemento.monedaId);
      const contenido = normalizarTexto(
        [
          elemento.nombre,
          elemento.numeroCuenta ?? '',
          institucion?.nombre ?? '',
          tipo?.nombre ?? '',
          moneda?.codigo ?? '',
        ].join(' '),
      );

      return contenido.includes(texto);
    });
  }, [
    cuentas,
    busqueda,
    filtroInstitucion,
    filtroTipo,
    filtroEstado,
    institucionesPorId,
    tiposPorId,
    monedasPorId,
  ]);

  function limpiarFiltrosCuentas() {
    setBusqueda('');
    setFiltroInstitucion('');
    setFiltroTipo('');
    setFiltroEstado('todos');
  }

  const resumenCuenta = useMemo(() => {
    const activas = posiciones.filter((posicion) => posicion.activo).length;
    const costoPorMoneda: CostoPorMoneda[] = [];

    for (const posicion of posiciones) {
      const existente = costoPorMoneda.find(
        (costo) => costo.monedaId === posicion.monedaId,
      );

      if (existente) {
        existente.costo = sumarDecimales(
          existente.costo,
          posicion.costoTotal,
        );
      } else {
        costoPorMoneda.push({
          monedaId: posicion.monedaId,
          codigo: posicion.monedaCodigo,
          nombre: posicion.monedaNombre,
          simbolo: posicion.monedaSimbolo,
          decimales: posicion.monedaDecimales,
          costo: posicion.costoTotal,
        });
      }
    }

    return {
      total: posiciones.length,
      activas,
      inactivas: posiciones.length - activas,
      costoPorMoneda,
    };
  }, [posiciones]);

  const hayFiltrosPosiciones =
    busquedaPosiciones.trim() !== '' ||
    filtroEstadoPosiciones !== 'todas';

  const posicionesFiltradas = useMemo(() => {
    const texto = normalizarTexto(busquedaPosiciones);

    return posiciones.filter((posicion) => {
      if (
        filtroEstadoPosiciones !== 'todas' &&
        posicion.activo !== (filtroEstadoPosiciones === 'activas')
      ) {
        return false;
      }
      if (!texto) {
        return true;
      }

      return normalizarTexto(
        [
          posicion.instrumentoNombre,
          posicion.instrumentoSimbolo ?? '',
          posicion.claseActivoNombre,
          posicion.tipoInstrumentoNombre,
        ].join(' '),
      ).includes(texto);
    });
  }, [posiciones, busquedaPosiciones, filtroEstadoPosiciones]);

  function limpiarFiltrosPosiciones() {
    setBusquedaPosiciones('');
    setFiltroEstadoPosiciones('todas');
  }

  function manejarTecladoPestanas(evento: KeyboardEvent<HTMLDivElement>) {
    const indiceActual = PESTANAS.findIndex(
      (elemento) => elemento.id === pestana,
    );
    let siguiente = indiceActual;

    if (evento.key === 'ArrowRight') {
      siguiente = (indiceActual + 1) % PESTANAS.length;
    } else if (evento.key === 'ArrowLeft') {
      siguiente = (indiceActual - 1 + PESTANAS.length) % PESTANAS.length;
    } else if (evento.key === 'Home') {
      siguiente = 0;
    } else if (evento.key === 'End') {
      siguiente = PESTANAS.length - 1;
    } else {
      return;
    }

    evento.preventDefault();
    const destino = PESTANAS[siguiente];
    setPestana(destino.id);
    document.getElementById(`tab-${destino.id}`)?.focus();
  }

  async function cambiarEstado(nuevoActivo: boolean) {
    setCambiandoEstado(true);
    setErrorEstado(null);

    try {
      const actualizada = await cambiarEstadoCuenta(
        portafolioId,
        cuentaId,
        nuevoActivo,
      );
      setCuenta(actualizada);
      setCuentas((actuales) =>
        actuales.map((elemento) =>
          elemento.id === actualizada.id ? actualizada : elemento,
        ),
      );
      setConfirmandoEstado(false);
      setAviso(
        nuevoActivo
          ? 'Cuenta reactivada correctamente.'
          : 'Cuenta desactivada correctamente. Su historial se conserva.',
      );
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEstado(mensajeDeError(fallo, 'cuenta'));
    } finally {
      setCambiandoEstado(false);
    }
  }

  const institucion = institucionesPorId.get(cuenta?.institucionId ?? '');
  const tipoCuenta = tiposPorId.get(cuenta?.tipoCuentaId ?? '');
  const moneda = monedasPorId.get(cuenta?.monedaId ?? '');

  const valorPosicionesPortafolio = cargandoResumen ? (
    <Esqueleto className="esqueleto--linea" />
  ) : errorResumen || !resumenPortafolio ? (
    <TextoNoDisponible />
  ) : (
    resumenPortafolio.totalPosiciones
  );

  function contenidoPestana() {
    if (!cuenta) {
      return null;
    }

    if (pestana === 'resumen') {
      return (
        <div className="cuenta-panel__resumen">
          <dl className="detalle__datos">
            <div>
              <dt>Institución</dt>
              <dd>
                {institucion
                  ? `${institucion.nombre} · ${etiquetaTipoInstitucion(
                      institucion.tipo,
                    )}`
                  : 'No disponible'}
              </dd>
            </div>
            <div>
              <dt>Tipo de cuenta</dt>
              <dd>{tipoCuenta?.nombre ?? 'No disponible'}</dd>
            </div>
            <div>
              <dt>Moneda</dt>
              <dd>
                {moneda
                  ? `${moneda.codigo} · ${moneda.nombre}`
                  : 'No disponible'}
              </dd>
            </div>
            <div>
              <dt>Referencia</dt>
              <dd className="dato-enmascarado">
                {cuenta.numeroCuenta ?? 'Sin referencia'}
              </dd>
            </div>
            <div>
              <dt>Fecha de apertura</dt>
              <dd>{formatearFecha(cuenta.fechaApertura)}</dd>
            </div>
            <div>
              <dt>Fecha de cierre</dt>
              <dd>{formatearFecha(cuenta.fechaCierre)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{cuenta.activo ? 'Activa' : 'Inactiva'}</dd>
            </div>
            <div>
              <dt>Identificador</dt>
              <dd className="dato-id">{cuenta.id}</dd>
            </div>
          </dl>

          <div className="cuenta-panel__bloques">
            <section
              className="cuenta-panel__bloque"
              aria-label="Resumen de posiciones de la cuenta"
            >
              <div className="cuenta-panel__bloque-cabecera">
                <h3>Posiciones de la cuenta</h3>
                <Boton
                  variante="fantasma"
                  onClick={() => setPestana('posiciones')}
                >
                  Ver posiciones
                </Boton>
              </div>

              {cargandoPosiciones ? (
                <div className="section-stack" aria-hidden="true">
                  <Esqueleto className="esqueleto--linea" />
                  <Esqueleto className="esqueleto--linea" />
                </div>
              ) : errorPosiciones ? (
                <p className="cuenta-panel__texto">
                  El resumen de posiciones no está disponible en este momento.
                </p>
              ) : resumenCuenta.total === 0 ? (
                <p className="cuenta-panel__texto">
                  Esta cuenta no tiene posiciones registradas.
                </p>
              ) : (
                <div className="cuenta-panel__metricas">
                  <div className="cuenta-panel__metrica">
                    <strong>{resumenCuenta.total}</strong>
                    <span>Posiciones</span>
                  </div>
                  <div className="cuenta-panel__metrica">
                    <strong>{resumenCuenta.activas}</strong>
                    <span>Activas</span>
                  </div>
                  <div className="cuenta-panel__metrica">
                    <strong>{resumenCuenta.inactivas}</strong>
                    <span>Inactivas</span>
                  </div>
                  <div className="cuenta-panel__metrica cuenta-panel__metrica--ancha">
                    <span>Costo por moneda</span>
                    <CostosMoneda
                      costos={resumenCuenta.costoPorMoneda}
                      compacto
                      vacio="Sin costo"
                    />
                  </div>
                </div>
              )}
            </section>

            <section
              className="cuenta-panel__bloque"
              aria-label="Efectivo de la cuenta"
            >
              <div className="cuenta-panel__bloque-cabecera">
                <h3>Efectivo de la cuenta</h3>
                <StatusBadge estado="pendiente">NO_DISPONIBLE</StatusBadge>
              </div>
              <p className="cuenta-panel__texto">
                La API actual no expone saldos de efectivo por cuenta. No se
                muestra un importe estimado ni se usa el costo de las
                posiciones como saldo disponible.
              </p>
            </section>
          </div>
        </div>
      );
    }

    if (pestana === 'posiciones') {
      if (cargandoPosiciones) {
        return (
          <div className="section-stack" aria-hidden="true">
            <Esqueleto className="esqueleto--titulo" />
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
        );
      }

      if (errorPosiciones) {
        return (
          <ErrorState
            mensaje={errorPosiciones}
            titulo="No se pudieron consultar las posiciones"
            onReintentar={recargarPosiciones}
          />
        );
      }

      if (resumenCuenta.total === 0) {
        return (
          <EmptyState
            compacta
            icono={<IconoRentaFija />}
            titulo="Esta cuenta no tiene posiciones"
            descripcion="Registra la posición inicial de un instrumento para dar seguimiento a esta cuenta."
            accion={
              <Link
                className="btn btn--primario"
                to={`${enlacePortafolio}/posiciones/nueva`}
              >
                <IconoMas />
                Registrar posición
              </Link>
            }
          />
        );
      }

      return (
        <div className="section-stack">
          <div className="metric-grid">
            <MetricCard
              etiqueta="Posiciones"
              valor={resumenCuenta.total}
            />
            <MetricCard
              etiqueta="Activas"
              valor={resumenCuenta.activas}
              tono="positivo"
            />
            <MetricCard
              etiqueta="Inactivas"
              valor={resumenCuenta.inactivas}
              tono="lavanda"
            />
            <MetricCard
              etiqueta="Costo por moneda"
              valor={
                <CostosMoneda
                  costos={resumenCuenta.costoPorMoneda}
                  compacto
                  vacio="Sin costo"
                />
              }
              ayuda="Costo registrado por moneda. No es efectivo ni valor de mercado."
            />
          </div>

          <FilterBar
            acciones={
              hayFiltrosPosiciones ? (
                <Boton
                  variante="fantasma"
                  onClick={limpiarFiltrosPosiciones}
                >
                  Limpiar filtros
                </Boton>
              ) : null
            }
          >
            <Campo
              etiqueta="Buscar posición"
              type="search"
              placeholder="Instrumento, símbolo o categoría"
              value={busquedaPosiciones}
              onChange={(evento) =>
                setBusquedaPosiciones(evento.target.value)
              }
            />
            <CampoSelect
              etiqueta="Estado de la posición"
              value={filtroEstadoPosiciones}
              onChange={(evento) =>
                setFiltroEstadoPosiciones(
                  evento.target.value as FiltroEstadoPosiciones,
                )
              }
            >
              <option value="todas">Todos los estados</option>
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
            </CampoSelect>
          </FilterBar>

          <div className="acciones-en-linea">
            <Boton
              variante="secundario"
              onClick={recargarPosiciones}
              aria-label="Actualizar posiciones de la cuenta"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
            <Link
              className="btn btn--secundario"
              to={`${enlacePortafolio}/posiciones/nueva`}
            >
              <IconoMas />
              Registrar posición
            </Link>
          </div>

          <PosicionesTabla
            portafolioId={portafolioId}
            posiciones={posicionesFiltradas}
            vacio={
              <EmptyState
                compacta
                icono={<IconoVacio />}
                titulo="No hay posiciones con estos filtros"
                descripcion="Prueba con otro instrumento o estado, o limpia los filtros para ver todas las posiciones de la cuenta."
                accion={
                  <Boton
                    variante="secundario"
                    onClick={limpiarFiltrosPosiciones}
                  >
                    Limpiar filtros
                  </Boton>
                }
              />
            }
          />
        </div>
      );
    }

    if (pestana === 'movimientos') {
      return (
        <SeccionNoDisponible
          icono={<IconoActividad />}
          titulo="Movimientos de efectivo"
          descripcion="La API actual no expone depósitos, retiros, transferencias ni otros movimientos de efectivo de la cuenta. Los movimientos de inversión se consultan en el detalle de cada posición y no se presentan aquí como movimientos de efectivo."
          nota="No se muestran registros simulados ni se mezclan operaciones de inversión con saldos de efectivo."
        />
      );
    }

    if (pestana === 'contratos') {
      return (
        <SeccionNoDisponible
          icono={<IconoEscudo />}
          titulo="Contratos"
          descripcion="La API actual no expone contratos, vencimientos ni condiciones asociadas a la cuenta."
          nota="La sección se habilitará cuando exista el contrato de contratos y vencimientos en el backend."
        />
      );
    }

    if (pestana === 'rendimientos') {
      return (
        <SeccionNoDisponible
          icono={<IconoTendencia />}
          titulo="Rendimientos"
          descripcion="La API actual no expone intereses, comisiones ni rendimientos por cuenta. El resultado realizado de las posiciones se consulta en el módulo de inversiones."
          nota="No se calculan rendimientos estimados ni se atribuyen intereses sin una fuente real."
        />
      );
    }

    return (
      <SeccionNoDisponible
        icono={<IconoGrafico />}
        titulo="Valuación de la cuenta"
        descripcion="La API actual no expone precios de mercado ni valuaciones por cuenta. El costo registrado de las posiciones no representa una valuación de mercado."
        nota="La valuación se habilitará cuando exista una fuente de precios y un contrato de valuaciones."
      />
    );
  }

  return (
    <div className="page cuentas-efectivo">
      <Link className="volver" to={enlacePortafolio}>
        <IconoVolver />
        Volver al portafolio
      </Link>

      <PageHeader
        eyebrow="Mis activos · Liquidez y cuentas"
        titulo="Cuentas y efectivo"
        descripcion="Administra las cuentas del portafolio, consulta sus posiciones registradas y revisa el detalle operativo de cada cuenta. El efectivo se mostrará cuando exista una fuente real de saldos."
        acciones={
          <>
            <Link
              className="btn btn--primario"
              to={`${enlaceCuentas}/nueva`}
            >
              <IconoMas />
              Nueva cuenta
            </Link>
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar cuentas y efectivo"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </>
        }
        meta={
          !cargandoInicial && !errorInicial && !noEncontrado ? (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? ' cuenta' : ' cuentas'}
            </span>
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

      {cargandoInicial ? (
        <div className="cuentas-efectivo__layout" aria-hidden="true">
          <FinancialCard
            titulo="Cuentas del portafolio"
            subtitulo="Cargando cuentas…"
          >
            <div className="section-stack">
              <Esqueleto className="esqueleto--titulo" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          </FinancialCard>
          <FinancialCard
            titulo="Detalle de la cuenta"
            subtitulo="Cargando la cuenta seleccionada…"
          >
            <div className="section-stack">
              <Esqueleto className="esqueleto--titulo" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          </FinancialCard>
        </div>
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
          titulo="No se pudieron cargar las cuentas"
          onReintentar={recargar}
        />
      ) : portafolio ? (
        <>
          <section aria-label="Resumen de cuentas y efectivo">
            <div className="metric-grid">
              <MetricCard
                etiqueta="Cuentas registradas"
                valor={cuentas.length}
                icono={<IconoCuenta />}
                ayuda={`Portafolio ${portafolio.nombre}`}
              />
              <MetricCard
                etiqueta="Cuentas activas"
                valor={cuentasActivas}
                tono="positivo"
                icono={<IconoCheck />}
              />
              <MetricCard
                etiqueta="Posiciones del portafolio"
                valor={valorPosicionesPortafolio}
                tono="lavanda"
                icono={<IconoRentaFija />}
                ayuda="Total registrado en el portafolio. No es efectivo ni valor de mercado."
              />
              <MetricCard
                etiqueta="Efectivo disponible"
                valor={<TextoNoDisponible />}
                icono={<IconoLiquidez />}
                ayuda="La API actual no expone saldos de efectivo."
              />
            </div>
          </section>

          <div className="cuentas-efectivo__layout">
            <aside
              className="cuentas-efectivo__lista"
              aria-label="Listado de cuentas"
            >
              <FinancialCard
                titulo="Cuentas del portafolio"
                subtitulo="Selecciona una cuenta para consultar su detalle."
              >
                <div className="section-stack">
                  <div className="cuentas-efectivo__herramientas">
                    <Campo
                      etiqueta="Buscar cuenta"
                      type="search"
                      placeholder="Nombre, institución, tipo o referencia"
                      value={busqueda}
                      onChange={(evento) =>
                        setBusqueda(evento.target.value)
                      }
                    />

                    <FilterBar
                      acciones={
                        hayFiltrosCuentas ? (
                          <Boton
                            variante="fantasma"
                            onClick={limpiarFiltrosCuentas}
                          >
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
                        {instituciones.map((elemento) => (
                          <option key={elemento.id} value={elemento.id}>
                            {elemento.nombre}
                            {!elemento.activo ? ' (inactiva)' : ''}
                          </option>
                        ))}
                      </CampoSelect>

                      <CampoSelect
                        etiqueta="Tipo de cuenta"
                        value={filtroTipo}
                        onChange={(evento) =>
                          setFiltroTipo(evento.target.value)
                        }
                      >
                        <option value="">Todos los tipos</option>
                        {tiposCuenta.map((elemento) => (
                          <option key={elemento.id} value={elemento.id}>
                            {elemento.nombre}
                          </option>
                        ))}
                      </CampoSelect>

                      <CampoSelect
                        etiqueta="Estado de la cuenta"
                        value={filtroEstado}
                        onChange={(evento) =>
                          setFiltroEstado(
                            evento.target.value as FiltroEstado,
                          )
                        }
                      >
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Solo activas</option>
                        <option value="inactivos">Solo inactivas</option>
                      </CampoSelect>
                    </FilterBar>
                  </div>

                  {cuentasFiltradas.length === 0 ? (
                    hayFiltrosCuentas ? (
                      <EmptyState
                        compacta
                        icono={<IconoVacio />}
                        titulo="No hay cuentas con estos filtros"
                        descripcion="Prueba con otra institución, tipo o estado, o limpia los filtros para ver todas las cuentas."
                        accion={
                          <Boton
                            variante="secundario"
                            onClick={limpiarFiltrosCuentas}
                          >
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
                            to={`${enlaceCuentas}/nueva`}
                          >
                            <IconoMas />
                            Registrar cuenta
                          </Link>
                        }
                      />
                    )
                  ) : (
                    <ul
                      className="cuenta-lista"
                      aria-label="Cuentas financieras"
                    >
                      {cuentasFiltradas.map((elemento) => {
                        const institucionElemento = institucionesPorId.get(
                          elemento.institucionId,
                        );
                        const tipoElemento = tiposPorId.get(
                          elemento.tipoCuentaId,
                        );
                        const monedaElemento = monedasPorId.get(
                          elemento.monedaId,
                        );
                        const activa = elemento.id === cuentaId;

                        return (
                          <li key={elemento.id}>
                            <Link
                              className={`cuenta-lista__item ${
                                activa
                                  ? 'cuenta-lista__item--activa'
                                  : ''
                              }`.trim()}
                              to={`${enlaceCuentas}/${encodeURIComponent(
                                elemento.id,
                              )}`}
                              aria-current={activa ? 'page' : undefined}
                              aria-label={`Seleccionar la cuenta ${elemento.nombre}`}
                            >
                              <span
                                className="cuenta-lista__icono"
                                aria-hidden="true"
                              >
                                <IconoCuenta />
                              </span>
                              <span className="cuenta-lista__cuerpo">
                                <span className="cuenta-lista__titulo">
                                  <strong>{elemento.nombre}</strong>
                                  <StatusBadge
                                    estado={
                                      elemento.activo
                                        ? 'activo'
                                        : 'inactivo'
                                    }
                                  >
                                    {elemento.activo
                                      ? 'Activa'
                                      : 'Inactiva'}
                                  </StatusBadge>
                                </span>
                                <span className="cuenta-lista__meta">
                                  <span>
                                    {institucionElemento?.nombre ??
                                      'Institución no disponible'}
                                  </span>
                                  <span>
                                    {tipoElemento?.nombre ??
                                      'Tipo no disponible'}
                                  </span>
                                  <span className="moneda-chip">
                                    {monedaElemento?.codigo ?? '—'}
                                  </span>
                                </span>
                                <span className="cuenta-lista__referencia">
                                  {elemento.numeroCuenta ??
                                    'Sin referencia'}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </FinancialCard>
            </aside>

            <div className="cuentas-efectivo__detalle">
              {!cuentaId ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="Selecciona una cuenta del listado para ver su información."
                >
                  <EmptyState
                    compacta
                    icono={<IconoCuenta />}
                    titulo={
                      cuentas.length === 0
                        ? 'Aún no hay cuentas para mostrar'
                        : 'Selecciona una cuenta'
                    }
                    descripcion={
                      cuentas.length === 0
                        ? 'Crea la primera cuenta del portafolio para consultar su detalle, sus posiciones y las secciones operativas.'
                        : 'Elige una cuenta en el listado para consultar su resumen, movimientos, posiciones, contratos, rendimientos y valuación.'
                    }
                    accion={
                      cuentas.length === 0 ? (
                        <Link
                          className="btn btn--primario"
                          to={`${enlaceCuentas}/nueva`}
                        >
                          <IconoMas />
                          Nueva cuenta
                        </Link>
                      ) : null
                    }
                  />
                </FinancialCard>
              ) : cargandoCuenta ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="Cargando la cuenta seleccionada…"
                >
                  <div className="section-stack" aria-hidden="true">
                    <Esqueleto className="esqueleto--titulo" />
                    <Esqueleto className="esqueleto--linea" />
                    <Esqueleto className="esqueleto--linea" />
                  </div>
                </FinancialCard>
              ) : cuentaNoEncontrada ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="La cuenta solicitada no está disponible."
                >
                  <EmptyState
                    compacta
                    icono={<IconoVacio />}
                    titulo="No encontramos esta cuenta"
                    descripcion="Puede que ya no exista o que no tengas acceso a ella. Elige otra cuenta del listado para continuar."
                    accion={
                      <Link
                        className="btn btn--secundario"
                        to={enlaceCuentas}
                      >
                        Elegir otra cuenta
                      </Link>
                    }
                  />
                </FinancialCard>
              ) : errorCuenta ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="No se pudo consultar la cuenta seleccionada."
                >
                  <ErrorState
                    mensaje={errorCuenta}
                    titulo="No se pudo cargar la cuenta"
                    onReintentar={recargarCuenta}
                  />
                </FinancialCard>
              ) : cuenta ? (
                <FinancialCard
                  id="titulo-detalle-cuenta"
                  titulo="Detalle de la cuenta"
                  subtitulo="Identificación, estado y secciones operativas de la cuenta seleccionada."
                  acciones={
                    <>
                      <Link
                        className="btn btn--secundario"
                        to={`${enlaceCuentas}/${encodeURIComponent(
                          cuenta.id,
                        )}/editar`}
                      >
                        <IconoEditar />
                        Editar
                      </Link>
                      <Boton
                        variante={
                          cuenta.activo ? 'peligro' : 'primario'
                        }
                        onClick={() => {
                          setAviso(null);
                          setErrorEstado(null);
                          setConfirmandoEstado(true);
                        }}
                        disabled={cambiandoEstado}
                      >
                        <IconoPower />
                        {cuenta.activo ? 'Desactivar' : 'Reactivar'}
                      </Boton>
                    </>
                  }
                >
                  <div className="section-stack">
                    <div className="detalle__cabecera">
                      <span
                        className="detalle__icono"
                        aria-hidden="true"
                      >
                        <IconoCuenta />
                      </span>
                      <div className="detalle__titulo">
                        <h3>{cuenta.nombre}</h3>
                        <StatusBadge
                          estado={
                            cuenta.activo ? 'activo' : 'inactivo'
                          }
                        >
                          {cuenta.activo ? 'Activa' : 'Inactiva'}
                        </StatusBadge>
                      </div>
                    </div>

                    <p className="detalle__descripcion">
                      {cuenta.descripcion ?? 'Sin descripción.'}
                    </p>

                    <div
                      className="tabs-cuenta"
                      role="tablist"
                      aria-label="Secciones de la cuenta"
                      onKeyDown={manejarTecladoPestanas}
                    >
                      {PESTANAS.map(({ id, etiqueta, Icono }) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          id={`tab-${id}`}
                          className="tabs-cuenta__tab"
                          aria-selected={pestana === id}
                          aria-controls={`panel-${id}`}
                          tabIndex={pestana === id ? 0 : -1}
                          onClick={() => setPestana(id)}
                        >
                          <Icono />
                          {etiqueta}
                        </button>
                      ))}
                    </div>

                    {PESTANAS.map(({ id }) => (
                      <div
                        key={id}
                        className="cuenta-panel"
                        role="tabpanel"
                        id={`panel-${id}`}
                        aria-labelledby={`tab-${id}`}
                        hidden={pestana !== id}
                      >
                        {pestana === id ? contenidoPestana() : null}
                      </div>
                    ))}
                  </div>
                </FinancialCard>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {cuenta ? (
        <ConfirmationDialog
          abierto={confirmandoEstado}
          titulo={cuenta.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          descripcion={
            cuenta.activo
              ? 'La cuenta dejará de estar activa, pero su historial se conservará. Puedes reactivarla más adelante.'
              : 'La cuenta volverá a estar disponible en el portafolio y podrás usarla de nuevo.'
          }
          textoConfirmar={
            cuenta.activo ? 'Sí, desactivar' : 'Sí, reactivar'
          }
          tono={cuenta.activo ? 'peligro' : 'primario'}
          cargando={cambiandoEstado}
          onConfirmar={() => cambiarEstado(!cuenta.activo)}
          onCancelar={() => {
            if (!cambiandoEstado) {
              setConfirmandoEstado(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
