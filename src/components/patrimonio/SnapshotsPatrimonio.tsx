import { useCallback, useEffect, useState } from 'react';
import type { SnapshotPatrimonio } from '../../api/types';
import {
  crearSnapshotPatrimonio,
  listarSnapshotsPatrimonio,
} from '../../api/patrimonio';
import { useAuth } from '../../auth/AuthContext';
import { formatearImporte } from '../../lib/decimales';
import { esNoAutenticado, mensajeDeError } from '../../lib/errors';
import { formatearFecha, formatearFechaHora } from '../../lib/format';
import { etiquetaCobertura } from '../../lib/patrimonio';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { DataTable, type ColumnaTabla } from '../DataTable';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingState } from '../LoadingState';
import { StatusBadge } from '../StatusBadge';
import { IconoCalendario, IconoMas } from '../icons';

interface SnapshotsPatrimonioProps {
  portafolioId: string | null;
}

function valorOSinDato(valor: string | null, decimales: number): string {
  return valor ? formatearImporte(valor, decimales) : 'No disponible';
}

/**
 * Snapshots manuales del patrimonio.
 *
 * <p>La captura la calcula el backend y es idempotente por portafolio, fecha y
 * moneda. Los campos sin información confiable (efectivo, pasivos, valor de
 * mercado, patrimonio neto) se muestran como «No disponible», nunca como
 * cero.</p>
 */
export function SnapshotsPatrimonio({
  portafolioId,
}: SnapshotsPatrimonioProps) {
  const { marcarSesionExpirada } = useAuth();
  const [snapshots, setSnapshots] = useState<SnapshotPatrimonio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [capturando, setCapturando] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const recargar = useCallback(() => {
    setIntento((valor) => valor + 1);
  }, []);

  useEffect(() => {
    if (!portafolioId) {
      setSnapshots([]);
      setCargando(false);
      setError(null);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    listarSnapshotsPatrimonio(portafolioId)
      .then((datos) => {
        if (!cancelado) {
          setSnapshots(datos);
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
  }, [portafolioId, intento, marcarSesionExpirada]);

  async function capturar() {
    if (!portafolioId || capturando) {
      return;
    }
    setCapturando(true);
    setError(null);
    setMensaje(null);
    try {
      const creados = await crearSnapshotPatrimonio(portafolioId);
      setMensaje(
        creados.length === 1
          ? 'Snapshot capturado. La fotografía de hoy ya está registrada.'
          : `Se capturaron ${creados.length} snapshots, uno por moneda.`,
      );
      setDialogoAbierto(false);
      recargar();
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setError(mensajeDeError(fallo, 'patrimonio'));
    } finally {
      setCapturando(false);
    }
  }

  const columnas: ColumnaTabla<SnapshotPatrimonio>[] = [
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      render: (snapshot) => formatearFecha(snapshot.fecha),
    },
    {
      clave: 'moneda',
      encabezado: 'Moneda',
      render: (snapshot) => (
        <span className="moneda-chip">{snapshot.moneda.codigo}</span>
      ),
    },
    {
      clave: 'capital',
      encabezado: 'Capital invertido',
      alineacion: 'derecha',
      render: (snapshot) =>
        valorOSinDato(
          snapshot.capitalInvertido,
          snapshot.moneda.decimales,
        ),
    },
    {
      clave: 'resultado',
      encabezado: 'Resultado realizado',
      alineacion: 'derecha',
      render: (snapshot) =>
        valorOSinDato(
          snapshot.resultadoRealizado,
          snapshot.moneda.decimales,
        ),
    },
    {
      clave: 'mercado',
      encabezado: 'Valor de mercado',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: (snapshot) =>
        valorOSinDato(snapshot.valorMercado, snapshot.moneda.decimales),
    },
    {
      clave: 'neto',
      encabezado: 'Patrimonio neto',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: (snapshot) =>
        valorOSinDato(snapshot.patrimonioNeto, snapshot.moneda.decimales),
    },
    {
      clave: 'cobertura',
      encabezado: 'Cobertura',
      ocultarEnMovil: true,
      render: (snapshot) => etiquetaCobertura(snapshot.cobertura),
    },
    {
      clave: 'fuente',
      encabezado: 'Fuente',
      render: (snapshot) => (
        <StatusBadge estado="info">{snapshot.fuente}</StatusBadge>
      ),
    },
  ];

  return (
    <div className="snapshots-patrimonio">
      <div className="snapshots-patrimonio__cabecera">
        <div>
          <p className="section-subtitle">
            Fotografías manuales calculadas por el servidor. Repetir la captura
            del mismo día no duplica registros.
          </p>
          {snapshots[0] ? (
            <p className="card-note">
              Última captura: {formatearFechaHora(snapshots[0].fechaCreacion)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn--primario btn--sm"
          onClick={() => setDialogoAbierto(true)}
          disabled={!portafolioId || capturando}
        >
          <IconoMas />
          Capturar snapshot
        </button>
      </div>

      {mensaje ? (
        <div className="alerta alerta--exito" role="status">
          <span className="alerta__texto">{mensaje}</span>
        </div>
      ) : null}

      {!portafolioId ? (
        <EmptyState
          compacta
          icono={<IconoCalendario />}
          titulo="Selecciona un portafolio"
          descripcion="Los snapshots se capturan por portafolio y moneda. Elige un portafolio concreto para consultarlos o crear uno nuevo."
        />
      ) : cargando ? (
        <LoadingState mensaje="Consultando snapshots…" compacto />
      ) : error ? (
        <ErrorState
          mensaje={error}
          titulo="No se pudieron consultar los snapshots"
          onReintentar={recargar}
        />
      ) : (
        <DataTable
          columnas={columnas}
          filas={snapshots}
          obtenerClave={(snapshot) => snapshot.id}
          vacio={
            <EmptyState
              compacta
              icono={<IconoCalendario />}
              titulo="Sin snapshots capturados"
              descripcion="Captura una fotografía para conservar el capital invertido y el resultado realizado del día."
            />
          }
        />
      )}

      <ConfirmationDialog
        abierto={dialogoAbierto}
        titulo="Capturar snapshot patrimonial"
        descripcion="Se guardará una fotografía del patrimonio con la fecha de hoy. Los campos sin fuente confiable quedarán como no disponibles y la operación no duplicará snapshots del mismo día."
        textoConfirmar="Capturar"
        cargando={capturando}
        onConfirmar={capturar}
        onCancelar={() => setDialogoAbierto(false)}
      />
    </div>
  );
}
