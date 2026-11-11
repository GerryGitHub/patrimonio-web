import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CuentaDetailPage } from './CuentaDetailPage';
import { ApiError } from '../lib/http';
import type {
  CuentaFinanciera,
  Institucion,
  Moneda,
  Portafolio,
  Posicion,
  TipoCuenta,
} from '../api/types';

const PORTAFOLIO_ID = 'portafolio-1';
const CUENTA_ID = 'cuenta-1';

const mocks = vi.hoisted(() => ({
  obtenerCuenta: vi.fn(),
  listarTiposCuenta: vi.fn(),
  cambiarEstadoCuenta: vi.fn(),
  listarInstituciones: vi.fn(),
  listarPortafolios: vi.fn(),
  listarMonedas: vi.fn(),
  listarPosiciones: vi.fn(),
  marcarSesionExpirada: vi.fn(),
}));

vi.mock('../api/cuentas', () => ({
  obtenerCuenta: mocks.obtenerCuenta,
  listarTiposCuenta: mocks.listarTiposCuenta,
  cambiarEstadoCuenta: mocks.cambiarEstadoCuenta,
}));

vi.mock('../api/instituciones', () => ({
  listarInstituciones: mocks.listarInstituciones,
}));

vi.mock('../api/portafolios', () => ({
  listarPortafolios: mocks.listarPortafolios,
  listarMonedas: mocks.listarMonedas,
}));

vi.mock('../api/posiciones', () => ({
  listarPosiciones: mocks.listarPosiciones,
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ marcarSesionExpirada: mocks.marcarSesionExpirada }),
}));

const monedaUsd: Moneda = {
  id: 'moneda-usd',
  codigo: 'USD',
  nombre: 'Dólar estadounidense',
  simbolo: '$',
  decimales: 2,
};

const monedaEur: Moneda = {
  id: 'moneda-eur',
  codigo: 'EUR',
  nombre: 'Euro',
  simbolo: '€',
  decimales: 2,
};

const portafolio: Portafolio = {
  id: PORTAFOLIO_ID,
  nombre: 'Portafolio principal',
  descripcion: null,
  monedaBaseId: monedaUsd.id,
  monedaBase: monedaUsd,
  activo: true,
};

const cuenta: CuentaFinanciera = {
  id: CUENTA_ID,
  nombre: 'Cuenta de inversión',
  numeroCuenta: '**** 1234',
  institucionId: 'institucion-1',
  tipoCuentaId: 'tipo-cuenta-1',
  monedaId: monedaUsd.id,
  activo: true,
  fechaApertura: '2026-01-10',
  fechaCierre: null,
  descripcion: null,
};

const institucion: Institucion = {
  id: 'institucion-1',
  nombre: 'Casa de Bolsa',
  tipo: 'CASA_BOLSA',
  pais: 'México',
  sitioWeb: null,
  activo: true,
};

const tipoCuenta: TipoCuenta = {
  id: 'tipo-cuenta-1',
  nombre: 'Inversión',
  descripcion: null,
  activo: true,
};

function crearPosicion(parcial: Partial<Posicion> = {}): Posicion {
  return {
    id: 'posicion-1',
    cuentaId: CUENTA_ID,
    cuentaNombre: cuenta.nombre,
    instrumentoId: 'instrumento-1',
    instrumentoNombre: 'Acción A',
    instrumentoSimbolo: 'AAA',
    tipoInstrumentoId: 'tipo-instrumento-1',
    tipoInstrumentoNombre: 'Acción',
    claseActivoId: 'clase-1',
    claseActivoNombre: 'Renta variable',
    cantidad: '10',
    costoUnitario: '10.00',
    costoTotal: '100.00',
    resultadoRealizado: '0.00',
    monedaId: monedaUsd.id,
    monedaCodigo: monedaUsd.codigo,
    monedaNombre: monedaUsd.nombre,
    monedaSimbolo: monedaUsd.simbolo,
    monedaDecimales: monedaUsd.decimales,
    observaciones: null,
    activo: true,
    fechaApertura: '2026-01-10',
    fechaUltimoMovimiento: null,
    fechaCreacion: '2026-01-10T00:00:00Z',
    fechaActualizacion: '2026-01-10T00:00:00Z',
    ...parcial,
  };
}

function renderizar() {
  return render(
    <MemoryRouter
      initialEntries={[
        `/activos/liquidez/${PORTAFOLIO_ID}/cuentas/${CUENTA_ID}`,
      ]}
    >
      <Routes>
        <Route
          path="/activos/liquidez/:portafolioId/cuentas/:cuentaId"
          element={<CuentaDetailPage />}
        />
        <Route
          path="/activos/liquidez/:portafolioId/posiciones/nueva"
          element={<div>Nueva posición</div>}
        />
        <Route
          path="/activos/liquidez/:portafolioId/posiciones/:posicionId"
          element={<div>Detalle de posición</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CuentaDetailPage · posiciones de inversión', () => {
  beforeEach(() => {
    mocks.obtenerCuenta.mockReset();
    mocks.listarTiposCuenta.mockReset();
    mocks.cambiarEstadoCuenta.mockReset();
    mocks.listarInstituciones.mockReset();
    mocks.listarPortafolios.mockReset();
    mocks.listarMonedas.mockReset();
    mocks.listarPosiciones.mockReset();
    mocks.marcarSesionExpirada.mockReset();

    mocks.obtenerCuenta.mockResolvedValue(cuenta);
    mocks.listarTiposCuenta.mockResolvedValue([tipoCuenta]);
    mocks.listarInstituciones.mockResolvedValue([institucion]);
    mocks.listarPortafolios.mockResolvedValue([portafolio]);
    mocks.listarMonedas.mockResolvedValue([monedaUsd, monedaEur]);
    mocks.listarPosiciones.mockResolvedValue([]);
  });

  it('consulta las posiciones con el portafolio y la cuenta actuales', async () => {
    renderizar();

    expect(
      await screen.findByRole('heading', {
        name: 'Posiciones de inversión',
        level: 2,
      }),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(mocks.listarPosiciones).toHaveBeenCalledWith(PORTAFOLIO_ID, {
        cuentaId: CUENTA_ID,
      }),
    );
  });

  it('muestra instrumento, símbolo, cantidad, costos, moneda y estado', async () => {
    mocks.listarPosiciones.mockResolvedValue([
      crearPosicion(),
      crearPosicion({
        id: 'posicion-2',
        instrumentoNombre: 'Bono B',
        instrumentoSimbolo: null,
        cantidad: '25',
        costoUnitario: '4.50',
        costoTotal: '112.50',
        activo: false,
      }),
    ]);

    renderizar();

    expect(await screen.findByText('Acción A')).toBeInTheDocument();
    expect(screen.getByText(/AAA/)).toBeInTheDocument();
    expect(screen.getByText('Bono B')).toBeInTheDocument();
    expect(screen.getByText(/Sin símbolo/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('USD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
    expect(screen.getByText('100,00')).toBeInTheDocument();
    expect(screen.getByText('112,50')).toBeInTheDocument();
  });

  it('excluye las posiciones que pertenecen a otra cuenta', async () => {
    mocks.listarPosiciones.mockResolvedValue([
      crearPosicion({ instrumentoNombre: 'Acción propia' }),
      crearPosicion({
        id: 'posicion-ajena',
        cuentaId: 'cuenta-2',
        cuentaNombre: 'Otra cuenta',
        instrumentoNombre: 'Bono ajeno',
      }),
    ]);

    renderizar();

    expect(await screen.findByText('Acción propia')).toBeInTheDocument();
    expect(screen.queryByText('Bono ajeno')).not.toBeInTheDocument();

    const etiquetaPosiciones = screen.getByText('Posiciones');
    expect(etiquetaPosiciones.closest('article')).toHaveTextContent('1');
  });

  it('agrupa el costo por moneda sin mezclar divisas', async () => {
    mocks.listarPosiciones.mockResolvedValue([
      crearPosicion({ id: 'posicion-usd-1', costoTotal: '100.00' }),
      crearPosicion({
        id: 'posicion-usd-2',
        instrumentoNombre: 'Acción C',
        costoTotal: '250.50',
      }),
      crearPosicion({
        id: 'posicion-eur-1',
        instrumentoNombre: 'Fondo europeo',
        monedaId: monedaEur.id,
        monedaCodigo: monedaEur.codigo,
        monedaNombre: monedaEur.nombre,
        monedaSimbolo: monedaEur.simbolo,
        monedaDecimales: monedaEur.decimales,
        costoTotal: '90.00',
      }),
    ]);

    renderizar();

    expect(await screen.findByText('350,50')).toBeInTheDocument();
    expect(screen.getAllByText('90,00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EUR').length).toBeGreaterThan(0);
    expect(screen.queryByText('440,50')).not.toBeInTheDocument();
  });

  it('muestra un estado vacío con acceso a registrar una posición', async () => {
    mocks.listarPosiciones.mockResolvedValue([]);

    renderizar();

    expect(
      await screen.findByText('Esta cuenta no tiene posiciones'),
    ).toBeInTheDocument();

    const enlaces = screen.getAllByRole('link', {
      name: /Registrar posición/,
    });
    expect(enlaces.length).toBeGreaterThan(0);
    for (const enlace of enlaces) {
      expect(enlace).toHaveAttribute(
        'href',
        `/activos/liquidez/${PORTAFOLIO_ID}/posiciones/nueva`,
      );
    }
  });

  it('muestra el error y permite reintentar la consulta', async () => {
    mocks.listarPosiciones.mockRejectedValueOnce(
      new ApiError(500, 'ERROR_INTERNO', 'Fallo temporal'),
    );

    renderizar();

    expect(
      await screen.findByText('No se pudieron consultar las posiciones'),
    ).toBeInTheDocument();

    mocks.listarPosiciones.mockResolvedValueOnce([crearPosicion()]);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Acción A')).toBeInTheDocument();
    expect(mocks.listarPosiciones).toHaveBeenCalledTimes(2);
  });

  it('navega al detalle existente de una posición', async () => {
    mocks.listarPosiciones.mockResolvedValue([crearPosicion()]);

    renderizar();

    fireEvent.click(
      await screen.findByRole('link', {
        name: 'Ver la posición de Acción A',
      }),
    );

    expect(await screen.findByText('Detalle de posición')).toBeInTheDocument();
  });
});
