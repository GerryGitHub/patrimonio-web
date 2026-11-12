import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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
  ResumenPosiciones,
  TipoCuenta,
} from '../api/types';

const PORTAFOLIO_ID = 'portafolio-1';
const CUENTA_ID = 'cuenta-1';
const CUENTA_SECUNDARIA_ID = 'cuenta-2';

const mocks = vi.hoisted(() => ({
  listarCuentas: vi.fn(),
  obtenerCuenta: vi.fn(),
  listarTiposCuenta: vi.fn(),
  cambiarEstadoCuenta: vi.fn(),
  listarInstituciones: vi.fn(),
  listarPortafolios: vi.fn(),
  listarMonedas: vi.fn(),
  listarPosiciones: vi.fn(),
  obtenerResumenPosiciones: vi.fn(),
  marcarSesionExpirada: vi.fn(),
}));

vi.mock('../api/cuentas', () => ({
  listarCuentas: mocks.listarCuentas,
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
  obtenerResumenPosiciones: mocks.obtenerResumenPosiciones,
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

const cuentaSecundaria: CuentaFinanciera = {
  ...cuenta,
  id: CUENTA_SECUNDARIA_ID,
  nombre: 'Cuenta secundaria',
  numeroCuenta: '**** 5678',
  institucionId: 'institucion-2',
  tipoCuentaId: 'tipo-cuenta-2',
  monedaId: monedaEur.id,
};

const institucion: Institucion = {
  id: 'institucion-1',
  nombre: 'Casa de Bolsa',
  tipo: 'CASA_BOLSA',
  pais: 'México',
  sitioWeb: null,
  activo: true,
};

const institucionSecundaria: Institucion = {
  id: 'institucion-2',
  nombre: 'Banco Local',
  tipo: 'BANCO',
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

const tipoCuentaSecundario: TipoCuenta = {
  id: 'tipo-cuenta-2',
  nombre: 'Ahorro',
  descripcion: null,
  activo: true,
};

const resumenPortafolio: ResumenPosiciones = {
  totalPosiciones: 3,
  posicionesActivas: 2,
  instrumentosDistintos: 2,
  costoPorMoneda: [],
  resultadoPorMoneda: [],
  distribucionPorCategoria: [],
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

function renderizar(
  entrada = `/activos/liquidez/${PORTAFOLIO_ID}/cuentas/${CUENTA_ID}`,
) {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route
          path="/activos/liquidez/:portafolioId"
          element={<div>Portafolio</div>}
        />
        <Route
          path="/activos/liquidez/:portafolioId/cuentas"
          element={<CuentaDetailPage />}
        />
        <Route
          path="/activos/liquidez/:portafolioId/cuentas/:cuentaId"
          element={<CuentaDetailPage />}
        />
        <Route
          path="/activos/liquidez/:portafolioId/cuentas/:cuentaId/editar"
          element={<div>Editar cuenta</div>}
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

async function esperarDetalle(nombre = cuenta.nombre) {
  return screen.findByRole('heading', { name: nombre, level: 3 });
}

describe('CuentaDetailPage · Cuentas y efectivo', () => {
  beforeEach(() => {
    mocks.listarCuentas.mockReset();
    mocks.obtenerCuenta.mockReset();
    mocks.listarTiposCuenta.mockReset();
    mocks.cambiarEstadoCuenta.mockReset();
    mocks.listarInstituciones.mockReset();
    mocks.listarPortafolios.mockReset();
    mocks.listarMonedas.mockReset();
    mocks.listarPosiciones.mockReset();
    mocks.obtenerResumenPosiciones.mockReset();
    mocks.marcarSesionExpirada.mockReset();

    mocks.listarCuentas.mockResolvedValue([cuenta]);
    mocks.obtenerCuenta.mockResolvedValue(cuenta);
    mocks.listarTiposCuenta.mockResolvedValue([
      tipoCuenta,
      tipoCuentaSecundario,
    ]);
    mocks.listarInstituciones.mockResolvedValue([
      institucion,
      institucionSecundaria,
    ]);
    mocks.listarPortafolios.mockResolvedValue([portafolio]);
    mocks.listarMonedas.mockResolvedValue([monedaUsd, monedaEur]);
    mocks.listarPosiciones.mockResolvedValue([]);
    mocks.obtenerResumenPosiciones.mockResolvedValue(resumenPortafolio);
  });

  it('renderiza el encabezado, el resumen, el listado y las pestañas', async () => {
    renderizar();

    expect(
      await screen.findByRole('heading', {
        name: 'Cuentas y efectivo',
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Cuentas registradas')).toBeInTheDocument();
    expect(screen.getByText('Cuentas activas')).toBeInTheDocument();
    expect(screen.getByText('Posiciones del portafolio')).toBeInTheDocument();
    expect(screen.getByText('Efectivo disponible')).toBeInTheDocument();

    await esperarDetalle();

    expect(
      screen.getByRole('tablist', { name: 'Secciones de la cuenta' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('tab').map((tab) => tab.textContent),
    ).toEqual([
      'Resumen',
      'Movimientos',
      'Posiciones',
      'Contratos',
      'Rendimientos',
      'Valuación',
    ]);
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const metricaPosiciones = screen
      .getByText('Posiciones del portafolio')
      .closest('article');
    await waitFor(() =>
      expect(metricaPosiciones).toHaveTextContent(
        String(resumenPortafolio.totalPosiciones),
      ),
    );
  });

  it('autoselecciona la primera cuenta cuando la ruta no incluye cuenta', async () => {
    renderizar(`/activos/liquidez/${PORTAFOLIO_ID}/cuentas`);

    await esperarDetalle();
    await waitFor(() =>
      expect(mocks.obtenerCuenta).toHaveBeenCalledWith(
        PORTAFOLIO_ID,
        CUENTA_ID,
      ),
    );
  });

  it('permite seleccionar otra cuenta del listado y consulta su detalle', async () => {
    mocks.listarCuentas.mockResolvedValue([cuenta, cuentaSecundaria]);
    mocks.obtenerCuenta.mockImplementation(
      (_portafolioId: string, id: string) =>
        Promise.resolve(id === CUENTA_SECUNDARIA_ID ? cuentaSecundaria : cuenta),
    );
    mocks.listarPosiciones.mockImplementation(
      (
        _portafolioId: string,
        filtros?: { cuentaId?: string },
      ) =>
        Promise.resolve(
          filtros?.cuentaId === CUENTA_SECUNDARIA_ID
            ? [
                crearPosicion({
                  id: 'posicion-secundaria',
                  cuentaId: CUENTA_SECUNDARIA_ID,
                  cuentaNombre: cuentaSecundaria.nombre,
                  instrumentoNombre: 'Bono B',
                }),
              ]
            : [],
        ),
    );

    renderizar();

    const enlace = await screen.findByRole('link', {
      name: `Seleccionar la cuenta ${cuentaSecundaria.nombre}`,
    });
    fireEvent.click(enlace);

    await esperarDetalle(cuentaSecundaria.nombre);
    await waitFor(() =>
      expect(mocks.obtenerCuenta).toHaveBeenCalledWith(
        PORTAFOLIO_ID,
        CUENTA_SECUNDARIA_ID,
      ),
    );
    await waitFor(() =>
      expect(mocks.listarPosiciones).toHaveBeenCalledWith(PORTAFOLIO_ID, {
        cuentaId: CUENTA_SECUNDARIA_ID,
      }),
    );

    expect(
      screen.getByRole('link', {
        name: `Seleccionar la cuenta ${cuentaSecundaria.nombre}`,
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('conserva las acciones de edición y desactivación de la cuenta', async () => {
    mocks.cambiarEstadoCuenta.mockResolvedValue({
      ...cuenta,
      activo: false,
    });

    renderizar();
    await esperarDetalle();

    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      `/activos/liquidez/${PORTAFOLIO_ID}/cuentas/${CUENTA_ID}/editar`,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Sí, desactivar' }),
    );

    await waitFor(() =>
      expect(mocks.cambiarEstadoCuenta).toHaveBeenCalledWith(
        PORTAFOLIO_ID,
        CUENTA_ID,
        false,
      ),
    );
    expect(
      await screen.findByText(
        'Cuenta desactivada correctamente. Su historial se conserva.',
      ),
    ).toBeInTheDocument();
  });

  it('navega entre las pestañas y muestra NO_DISPONIBLE sin datos simulados', async () => {
    renderizar();
    await esperarDetalle();

    const casos = [
      { tab: 'Movimientos', titulo: 'Movimientos de efectivo' },
      { tab: 'Contratos', titulo: 'Contratos' },
      { tab: 'Rendimientos', titulo: 'Rendimientos' },
      { tab: 'Valuación', titulo: 'Valuación de la cuenta' },
    ];

    for (const caso of casos) {
      fireEvent.click(screen.getByRole('tab', { name: caso.tab }));

      expect(screen.getByRole('tab', { name: caso.tab })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(
        screen.getByRole('heading', { name: caso.titulo }),
      ).toBeInTheDocument();

      const panel = screen.getByRole('tabpanel');
      expect(within(panel).getByText('NO_DISPONIBLE')).toBeInTheDocument();
    }
  });

  it('muestra el resumen de la cuenta y el efectivo como no disponible', async () => {
    renderizar();
    await esperarDetalle();

    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel).getByText('Casa de Bolsa · Casa de bolsa'),
    ).toBeInTheDocument();
    expect(within(panel).getByText('Inversión')).toBeInTheDocument();
    expect(
      within(panel).getByText('USD · Dólar estadounidense'),
    ).toBeInTheDocument();
    expect(within(panel).getAllByText('**** 1234').length).toBeGreaterThan(0);

    const efectivo = within(panel)
      .getByRole('heading', { name: 'Efectivo de la cuenta' })
      .closest('section');
    expect(efectivo).toHaveTextContent('NO_DISPONIBLE');
    expect(efectivo).toHaveTextContent(
      'La API actual no expone saldos de efectivo por cuenta',
    );
  });

  it('consulta y presenta las posiciones de la cuenta', async () => {
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
    await esperarDetalle();

    await waitFor(() =>
      expect(mocks.listarPosiciones).toHaveBeenCalledWith(PORTAFOLIO_ID, {
        cuentaId: CUENTA_ID,
      }),
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

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
        cuentaId: 'cuenta-3',
        cuentaNombre: 'Otra cuenta',
        instrumentoNombre: 'Bono ajeno',
      }),
    ]);

    renderizar();
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

    expect(await screen.findByText('Acción propia')).toBeInTheDocument();
    expect(screen.queryByText('Bono ajeno')).not.toBeInTheDocument();
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
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

    expect(await screen.findByText('350,50')).toBeInTheDocument();
    expect(screen.getAllByText('90,00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EUR').length).toBeGreaterThan(0);
    expect(screen.queryByText('440,50')).not.toBeInTheDocument();
  });

  it('filtra las posiciones por búsqueda y estado', async () => {
    mocks.listarPosiciones.mockResolvedValue([
      crearPosicion(),
      crearPosicion({
        id: 'posicion-2',
        instrumentoNombre: 'Bono B',
        instrumentoSimbolo: 'BBB',
        activo: false,
      }),
    ]);

    renderizar();
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

    expect(await screen.findByText('Acción A')).toBeInTheDocument();
    expect(screen.getByText('Bono B')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar posición'), {
      target: { value: 'bono' },
    });

    expect(screen.queryByText('Acción A')).not.toBeInTheDocument();
    expect(screen.getByText('Bono B')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Estado de la posición'), {
      target: { value: 'activas' },
    });

    expect(
      await screen.findByText('No hay posiciones con estos filtros'),
    ).toBeInTheDocument();
  });

  it('muestra un estado vacío de posiciones con acceso a registrar', async () => {
    mocks.listarPosiciones.mockResolvedValue([]);

    renderizar();
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

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

  it('muestra el error de posiciones y permite reintentar', async () => {
    mocks.listarPosiciones.mockRejectedValueOnce(
      new ApiError(500, 'ERROR_INTERNO', 'Fallo temporal'),
    );

    renderizar();
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

    expect(
      await screen.findByText('No se pudieron consultar las posiciones'),
    ).toBeInTheDocument();

    mocks.listarPosiciones.mockResolvedValueOnce([crearPosicion()]);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Acción A')).toBeInTheDocument();
    expect(mocks.listarPosiciones).toHaveBeenCalledTimes(2);
  });

  it('muestra el error inicial de cuentas y permite reintentar', async () => {
    mocks.listarCuentas.mockRejectedValueOnce(
      new ApiError(500, 'ERROR_INTERNO', 'Fallo temporal'),
    );

    renderizar();

    expect(
      await screen.findByText('No se pudieron cargar las cuentas'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await esperarDetalle();
  });

  it('muestra el error de detalle y permite reintentar', async () => {
    mocks.obtenerCuenta.mockRejectedValueOnce(
      new ApiError(500, 'ERROR_INTERNO', 'Fallo temporal'),
    );

    renderizar();

    expect(
      await screen.findByText('No se pudo cargar la cuenta'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await esperarDetalle();
  });

  it('muestra un estado cuando la cuenta no existe', async () => {
    mocks.obtenerCuenta.mockRejectedValueOnce(
      new ApiError(404, 'NO_ENCONTRADO', 'No encontrada'),
    );

    renderizar();

    expect(
      await screen.findByText('No encontramos esta cuenta'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Elegir otra cuenta' }),
    ).toHaveAttribute(
      'href',
      `/activos/liquidez/${PORTAFOLIO_ID}/cuentas`,
    );
  });

  it('muestra un estado vacío cuando el portafolio no tiene cuentas', async () => {
    mocks.listarCuentas.mockResolvedValue([]);

    renderizar(`/activos/liquidez/${PORTAFOLIO_ID}/cuentas`);

    expect(
      await screen.findByText('Este portafolio no tiene cuentas'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Aún no hay cuentas para mostrar'),
    ).toBeInTheDocument();
  });

  it('navega al detalle existente de una posición', async () => {
    mocks.listarPosiciones.mockResolvedValue([crearPosicion()]);

    renderizar();
    await esperarDetalle();
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }));

    fireEvent.click(
      await screen.findByRole('link', {
        name: 'Ver la posición de Acción A',
      }),
    );

    expect(await screen.findByText('Detalle de posición')).toBeInTheDocument();
  });

  it('marca NO_DISPONIBLE en posiciones del portafolio si falla el resumen', async () => {
    mocks.obtenerResumenPosiciones.mockRejectedValueOnce(
      new ApiError(500, 'ERROR_INTERNO', 'Fallo temporal'),
    );

    renderizar();
    await esperarDetalle();

    const metrica = screen
      .getByText('Posiciones del portafolio')
      .closest('article');
    await waitFor(() =>
      expect(metrica).toHaveTextContent('NO_DISPONIBLE'),
    );
  });
});
