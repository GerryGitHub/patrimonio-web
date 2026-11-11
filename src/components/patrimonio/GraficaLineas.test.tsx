import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GraficaLineas, type SerieLinea } from './GraficaLineas';
import { MONEDA_USD } from '../../test/fixtures/patrimonio';

const SERIES: SerieLinea[] = [
  {
    clave: 'COSTO_ADQUISICION',
    etiqueta: 'Costo de adquisición vigente',
    color: 'var(--color-primary)',
    puntos: [
      { fecha: '2026-01-01', valor: '1000.00' },
      { fecha: '2026-01-15', valor: '1200.00' },
      { fecha: '2026-02-01', valor: '1500.00' },
    ],
  },
  {
    clave: 'RESULTADO_REALIZADO',
    etiqueta: 'Resultado realizado acumulado',
    color: 'var(--color-lavender)',
    puntos: [
      { fecha: '2026-01-01', valor: '0.00' },
      { fecha: '2026-01-15', valor: '120.00' },
      { fecha: '2026-02-01', valor: '250.00' },
    ],
  },
];

describe('GraficaLineas', () => {
  it('genera una gráfica SVG accesible con un punto por fecha y serie', () => {
    const { container } = render(
      <GraficaLineas
        series={SERIES}
        moneda={MONEDA_USD}
        ariaLabel="Evolución del portafolio en USD"
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Evolución del portafolio en USD' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(6);
    expect(container.querySelectorAll('path')).toHaveLength(3);
    expect(screen.getAllByText(/1500,00 USD/).length).toBeGreaterThan(0);
  });

  it('no dibuja nada cuando no hay puntos', () => {
    const { container } = render(
      <GraficaLineas
        series={[{ ...SERIES[0]!, puntos: [] }]}
        moneda={MONEDA_USD}
        ariaLabel="Sin datos"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
