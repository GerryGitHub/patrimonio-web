import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { listarPortafolios } from '../api/portafolios';
import {
  cambiarEstadoPosicion,
  obtenerPosicion,
} from '../api/posiciones';
import type { Portafolio, Posicion } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Alerta, Boton, Esqueleto } from '../components/ui';
import {
  IconoEditar,
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

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

export function PosicionDetailPage() {
  const { portafolioId = '', posicionId = '' } = useParams();
  const location = useLocation();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creada
      ? 'Posición creada correctamente.'
      : estadoNavegacion?.actualizada
        ? 'Cambios guardados correctamente.'
        : null,
  );

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      setNoEncontrado(false);

      try {
        const [portafolios, actual] = await Promise.all([
          listarPortafolios(),
          obtenerPosicion(portafolioId, posicionId),
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

  const enlacePosiciones = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}/posiciones`;

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
            ? `Portafolio ${portafolio.nombre}. El costo total corresponde al costo de adquisición, no al valor de mercado.`
            : 'Detalle de la posición registrada en la cuenta.'
        }
        acciones={
          !cargando && posicion ? (
            <>
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
        <FinancialCard
          id="titulo-detalle-posicion"
          titulo="Detalle de la posición"
          subtitulo="Datos de la cuenta, el instrumento y el costo registrado."
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
                <dt>Cantidad</dt>
                <dd>{formatearCantidad(posicion.cantidad)}</dd>
              </div>
              <div>
                <dt>Costo unitario</dt>
                <dd>
                  {formatearImporte(
                    posicion.costoUnitario,
                    posicion.monedaDecimales,
                  )}{' '}
                  {posicion.monedaCodigo}
                </dd>
              </div>
              <div>
                <dt>Costo total</dt>
                <dd>
                  <strong>
                    {formatearImporte(
                      posicion.costoTotal,
                      posicion.monedaDecimales,
                    )}{' '}
                    {posicion.monedaCodigo}
                  </strong>
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
              El costo total es cantidad × costo unitario y no incluye
              rendimiento ni valuación de mercado. El motor de movimientos
              llegará en una entrega posterior.
            </p>
          </div>
        </FinancialCard>
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
    </div>
  );
}
