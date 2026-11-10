import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Posicion } from '../api/types';
import { PosicionesTabla } from './PosicionesTabla';

const posicion: Posicion = {
  id: 'posicion-1',
  cuentaId: 'cuenta-1',
  cuentaNombre: 'Cuenta de corretaje',
  instrumentoId: 'instrumento-1',
  instrumentoNombre: 'Apple Inc.',
  instrumentoSimbolo: 'AAPL',
  tipoInstrumentoId: 'tipo-1',
  tipoInstrumentoNombre: 'Acción',
  claseActivoId: 'clase-1',
  claseActivoNombre: 'Renta variable',
  cantidad: '3.5',
  costoUnitario: '420.75',
  costoTotal: '1472.625',
  monedaId: 'usd',
  monedaCodigo: 'USD',
  monedaNombre: 'Dólar estadounidense',
  monedaSimbolo: '$',
  monedaDecimales: 2,
  observaciones: null,
  activo: true,
  fechaApertura: '2025-02-12',
  fechaCreacion: '2025-02-12T10:00:00Z',
  fechaActualizacion: '2025-02-12T10:00:00Z',
};

function renderTabla(posiciones: Posicion[]) {
  return render(
    <MemoryRouter>
      <PosicionesTabla
        portafolioId="portafolio-1"
        posiciones={posiciones}
        vacio={<p>No hay posiciones registradas</p>}
      />
    </MemoryRouter>,
  );
}

describe('PosicionesTabla', () => {
  it('muestra el estado vacío cuando no hay posiciones', () => {
    renderTabla([]);

    expect(
      screen.getByText('No hay posiciones registradas'),
    ).toBeInTheDocument();
  });

  it('presenta cantidad, costo y estado de la posición', () => {
    renderTabla([posicion]);

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('3,5')).toBeInTheDocument();
    expect(screen.getByText('1472,63')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('enlaza el detalle con el portafolio de la posición', () => {
    renderTabla([posicion]);

    const enlace = screen.getByRole('link', {
      name: 'Ver la posición de Apple Inc.',
    });

    expect(enlace).toHaveAttribute(
      'href',
      '/activos/liquidez/portafolio-1/posiciones/posicion-1',
    );
  });
});
