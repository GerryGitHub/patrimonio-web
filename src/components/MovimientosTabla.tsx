import type { ReactNode } from 'react';
import type { Movimiento } from '../api/types';
import { formatearCantidad, formatearImporte } from '../lib/decimales';
import { formatearFecha } from '../lib/format';
import {
  esMovimientoRevertible,
  etiquetaTipoMovimiento,
  tonoResultado,
} from '../lib/movimientos';
import { DataTable, type ColumnaTabla } from './DataTable';
import { StatusBadge } from './StatusBadge';

interface MovimientosTablaProps {
  movimientos: Movimiento[];
  cargando?: boolean;
  vacio: ReactNode;
  onVerDetalle: (movimiento: Movimiento) => void;
  onRevertir: (movimiento: Movimiento) => void;
}

function formatearResultado(movimiento: Movimiento): ReactNode {
  const tieneResultado =
    movimiento.tipo === 'VENTA' || movimiento.tipo === 'REVERSION';
  if (!tieneResultado) {
    return '—';
  }
  const tono = tonoResultado(movimiento.resultadoRealizado);
  return (
    <span className={`resultado resultado--${tono}`}>
      {formatearImporte(
        movimiento.resultadoRealizado,
        movimiento.monedaDecimales,
      )}
    </span>
  );
}

/**
 * Historial de movimientos de una posición.
 *
 * <p>El resultado realizado solo aparece en ventas y reversiones. Las
 * cantidades e importes se presentan como saldos, no como valor de mercado.</p>
 */
export function MovimientosTabla({
  movimientos,
  cargando = false,
  vacio,
  onVerDetalle,
  onRevertir,
}: MovimientosTablaProps) {
  const columnas: ColumnaTabla<Movimiento>[] = [
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      render: (movimiento) => formatearFecha(movimiento.fechaOperacion),
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      render: (movimiento) => (
        <span className="movimiento-tipo">
          <strong>{etiquetaTipoMovimiento(movimiento.tipo)}</strong>
          {movimiento.revertido ? (
            <StatusBadge estado="neutral">Revertido</StatusBadge>
          ) : null}
          {movimiento.tipo === 'REVERSION' ? (
            <StatusBadge estado="info">Compensatorio</StatusBadge>
          ) : null}
        </span>
      ),
    },
    {
      clave: 'cantidad',
      encabezado: 'Cantidad',
      alineacion: 'derecha',
      render: (movimiento) => formatearCantidad(movimiento.cantidad),
    },
    {
      clave: 'precio',
      encabezado: 'Precio',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: (movimiento) =>
        formatearImporte(
          movimiento.precioUnitario,
          movimiento.monedaDecimales,
        ),
    },
    {
      clave: 'neto',
      encabezado: 'Importe neto',
      alineacion: 'derecha',
      render: (movimiento) => (
        <>
          {formatearImporte(
            movimiento.importeNeto,
            movimiento.monedaDecimales,
          )}{' '}
          <span className="moneda-chip">{movimiento.monedaCodigo}</span>
        </>
      ),
    },
    {
      clave: 'resultado',
      encabezado: 'Resultado',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: formatearResultado,
    },
    {
      clave: 'saldo',
      encabezado: 'Saldo',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: (movimiento) => (
        <span title="Cantidad resultante tras el movimiento">
          {formatearCantidad(movimiento.cantidadResultante)}
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (movimiento) => (
        <span className="movimiento-acciones">
          <button
            type="button"
            className="btn btn--fantasma btn--sm"
            onClick={() => onVerDetalle(movimiento)}
          >
            Ver
          </button>
          {esMovimientoRevertible(movimiento) ? (
            <button
              type="button"
              className="btn btn--fantasma btn--sm"
              onClick={() => onRevertir(movimiento)}
            >
              Revertir
            </button>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columnas={columnas}
      filas={movimientos}
      obtenerClave={(movimiento) => movimiento.id}
      cargando={cargando}
      esqueleto={
        <div className="tabla-esqueleto" aria-hidden="true">
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
        </div>
      }
      vacio={vacio}
    />
  );
}
