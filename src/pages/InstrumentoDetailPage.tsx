import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  cambiarEstadoInstrumento,
  obtenerInstrumento,
} from '../api/instrumentos';
import type { Instrumento } from '../api/types';
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
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFechaHora } from '../lib/format';

interface EstadoNavegacion {
  creado?: boolean;
  actualizado?: boolean;
}

export function InstrumentoDetailPage() {
  const { instrumentoId = '' } = useParams();
  const location = useLocation();
  const { marcarSesionExpirada } = useAuth();

  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creado
      ? 'Instrumento creado correctamente.'
      : estadoNavegacion?.actualizado
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
        const actual = await obtenerInstrumento(instrumentoId);
        if (!cancelado) {
          setInstrumento(actual);
        }
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
        setError(mensajeDeError(fallo, 'instrumento'));
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
  }, [instrumentoId, intento, marcarSesionExpirada]);

  async function cambiarEstado(nuevoActivo: boolean) {
    setCambiandoEstado(true);
    setErrorEstado(null);

    try {
      const actualizado = await cambiarEstadoInstrumento(
        instrumentoId,
        nuevoActivo,
      );
      setInstrumento(actualizado);
      setConfirmandoEstado(false);
      setAviso(
        nuevoActivo
          ? 'Instrumento reactivado correctamente.'
          : 'Instrumento desactivado correctamente. Sus posiciones se conservan.',
      );
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEstado(mensajeDeError(fallo, 'instrumento'));
    } finally {
      setCambiandoEstado(false);
    }
  }

  return (
    <div className="page">
      <Link className="volver" to="/instrumentos">
        <IconoVolver />
        Volver al catálogo
      </Link>

      <PageHeader
        eyebrow="Catálogo global · Instrumento"
        titulo={
          cargando
            ? 'Cargando instrumento…'
            : noEncontrado
              ? 'Instrumento no encontrado'
              : (instrumento?.nombre ?? 'Instrumento financiero')
        }
        descripcion="El catálogo es compartido por todos los usuarios. Un instrumento puede formar parte de posiciones en varias cuentas."
        acciones={
          !cargando && instrumento ? (
            <>
              <Link
                className="btn btn--secundario"
                to={`/instrumentos/${encodeURIComponent(
                  instrumento.id,
                )}/editar`}
              >
                <IconoEditar />
                Editar
              </Link>
              <Boton
                variante={instrumento.activo ? 'peligro' : 'primario'}
                onClick={() => {
                  setAviso(null);
                  setErrorEstado(null);
                  setConfirmandoEstado(true);
                }}
                disabled={cambiandoEstado}
              >
                <IconoPower />
                {instrumento.activo ? 'Desactivar' : 'Reactivar'}
              </Boton>
            </>
          ) : null
        }
        meta={
          !cargando && instrumento ? (
            <StatusBadge estado={instrumento.activo ? 'activo' : 'inactivo'}>
              {instrumento.activo ? 'Instrumento activo' : 'Instrumento inactivo'}
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
          titulo="Detalle del instrumento"
          subtitulo="Cargando información del catálogo…"
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
          titulo="No encontramos este instrumento"
          descripcion="Puede que ya no exista en el catálogo. Vuelve al catálogo para consultar los instrumentos disponibles."
          accion={
            <Link className="btn btn--secundario" to="/instrumentos">
              Volver al catálogo
            </Link>
          }
        />
      ) : error ? (
        <ErrorState
          mensaje={error}
          titulo="No se pudo cargar el instrumento"
          onReintentar={recargar}
        />
      ) : instrumento ? (
        <FinancialCard
          id="titulo-detalle-instrumento"
          titulo="Detalle del instrumento"
          subtitulo="Datos de identificación, clasificación y estado dentro del catálogo global."
          acciones={
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar instrumento"
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
                  {instrumento.nombre}
                  {instrumento.simbolo ? (
                    <span className="instrumento-simbolo">
                      {instrumento.simbolo}
                    </span>
                  ) : null}
                </h3>
                <StatusBadge estado={instrumento.activo ? 'activo' : 'inactivo'}>
                  {instrumento.activo ? 'Activo' : 'Inactivo'}
                </StatusBadge>
              </div>
            </div>

            <p className="detalle__descripcion">
              {instrumento.descripcion ?? 'Sin descripción.'}
            </p>

            <dl className="detalle__datos">
              <div>
                <dt>Categoría</dt>
                <dd>{instrumento.claseActivoNombre}</dd>
              </div>
              <div>
                <dt>Tipo de instrumento</dt>
                <dd>{instrumento.tipoInstrumentoNombre}</dd>
              </div>
              <div>
                <dt>Emisor</dt>
                <dd>{instrumento.emisor ?? 'No registrado'}</dd>
              </div>
              <div>
                <dt>Mercado</dt>
                <dd>{instrumento.mercado ?? 'No registrado'}</dd>
              </div>
              <div>
                <dt>Moneda</dt>
                <dd>
                  {instrumento.monedaCodigo} · {instrumento.monedaNombre}
                </dd>
              </div>
              <div>
                <dt>ISIN</dt>
                <dd className="dato-id">{instrumento.isin ?? 'No registrado'}</dd>
              </div>
              <div>
                <dt>Identificador externo</dt>
                <dd className="dato-id">
                  {instrumento.identificadorExterno ?? 'No registrado'}
                </dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{instrumento.activo ? 'Activo' : 'Inactivo'}</dd>
              </div>
              <div>
                <dt>Creado</dt>
                <dd>{formatearFechaHora(instrumento.fechaCreacion)}</dd>
              </div>
              <div>
                <dt>Actualizado</dt>
                <dd>{formatearFechaHora(instrumento.fechaActualizacion)}</dd>
              </div>
              <div>
                <dt>Identificador</dt>
                <dd className="dato-id">{instrumento.id}</dd>
              </div>
            </dl>
          </div>
        </FinancialCard>
      ) : null}

      {instrumento ? (
        <ConfirmationDialog
          abierto={confirmandoEstado}
          titulo={
            instrumento.activo ? 'Desactivar instrumento' : 'Reactivar instrumento'
          }
          descripcion={
            instrumento.activo
              ? 'El instrumento dejará de estar disponible para nuevas posiciones. Las posiciones existentes se conservan y no se modifican.'
              : 'El instrumento volverá a estar disponible para registrar posiciones en tus cuentas.'
          }
          textoConfirmar={
            instrumento.activo ? 'Sí, desactivar' : 'Sí, reactivar'
          }
          tono={instrumento.activo ? 'peligro' : 'primario'}
          cargando={cambiandoEstado}
          onConfirmar={() => cambiarEstado(!instrumento.activo)}
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
