import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DistribucionPatrimonio } from './DistribucionPatrimonio';
import { crearCentroPatrimonio } from '../../test/fixtures/patrimonio';

describe('DistribucionPatrimonio', () => {
  it('dibuja un donut por moneda con leyenda y porcentajes', () => {
    const { distribucion } = crearCentroPatrimonio();

    render(<DistribucionPatrimonio distribucion={distribucion} />);

    expect(
      screen.getByRole('img', { name: /Distribución en USD/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Acciones y ETFs')).toBeInTheDocument();
    expect(screen.getByText('Renta fija')).toBeInTheDocument();
    expect(screen.getAllByText(/66,67 %/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/33,33 %/).length).toBeGreaterThan(0);
  });

  it('explica la ausencia de distribución sin inventar segmentos', () => {
    const { distribucion } = crearCentroPatrimonio();
    const vacia = {
      ...distribucion,
      porMoneda: [],
      limitaciones: ['No hay posiciones activas registradas para distribuir.'],
    };

    render(<DistribucionPatrimonio distribucion={vacia} />);

    expect(
      screen.getByText('Sin distribución disponible'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No hay posiciones activas registradas para distribuir.'),
    ).toBeInTheDocument();
  });
});
