import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SnapshotsPatrimonio } from './SnapshotsPatrimonio';
import { MONEDA_USD } from '../../test/fixtures/patrimonio';
import type { SnapshotPatrimonio } from '../../api/types';
import { ApiError } from '../../lib/http';

const mocks = vi.hoisted(() => ({
  listar: vi.fn(),
  crear: vi.fn(),
  marcarSesionExpirada: vi.fn(),
}));

vi.mock('../../api/patrimonio', () => ({
  listarSnapshotsPatrimonio: mocks.listar,
  crearSnapshotPatrimonio: mocks.crear,
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ marcarSesionExpirada: mocks.marcarSesionExpirada }),
}));

const SNAPSHOT: SnapshotPatrimonio = {
  id: 'snapshot-1',
  portafolioId: 'portafolio-1',
  fecha: '2026-02-01',
  moneda: MONEDA_USD,
  capitalInvertido: '1500.00',
  resultadoRealizado: '250.00',
  efectivo: null,
  pasivos: null,
  valorMercado: null,
  patrimonioNeto: null,
  cobertura: 'INVERSIONES_A_COSTO',
  limitaciones: null,
  fuente: 'MANUAL',
  fechaCreacion: '2026-02-01T12:00:00Z',
};

describe('SnapshotsPatrimonio', () => {
  beforeEach(() => {
    mocks.listar.mockReset();
    mocks.crear.mockReset();
    mocks.marcarSesionExpirada.mockReset();
  });

  it('pide seleccionar un portafolio concreto cuando no hay uno activo', async () => {
    render(<SnapshotsPatrimonio portafolioId={null} />);

    expect(
      screen.getByText('Selecciona un portafolio'),
    ).toBeInTheDocument();
    expect(mocks.listar).not.toHaveBeenCalled();
  });

  it('muestra los campos sin información como no disponibles', async () => {
    mocks.listar.mockResolvedValue([SNAPSHOT]);

    render(<SnapshotsPatrimonio portafolioId="portafolio-1" />);

    expect(await screen.findByText('MANUAL')).toBeInTheDocument();
    expect(
      screen.getAllByText('No disponible').length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/1500,00/)).toBeInTheDocument();
    expect(screen.getByText('Inversiones registradas a costo')).toBeInTheDocument();
  });

  it('captura un snapshot con confirmación y avisa del resultado', async () => {
    const usuario = userEvent.setup();
    mocks.listar.mockResolvedValue([]);
    mocks.crear.mockResolvedValue([SNAPSHOT]);

    render(<SnapshotsPatrimonio portafolioId="portafolio-1" />);

    expect(
      await screen.findByText('Sin snapshots capturados'),
    ).toBeInTheDocument();

    await usuario.click(
      screen.getByRole('button', { name: /Capturar snapshot/ }),
    );
    await usuario.click(screen.getByRole('button', { name: 'Capturar' }));

    await waitFor(() =>
      expect(mocks.crear).toHaveBeenCalledWith('portafolio-1'),
    );
    expect(
      await screen.findByText(/Snapshot capturado/),
    ).toBeInTheDocument();
  });

  it('propaga la caducidad de sesión sin mostrar un error genérico', async () => {
    mocks.listar.mockRejectedValue(new ApiError(401, 'NO_AUTENTICADO'));

    render(<SnapshotsPatrimonio portafolioId="portafolio-1" />);

    await waitFor(() => expect(mocks.marcarSesionExpirada).toHaveBeenCalled());
  });
});
