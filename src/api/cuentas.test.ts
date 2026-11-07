import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  postConCsrf: vi.fn(),
  putConCsrf: vi.fn(),
  patchConCsrf: vi.fn(),
}));

vi.mock('../lib/http', () => ({
  http: {
    get: mocks.get,
  },
}));

vi.mock('./csrf', () => ({
  postConCsrf: mocks.postConCsrf,
  putConCsrf: mocks.putConCsrf,
  patchConCsrf: mocks.patchConCsrf,
}));

import {
  actualizarCuenta,
  cambiarEstadoCuenta,
  crearCuenta,
  listarCuentas,
  listarTiposCuenta,
  obtenerCuenta,
} from './cuentas';

describe('api de cuentas', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
    mocks.putConCsrf.mockReset();
    mocks.patchConCsrf.mockReset();
  });

  it('consulta el catálogo de tipos de cuenta', async () => {
    mocks.get.mockResolvedValue([]);

    await listarTiposCuenta();

    expect(mocks.get).toHaveBeenCalledWith('/v1/tipos-cuenta');
  });

  it('codifica el portafolio y construye filtros válidos', async () => {
    mocks.get.mockResolvedValue([]);

    await listarCuentas('id con espacios', {
      institucionId: 'inst-1',
      tipoCuentaId: 'tipo-1',
      activo: false,
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/id%20con%20espacios/cuentas?institucionId=inst-1&tipoCuentaId=tipo-1&activo=false',
    );
  });

  it('consulta el detalle de una cuenta', async () => {
    mocks.get.mockResolvedValue({ id: 'cuenta-1' });

    await obtenerCuenta('portafolio-1', 'cuenta-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/cuentas/cuenta-1',
    );
  });

  it('crea una cuenta con CSRF', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'cuenta-1' });
    const datos = {
      institucionId: 'inst-1',
      tipoCuentaId: 'tipo-1',
      monedaId: 'moneda-1',
      nombre: 'Cuenta principal',
    };

    await crearCuenta('portafolio-1', datos);

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/cuentas',
      datos,
    );
  });

  it('actualiza una cuenta con PUT y CSRF', async () => {
    mocks.putConCsrf.mockResolvedValue({ id: 'cuenta-1' });
    const datos = {
      institucionId: 'inst-1',
      tipoCuentaId: 'tipo-1',
      monedaId: 'moneda-1',
      nombre: 'Cuenta editada',
    };

    await actualizarCuenta('portafolio-1', 'cuenta-1', datos);

    expect(mocks.putConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/cuentas/cuenta-1',
      datos,
    );
  });

  it('cambia el estado con PATCH y CSRF', async () => {
    mocks.patchConCsrf.mockResolvedValue({ id: 'cuenta-1' });

    await cambiarEstadoCuenta('portafolio-1', 'cuenta-1', false);

    expect(mocks.patchConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/cuentas/cuenta-1/estado',
      { activo: false },
    );
  });
});
