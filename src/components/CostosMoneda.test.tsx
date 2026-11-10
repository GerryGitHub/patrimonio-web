import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CostosMoneda } from './CostosMoneda';

describe('CostosMoneda', () => {
  it('muestra el importe vacío cuando no hay costos', () => {
    render(<CostosMoneda costos={[]} />);

    expect(screen.getByText('Sin costo registrado')).toBeInTheDocument();
  });

  it('presenta cada moneda por separado sin sumarlas', () => {
    render(
      <CostosMoneda
        costos={[
          {
            monedaId: 'usd',
            codigo: 'USD',
            nombre: 'Dólar estadounidense',
            simbolo: '$',
            decimales: 2,
            costo: '15365.65',
          },
          {
            monedaId: 'mxn',
            codigo: 'MXN',
            nombre: 'Peso mexicano',
            simbolo: '$',
            decimales: 2,
            costo: '9850.00',
          },
        ]}
      />,
    );

    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('15.365,65')).toBeInTheDocument();
    expect(screen.getByText('MXN')).toBeInTheDocument();
    expect(screen.getByText('9850,00')).toBeInTheDocument();
  });

  it('permite personalizar el mensaje vacío', () => {
    render(<CostosMoneda costos={[]} vacio="Sin posiciones" />);

    expect(screen.getByText('Sin posiciones')).toBeInTheDocument();
  });
});
