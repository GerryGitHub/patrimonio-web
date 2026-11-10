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
  actualizarPosicion,
  cambiarEstadoPosicion,
  crearPosicion,
  listarPosiciones,
  obtenerPosicion,
  obtenerResumenPosiciones,
} from './posiciones';

describe('api de posiciones', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
    mocks.putConCsrf.mockReset();
    mocks.patchConCsrf.mockReset();
  });

  it('lista las posiciones del portafolio sin filtros', async () => {
    mocks.get.mockResolvedValue([]);

    await listarPosiciones('portafolio-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones',
    );
  });

  it('construye los filtros de cuenta, instrumento, categoría y estado', async () => {
    mocks.get.mockResolvedValue([]);

    await listarPosiciones('portafolio-1', {
      cuentaId: 'cuenta-1',
      instrumentoId: 'instrumento-1',
      claseActivoId: 'clase-1',
      activo: true,
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones?cuentaId=cuenta-1&instrumentoId=instrumento-1&claseActivoId=clase-1&activo=true',
    );
  });

  it('consulta el detalle de una posición', async () => {
    mocks.get.mockResolvedValue({ id: 'posicion-1' });

    await obtenerPosicion('portafolio-1', 'posicion 1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion%201',
    );
  });

  it('consulta el resumen agregado del portafolio', async () => {
    mocks.get.mockResolvedValue({ totalPosiciones: 0 });

    await obtenerResumenPosiciones('portafolio-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/resumen',
    );
  });

  it('registra una posición con CSRF', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'posicion-1' });
    const datos = {
      cuentaId: 'cuenta-1',
      instrumentoId: 'instrumento-1',
      cantidad: '10',
      costoUnitario: '185.50',
    };

    await crearPosicion('portafolio-1', datos);

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones',
      datos,
    );
  });

  it('actualiza solo los campos permitidos con PUT y CSRF', async () => {
    mocks.putConCsrf.mockResolvedValue({ id: 'posicion-1' });
    const datos = {
      cantidad: '3',
      costoUnitario: '100.50',
      fechaApertura: '2025-02-10',
      observaciones: 'Ajuste',
    };

    await actualizarPosicion('portafolio-1', 'posicion-1', datos);

    expect(mocks.putConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1',
      datos,
    );
  });

  it('cambia el estado con PATCH y CSRF', async () => {
    mocks.patchConCsrf.mockResolvedValue({ id: 'posicion-1' });

    await cambiarEstadoPosicion('portafolio-1', 'posicion-1', false);

    expect(mocks.patchConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/posiciones/posicion-1/estado',
      { activo: false },
    );
  });
});
