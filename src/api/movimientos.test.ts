import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  postConCsrf: vi.fn(),
}));

vi.mock('../lib/http', () => ({
  http: {
    get: mocks.get,
  },
}));

vi.mock('./csrf', () => ({
  postConCsrf: mocks.postConCsrf,
}));

import {
  listarMovimientos,
  obtenerMovimiento,
  obtenerResumenPosicion,
  reconstruirPosicion,
  registrarMovimiento,
  revertirMovimiento,
} from './movimientos';

describe('api de movimientos', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
  });

  it('lista el historial sin filtros', async () => {
    mocks.get.mockResolvedValue({ items: [] });

    await listarMovimientos('portafolio-1', 'posicion-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/movimientos',
    );
  });

  it('construye todos los filtros del historial', async () => {
    mocks.get.mockResolvedValue({ items: [] });

    await listarMovimientos('portafolio-1', 'posicion-1', {
      tipo: 'VENTA',
      desde: '2026-01-01',
      hasta: '2026-01-31',
      pagina: 2,
      tamano: 50,
      orden: 'asc',
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/movimientos?tipo=VENTA&desde=2026-01-01&hasta=2026-01-31&pagina=2&tamano=50&orden=asc',
    );
  });

  it('registra un movimiento con CSRF y clave de idempotencia', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'movimiento-1' });
    const datos = {
      tipo: 'COMPRA' as const,
      cantidad: '2',
      precioUnitario: '20',
      claveIdempotencia: 'clave-1',
    };

    await registrarMovimiento('portafolio-1', 'posicion-1', datos);

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/movimientos',
      datos,
    );
  });

  it('consulta un movimiento por identificador', async () => {
    mocks.get.mockResolvedValue({ id: 'movimiento-1' });

    await obtenerMovimiento('portafolio-1', 'movimiento 1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/movimientos/movimiento%201',
    );
  });

  it('revierte un movimiento con CSRF', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'reversion-1' });
    const datos = { observaciones: 'Corrección' };

    await revertirMovimiento('portafolio-1', 'movimiento-1', datos);

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/movimientos/movimiento-1/reversion',
      datos,
    );
  });

  it('consulta el resumen de la posición', async () => {
    mocks.get.mockResolvedValue({ posicionId: 'posicion-1' });

    await obtenerResumenPosicion('portafolio-1', 'posicion-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/resumen',
    );
  });

  it('solicita la reconstrucción con la opción de reparar', async () => {
    mocks.postConCsrf.mockResolvedValue({ coincide: true });

    await reconstruirPosicion('portafolio-1', 'posicion-1', true);

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/reconstruccion',
      { reparar: true },
    );
  });
});
