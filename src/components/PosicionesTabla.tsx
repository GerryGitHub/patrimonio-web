import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Posicion } from '../api/types';
import { formatearCantidad, formatearImporte } from '../lib/decimales';
import { formatearFecha } from '../lib/format';
import { DataTable, type ColumnaTabla } from './DataTable';
import { StatusBadge } from './StatusBadge';

interface PosicionesTablaProps {
  portafolioId: string;
  posiciones: Posicion[];
  cargando?: boolean;
  vacio: ReactNode;
  portafolioIdDe?: (posicion: Posicion) => string;
}

function rutaDetalle(portafolioId: string, posicionId: string): string {
  return `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}/posiciones/${encodeURIComponent(posicionId)}`;
}

/**
 * Tabla compartida por el listado de posiciones y las categorías de activos.
 *
 * <p>El costo total se presenta como {@code cantidad × costo unitario}. No es
 * valor de mercado y no incluye rendimiento.</p>
 */
export function PosicionesTabla({
  portafolioId,
  posiciones,
  cargando = false,
  vacio,
  portafolioIdDe,
}: PosicionesTablaProps) {
  function portafolioDe(posicion: Posicion): string {
    return portafolioIdDe ? portafolioIdDe(posicion) : portafolioId;
  }

  const columnas: ColumnaTabla<Posicion>[] = [
    {
      clave: 'instrumento',
      encabezado: 'Instrumento',
      render: (posicion) => (
        <Link
          className="data-table__celda-principal"
          to={rutaDetalle(portafolioDe(posicion), posicion.id)}
          aria-label={`Ver la posición de ${posicion.instrumentoNombre}`}
        >
          <span>
            <strong>{posicion.instrumentoNombre}</strong>
            <small>
              {posicion.instrumentoSimbolo ?? 'Sin símbolo'} ·{' '}
              {posicion.claseActivoNombre}
            </small>
          </span>
        </Link>
      ),
    },
    {
      clave: 'cuenta',
      encabezado: 'Cuenta',
      ocultarEnMovil: true,
      render: (posicion) => posicion.cuentaNombre,
    },
    {
      clave: 'cantidad',
      encabezado: 'Cantidad',
      alineacion: 'derecha',
      render: (posicion) => formatearCantidad(posicion.cantidad),
    },
    {
      clave: 'costoUnitario',
      encabezado: 'Costo unitario',
      alineacion: 'derecha',
      ocultarEnMovil: true,
      render: (posicion) =>
        formatearImporte(posicion.costoUnitario, posicion.monedaDecimales),
    },
    {
      clave: 'costoTotal',
      encabezado: 'Costo total',
      alineacion: 'derecha',
      render: (posicion) => (
        <strong>
          {formatearImporte(posicion.costoTotal, posicion.monedaDecimales)}
        </strong>
      ),
    },
    {
      clave: 'moneda',
      encabezado: 'Moneda',
      render: (posicion) => (
        <span className="moneda-chip">{posicion.monedaCodigo}</span>
      ),
    },
    {
      clave: 'apertura',
      encabezado: 'Apertura',
      ocultarEnMovil: true,
      render: (posicion) => formatearFecha(posicion.fechaApertura),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (posicion) => (
        <StatusBadge estado={posicion.activo ? 'activo' : 'inactivo'}>
          {posicion.activo ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (posicion) => (
        <Link
          className="btn btn--fantasma btn--sm"
          to={rutaDetalle(portafolioDe(posicion), posicion.id)}
        >
          Ver
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columnas={columnas}
      filas={posiciones}
      obtenerClave={(posicion) => posicion.id}
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
