import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { crearCentroPatrimonio } from '../test/fixtures/patrimonio';

const mocks = vi.hoisted(() => ({
  obtenerCentro: vi.fn(),
  listarSnapshots: vi.fn(),
  crearSnapshot: vi.fn(),
  marcarSesionExpirada: vi.fn(),
  estado: {
    portafolios: [
      { id: 'portafolio-1', nombre: 'Portafolio principal' },
    ],
    cargando: false,
    seleccionadoId: 'portafolio-1' as string | null,
    seleccionado: { nombre: 'Portafolio principal' } as {
      nombre: string;
    } | null,
    revision: 0,
  },
}));

vi.mock('../api/patrimonio', () => ({
  obtenerCentroPatrimonio: mocks.obtenerCentro,
  listarSnapshotsPatrimonio: mocks.listarSnapshots,
  crearSnapshotPatrimonio: mocks.crearSnapshot,
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ marcarSesionExpirada: mocks.marcarSesionExpirada }),
}));

vi.mock('../portfolio/PortfolioContext', () => ({
  PORTAFOLIO_TODOS: 'todos',
  usePortafolios: () => mocks.estado,
}));

function renderizar() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mocks.obtenerCentro.mockReset();
    mocks.listarSnapshots.mockReset();
    mocks.crearSnapshot.mockReset();
    mocks.marcarSesionExpirada.mockReset();
    mocks.obtenerCentro.mockResolvedValue(crearCentroPatrimonio());
    mocks.listarSnapshots.mockResolvedValue([]);
    mocks.estado = {
      portafolios: [{ id: 'portafolio-1', nombre: 'Portafolio principal' }],
      cargando: false,
      seleccionadoId: 'portafolio-1',
      seleccionado: { nombre: 'Portafolio principal' },
      revision: 0,
    };
  });

  it('consulta el centro del portafolio activo y muestra la cobertura', async () => {
    renderizar();

    expect(
      await screen.findByRole('heading', {
        name: 'Centro de Patrimonio',
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(mocks.obtenerCentro).toHaveBeenCalledWith('portafolio-1', {
      periodo: 'TODO',
      dimension: 'CLASE_ACTIVO',
    });
    expect(
      screen.getByText('Inversiones registradas a costo'),
    ).toBeInTheDocument();
    expect(screen.getByText('No incluye todavía')).toBeInTheDocument();
    expect(
      screen.getByText(/no representa el patrimonio neto completo/i),
    ).toBeInTheDocument();
  });

  it('presenta los indicadores sin fuente como no disponibles', async () => {
    renderizar();

    await screen.findByRole('heading', {
      name: 'Centro de Patrimonio',
      level: 1,
    });

    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Faltan efectivo y pasivos/i),
    ).toBeInTheDocument();
  });

  it('dibuja la evolución y la distribución con datos reales', async () => {
    renderizar();

    expect(
      await screen.findByRole('heading', {
        name: 'Distribución del patrimonio',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Evolución histórica',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Evolución de/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Distribución en USD/ }),
    ).toBeInTheDocument();
  });

  it('consulta el endpoint global cuando se seleccionan todos los portafolios', async () => {
    mocks.estado = {
      ...mocks.estado,
      seleccionadoId: 'todos',
      seleccionado: null,
    };

    renderizar();

    await waitFor(() =>
      expect(mocks.obtenerCentro).toHaveBeenCalledWith(null, {
        periodo: 'TODO',
        dimension: 'CLASE_ACTIVO',
      }),
    );
    expect(
      await screen.findByText('Todos los portafolios'),
    ).toBeInTheDocument();
  });

  it('invita a crear un portafolio cuando no hay ninguno', async () => {
    mocks.estado = {
      portafolios: [],
      cargando: false,
      seleccionadoId: null,
      seleccionado: null,
      revision: 0,
    };

    renderizar();

    expect(
      screen.getByText('Crea tu primer portafolio'),
    ).toBeInTheDocument();
    expect(mocks.obtenerCentro).not.toHaveBeenCalled();
  });
});
