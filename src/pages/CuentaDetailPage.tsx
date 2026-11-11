import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  cambiarEstadoCuenta,
  listarTiposCuenta,
  obtenerCuenta,
} from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import { listarPosiciones } from '../api/posiciones';
import type {
  CostoPorMoneda,
  CuentaFinanciera,
  Institucion,
  Moneda,
  Portafolio,
  Posicion,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { CostosMoneda } from '../components/CostosMoneda';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { PosicionesTabla } from '../components/PosicionesTabla';
import { StatusBadge } from '../components/StatusBadge';
import { Alerta, Boton, Esqueleto } from '../components/ui';
import {
  IconoCuenta,
  IconoEditar,
  IconoMas,
  IconoPower,
  IconoRecargar,
  IconoRentaFija,
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

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

export function CuentaDetailPage() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  const location = useLocation();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuenta, setCuenta] = useState<CuentaFinanciera | null>(null);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargandoPosiciones, setCargandoPosiciones] = useState(false);
  const [errorPosiciones, setErrorPosiciones] = useState<string | null>(null);
  const [intentoPosiciones, setIntentoPosiciones] = useState(0);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creada
      ? 'Cuenta creada correctamente.'
      : estadoNavegacion?.actualizada
        ? 'Cambios guardados correctamente.'
        : null,
  );

  const recargar = useCallback(() => {
    setIntento((valor) => valor + 1);
    setIntentoPosiciones((valor) => valor + 1);
  }, []);

  const recargarPosiciones = useCallback(
    () => setIntentoPosiciones((valor) => valor + 1),
    [],
  );

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      setNoEncontrado(false);

      try {
        const [
          portafolios,
          cuentaActual,
          catalogoInstituciones,
          catalogoTipos,
          catalogoMonedas,
        ] = await Promise.all([
          listarPortafolios(),
          obtenerCuenta(portafolioId, cuentaId),
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
        setCuenta(cuentaActual);
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
        setError(mensajeDeError(fallo, 'cuenta'));
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
  }, [portafolioId, cuentaId, intento, marcarSesionExpirada]);

  const cuentaLista = cuenta !== null;

  useEffect(() => {
    if (!cuentaLista) {
      return;
    }

    let cancelado = false;

    async function cargarPosicionesDeCuenta() {
      setCargandoPosiciones(true);
      setErrorPosiciones(null);

      try {
        const registradas = await listarPosiciones(portafolioId, { cuentaId });

        if (cancelado) {
          return;
        }

        // El backend ya filtra por cuenta. Se vuelve a comprobar para no
        // mostrar posiciones ajenas si la respuesta llegara mezclada.
        setPosiciones(
          registradas.filter((posicion) => posicion.cuentaId === cuentaId),
        );
      } catch (fallo) {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorPosiciones(mensajeDeError(fallo, 'posicion'));
      } finally {
        if (!cancelado) {
          setCargandoPosiciones(false);
        }
      }
    }

    cargarPosicionesDeCuenta();

    return () => {
      cancelado = true;
    };
  }, [
    cuentaLista,
    portafolioId,
    cuentaId,
    intentoPosiciones,
    marcarSesionExpirada,
  ]);

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

  const institucion = instituciones.find(
    (elemento) => elemento.id === cuenta?.institucionId,
  );
  const tipoCuenta = tiposCuenta.find(
    (elemento) => elemento.id === cuenta?.tipoCuentaId,
  );
  const moneda = monedas.find((elemento) => elemento.id === cuenta?.monedaId);
  const enlacePortafolio = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}`;

  const resumenPosiciones = useMemo(() => {
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

  return (
    <div className="page">
      <Link className="volver" to={enlacePortafolio}>
        <IconoVolver />
        Volver al portafolio
      </Link>

      <PageHeader
        eyebrow="Mis activos · Cuenta financiera"
        titulo={
          cargando
            ? 'Cargando cuenta…'
            : noEncontrado
              ? 'Cuenta no encontrada'
              : (cuenta?.nombre ?? 'Cuenta financiera')
        }
        descripcion={
          portafolio
            ? `Portafolio ${portafolio.nombre}. La referencia bancaria se muestra enmascarada.`
            : 'Detalle de la cuenta financiera.'
        }
        acciones={
          !cargando && cuenta ? (
            <>
              <Link
                className="btn btn--secundario"
                to={`${enlacePortafolio}/cuentas/${encodeURIComponent(
                  cuenta.id,
                )}/editar`}
              >
                <IconoEditar />
                Editar
              </Link>
              <Boton
                variante={cuenta.activo ? 'peligro' : 'primario'}
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
          ) : null
        }
        meta={
          !cargando && cuenta ? (
            <StatusBadge estado={cuenta.activo ? 'activo' : 'inactivo'}>
              {cuenta.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
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

      {cargando ? (
        <FinancialCard
          titulo="Detalle de la cuenta"
          subtitulo="Cargando información de la cuenta…"
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
          titulo="No encontramos esta cuenta"
          descripcion="Puede que ya no exista o que no tengas acceso a ella. Vuelve al portafolio para consultar sus cuentas."
          accion={
            <Link className="btn btn--secundario" to={enlacePortafolio}>
              Volver al portafolio
            </Link>
          }
        />
      ) : error ? (
        <ErrorState
          mensaje={error}
          titulo="No se pudo cargar la cuenta"
          onReintentar={recargar}
        />
      ) : cuenta ? (
        <FinancialCard
          id="titulo-detalle-cuenta"
          titulo="Detalle de la cuenta"
          subtitulo="Datos de identificación y estado. La referencia completa nunca se devuelve por la API."
          acciones={
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar cuenta"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          }
        >
          <div className="section-stack">
            <div className="detalle__cabecera">
              <span className="detalle__icono" aria-hidden="true">
                <IconoCuenta />
              </span>
              <div className="detalle__titulo">
                <h3>{cuenta.nombre}</h3>
                <StatusBadge estado={cuenta.activo ? 'activo' : 'inactivo'}>
                  {cuenta.activo ? 'Activa' : 'Inactiva'}
                </StatusBadge>
              </div>
            </div>

            <p className="detalle__descripcion">
              {cuenta.descripcion ?? 'Sin descripción.'}
            </p>

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
          </div>
        </FinancialCard>
      ) : null}

      {cuenta ? (
        <FinancialCard
          id="titulo-posiciones-cuenta"
          titulo="Posiciones de inversión"
          subtitulo="Posiciones registradas en esta cuenta. El costo es el registrado y no representa valor de mercado."
          acciones={
            <>
              <Boton
                variante="secundario"
                onClick={recargarPosiciones}
                disabled={cargandoPosiciones}
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
            </>
          }
          pie="El costo agregado se muestra por moneda. No se suman monedas distintas ni se convierten divisas."
        >
          {cargandoPosiciones ? (
            <div className="section-stack" aria-hidden="true">
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          ) : errorPosiciones ? (
            <ErrorState
              mensaje={errorPosiciones}
              titulo="No se pudieron consultar las posiciones"
              onReintentar={recargarPosiciones}
            />
          ) : resumenPosiciones.total === 0 ? (
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
          ) : (
            <div className="section-stack">
              <div className="metric-grid">
                <MetricCard
                  etiqueta="Posiciones"
                  valor={resumenPosiciones.total}
                />
                <MetricCard
                  etiqueta="Activas"
                  valor={resumenPosiciones.activas}
                  tono="positivo"
                />
                <MetricCard
                  etiqueta="Inactivas"
                  valor={resumenPosiciones.inactivas}
                  tono="lavanda"
                />
                <MetricCard
                  etiqueta="Costo por moneda"
                  valor={
                    <CostosMoneda
                      costos={resumenPosiciones.costoPorMoneda}
                      compacto
                      vacio="Sin costo"
                    />
                  }
                />
              </div>

              <PosicionesTabla
                portafolioId={portafolioId}
                posiciones={posiciones}
                vacio="Esta cuenta no tiene posiciones."
              />
            </div>
          )}
        </FinancialCard>
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
