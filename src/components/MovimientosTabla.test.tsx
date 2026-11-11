import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Movimiento } from '../api/types';
import { MovimientosTabla } from './MovimientosTabla';

function movimiento(parcial: Partial<Movimiento>): Movimiento {
  return {
    id: 'movimiento-1',
    portafolioId: 'portafolio-1',
    cuentaId: 'cuenta-1',
    cuentaNombre: 'Cuenta de corretaje',
    posicionId: 'posicion-1',
    instrumentoId: 'instrumento-1',
    instrumentoNombre: 'Apple Inc.',
    instrumentoSimbolo: 'AAPL',
    tipo: 'COMPRA',
    tipoNombre: 'Compra',
    fechaOperacion: '2026-01-10',
    fechaLiquidacion: null,
    cantidad: '2.0000000000',
    precioUnitario: '20.00000000',
    importeBruto: '40.0000000000',
    comisiones: '0.0000000000',
    impuestos: '0.0000000000',
    monedaId: 'usd',
    monedaCodigo: 'USD',
    monedaNombre: 'Dólar estadounidense',
    monedaSimbolo: '$',
    monedaDecimales: 2,
    tipoCambio: '1.0000000000',
    importeNeto: '40.0000000000',
    costoAplicado: '0.0000000000',
    resultadoRealizado: '0.0000000000',
    cantidadResultante: '2.0000000000',
    costoResultante: '40.0000000000',
    estado: 'CONFIRMADO',
    usuarioId: 'usuario-1',
    movimientoOrigenId: null,
    revertido: false,
    observaciones: null,
    fechaCreacion: '2026-01-10T10:00:00Z',
    ...parcial,
  };
}

describe('MovimientosTabla', () => {
  it('muestra el tipo y el resultado realizado de una venta', () => {
    render(
      <MovimientosTabla
        movimientos={[
          movimiento({
            tipo: 'VENTA',
            resultadoRealizado: '125.5000000000',
          }),
        ]}
        vacio={<p>Sin movimientos</p>}
        onVerDetalle={vi.fn()}
        onRevertir={vi.fn()}
      />,
    );

    expect(screen.getByText('Venta')).toBeInTheDocument();
    expect(screen.getByText('125,50')).toBeInTheDocument();
  });

  it('no ofrece revertir una reversión ni un movimiento ya revertido', () => {
    render(
      <MovimientosTabla
        movimientos={[
          movimiento({ id: 'a', tipo: 'REVERSION' }),
          movimiento({ id: 'b', revertido: true }),
        ]}
        vacio={<p>Sin movimientos</p>}
        onVerDetalle={vi.fn()}
        onRevertir={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Ver' })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Revertir' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Revertido').length).toBeGreaterThan(0);
  });

  it('invoca los manejadores de detalle y reversión', async () => {
    const usuario = userEvent.setup();
    const onVerDetalle = vi.fn();
    const onRevertir = vi.fn();
    const fila = movimiento({});

    render(
      <MovimientosTabla
        movimientos={[fila]}
        vacio={<p>Sin movimientos</p>}
        onVerDetalle={onVerDetalle}
        onRevertir={onRevertir}
      />,
    );

    await usuario.click(screen.getByRole('button', { name: 'Ver' }));
    await usuario.click(screen.getByRole('button', { name: 'Revertir' }));

    expect(onVerDetalle).toHaveBeenCalledWith(fila);
    expect(onRevertir).toHaveBeenCalledWith(fila);
  });

  it('muestra el estado vacío', () => {
    render(
      <MovimientosTabla
        movimientos={[]}
        vacio={<p>Sin movimientos</p>}
        onVerDetalle={vi.fn()}
        onRevertir={vi.fn()}
      />,
    );

    expect(screen.getByText('Sin movimientos')).toBeInTheDocument();
  });
});
