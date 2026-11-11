import { useEffect, useId } from 'react';
import type { Movimiento } from '../api/types';
import { formatearCantidad, formatearImporte } from '../lib/decimales';
import { formatearFecha, formatearFechaHora } from '../lib/format';
import { etiquetaTipoMovimiento } from '../lib/movimientos';
import { StatusBadge } from './StatusBadge';
import { IconoCerrar } from './icons';

interface MovimientoDetalleDialogProps {
  movimiento: Movimiento | null;
  onCerrar: () => void;
}

/**
 * Detalle completo e inmutable de un movimiento confirmado.
 *
 * <p>Los importes derivados se muestran tal como los calculó el motor. La
 * reversión no edita este registro: crea un movimiento compensatorio.</p>
 */
export function MovimientoDetalleDialog({
  movimiento,
  onCerrar,
}: MovimientoDetalleDialogProps) {
  const tituloId = useId();

  useEffect(() => {
    if (!movimiento) {
      return;
    }
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [movimiento, onCerrar]);

  if (!movimiento) {
    return null;
  }

  const importe = (valor: string) =>
    formatearImporte(valor, movimiento.monedaDecimales);

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar();
        }
      }}
    >
      <div
        className="dialog dialog--ancho"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="dialog__header">
          <h2 className="dialog__title" id={tituloId}>
            Movimiento · {etiquetaTipoMovimiento(movimiento.tipo)}
          </h2>
          <button
            type="button"
            className="icon-button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className="dialog__body">
          <div className="detalle__cabecera">
            <div className="detalle__titulo">
              <h3>
                {movimiento.instrumentoNombre}
                {movimiento.instrumentoSimbolo ? (
                  <span className="instrumento-simbolo">
                    {movimiento.instrumentoSimbolo}
                  </span>
                ) : null}
              </h3>
              <StatusBadge estado={movimiento.revertido ? 'neutral' : 'activo'}>
                {movimiento.revertido ? 'Revertido' : 'Confirmado'}
              </StatusBadge>
            </div>
          </div>

          <dl className="detalle__datos">
            <div>
              <dt>Cuenta</dt>
              <dd>{movimiento.cuentaNombre}</dd>
            </div>
            <div>
              <dt>Fecha de operación</dt>
              <dd>{formatearFecha(movimiento.fechaOperacion)}</dd>
            </div>
            <div>
              <dt>Fecha de liquidación</dt>
              <dd>{formatearFecha(movimiento.fechaLiquidacion)}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{formatearCantidad(movimiento.cantidad)}</dd>
            </div>
            <div>
              <dt>Precio unitario</dt>
              <dd>
                {importe(movimiento.precioUnitario)} {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Importe bruto</dt>
              <dd>
                {importe(movimiento.importeBruto)} {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Comisiones</dt>
              <dd>
                {importe(movimiento.comisiones)} {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Impuestos y gastos</dt>
              <dd>
                {importe(movimiento.impuestos)} {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Importe neto</dt>
              <dd>
                <strong>
                  {importe(movimiento.importeNeto)}{' '}
                  {movimiento.monedaCodigo}
                </strong>
              </dd>
            </div>
            <div>
              <dt>Costo aplicado</dt>
              <dd>
                {importe(movimiento.costoAplicado)}{' '}
                {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Resultado realizado</dt>
              <dd>{importe(movimiento.resultadoRealizado)}</dd>
            </div>
            <div>
              <dt>Tipo de cambio</dt>
              <dd>{movimiento.tipoCambio}</dd>
            </div>
            <div>
              <dt>Saldo tras el movimiento</dt>
              <dd>
                {formatearCantidad(movimiento.cantidadResultante)} ·{' '}
                {importe(movimiento.costoResultante)}{' '}
                {movimiento.monedaCodigo}
              </dd>
            </div>
            <div>
              <dt>Moneda</dt>
              <dd>
                {movimiento.monedaCodigo} · {movimiento.monedaNombre}
              </dd>
            </div>
            <div>
              <dt>Observaciones</dt>
              <dd>{movimiento.observaciones ?? 'Sin observaciones.'}</dd>
            </div>
            <div>
              <dt>Registrado</dt>
              <dd>{formatearFechaHora(movimiento.fechaCreacion)}</dd>
            </div>
            {movimiento.movimientoOrigenId ? (
              <div>
                <dt>Movimiento original</dt>
                <dd className="dato-id">{movimiento.movimientoOrigenId}</dd>
              </div>
            ) : null}
            <div>
              <dt>Identificador</dt>
              <dd className="dato-id">{movimiento.id}</dd>
            </div>
          </dl>

          <p className="card-note">
            Los movimientos confirmados son inmutables. Una corrección se
            registra como un movimiento compensatorio y queda vinculada al
            original.
          </p>
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
