import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ImportesMoneda } from './ImportesMoneda';
import { importe, MONEDA_USD } from '../../test/fixtures/patrimonio';

const MONEDA_EUR = {
  ...MONEDA_USD,
  id: 'moneda-eur',
  codigo: 'EUR',
  nombre: 'Euro',
  simbolo: '€',
};

describe('ImportesMoneda', () => {
  it('presenta cada divisa con su código sin sumarlas', () => {
    render(
      <ImportesMoneda
        importes={[importe('1500.00'), importe('900.50', MONEDA_EUR)]}
      />,
    );

    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('EUR')).toBeInTheDocument();
    expect(screen.getByText(/1500,00/)).toBeInTheDocument();
    expect(screen.getByText(/900,50/)).toBeInTheDocument();
  });

  it('muestra el texto vacío cuando no hay importes', () => {
    render(<ImportesMoneda importes={[]} vacio="Sin datos" />);

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('colorea el signo solo cuando se solicita', () => {
    const { rerender } = render(
      <ImportesMoneda importes={[importe('-12.50')]} />,
    );

    expect(screen.getByText(/-12,50/)).not.toHaveClass('resultado--negativo');

    rerender(
      <ImportesMoneda importes={[importe('-12.50')]} colorearSigno />,
    );

    expect(screen.getByText(/-12,50/)).toHaveClass('resultado--negativo');
  });
});
