import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RegistrarMovimientoForm } from './RegistrarMovimientoForm';

function renderFormulario(
  props: Partial<ComponentProps<typeof RegistrarMovimientoForm>> = {},
) {
  const onRegistrar = vi.fn().mockResolvedValue(true);
  render(
    <RegistrarMovimientoForm
      monedaCodigo="USD"
      monedaDecimales={2}
      cantidadActual="5.0000000000"
      costoUnitarioActual="20.00000000"
      costoTotalActual="100.0000000000"
      activa
      enviando={false}
      errorServidor={null}
      onCancelar={vi.fn()}
      onRegistrar={onRegistrar}
      {...props}
    />,
  );
  return { onRegistrar };
}

describe('RegistrarMovimientoForm', () => {
  it('valida cantidad y precio antes de enviar', async () => {
    const usuario = userEvent.setup();
    const { onRegistrar } = renderFormulario();

    await usuario.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    );

    expect(screen.getByText('Escribe la cantidad.')).toBeInTheDocument();
    expect(screen.getByText('Escribe el precio unitario.')).toBeInTheDocument();
    expect(onRegistrar).not.toHaveBeenCalled();
  });

  it('avisa cuando una venta supera la cantidad disponible', async () => {
    const usuario = userEvent.setup();
    renderFormulario();

    await usuario.selectOptions(
      screen.getByLabelText(/Tipo de movimiento/),
      'VENTA',
    );
    await usuario.type(screen.getByLabelText(/Cantidad/), '10');

    expect(
      screen.getByText(/La cantidad supera las 5 unidades disponibles/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    ).toBeDisabled();
  });

  it('calcula la vista previa y envía la compra con CSRF e idempotencia', async () => {
    const usuario = userEvent.setup();
    const { onRegistrar } = renderFormulario();

    await usuario.type(screen.getByLabelText(/Cantidad/), '2');
    await usuario.type(screen.getByLabelText(/Precio unitario/), '20');
    const comisiones = screen.getByLabelText('Comisiones');
    await usuario.clear(comisiones);
    await usuario.type(comisiones, '1');

    expect(screen.getByText('40,00 USD')).toBeInTheDocument();
    expect(screen.getByText('41,00 USD')).toBeInTheDocument();

    await usuario.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    );

    expect(onRegistrar).toHaveBeenCalledTimes(1);
    expect(onRegistrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'COMPRA',
        cantidad: '2',
        precioUnitario: '20',
        comisiones: '1',
        impuestos: '0',
        claveIdempotencia: expect.any(String),
      }),
    );
  });

  it('exige el costo explícito en los ajustes', async () => {
    const usuario = userEvent.setup();
    const { onRegistrar } = renderFormulario();

    await usuario.selectOptions(
      screen.getByLabelText(/Tipo de movimiento/),
      'AJUSTE_POSITIVO',
    );
    await usuario.type(screen.getByLabelText(/Cantidad/), '1');
    await usuario.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    );

    expect(screen.getByText('Indica el costo total del ajuste.')).toBeInTheDocument();
    expect(onRegistrar).not.toHaveBeenCalled();
  });

  it('muestra el error del servidor y bloquea el envío con la posición inactiva', () => {
    renderFormulario({
      activa: false,
      errorServidor: 'La posición está inactiva y no admite movimientos.',
    });

    expect(
      screen.getAllByText(/La posición está inactiva y no admite movimientos/),
    ).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    ).toBeDisabled();
  });
});
