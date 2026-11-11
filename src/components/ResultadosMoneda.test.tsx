import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultadosMoneda } from './ResultadosMoneda';

describe('ResultadosMoneda', () => {
  it('muestra el mensaje vacío cuando no hay resultados', () => {
    render(<ResultadosMoneda resultados={[]} />);

    expect(screen.getByText('Sin resultados realizados')).toBeInTheDocument();
  });

  it('presenta cada moneda con su signo sin sumarlas', () => {
    render(
      <ResultadosMoneda
        resultados={[
          {
            monedaId: 'usd',
            codigo: 'USD',
            nombre: 'Dólar estadounidense',
            simbolo: '$',
            decimales: 2,
            resultado: '125.5',
          },
          {
            monedaId: 'mxn',
            codigo: 'MXN',
            nombre: 'Peso mexicano',
            simbolo: '$',
            decimales: 2,
            resultado: '-40',
          },
        ]}
      />,
    );

    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('125,50')).toHaveClass('resultado--positivo');
    expect(screen.getByText('MXN')).toBeInTheDocument();
    expect(screen.getByText('-40,00')).toHaveClass('resultado--negativo');
  });
});
