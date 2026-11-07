import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  postConCsrf: vi.fn(),
}));

vi.mock('../lib/http', () => ({
  http: {
    get: mocks.get,
    post: vi.fn(),
  },
}));

vi.mock('./csrf', () => ({
  postConCsrf: mocks.postConCsrf,
}));

import {
  crearPortafolio,
  listarMonedas,
  listarPortafolios,
} from './portafolios';

describe('api de portafolios', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
  });

  it('consulta el listado de portafolios', async () => {
    mocks.get.mockResolvedValue([]);

    await listarPortafolios();

    expect(mocks.get).toHaveBeenCalledWith('/v1/portafolios');
  });

  it('consulta el catálogo de monedas del backend', async () => {
    mocks.get.mockResolvedValue([]);

    await listarMonedas();

    expect(mocks.get).toHaveBeenCalledWith('/v1/monedas');
  });

  it('crea un portafolio con CSRF y el contrato esperado', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: '1' });

    await crearPortafolio({
      nombre: 'Largo plazo',
      descripcion: 'Ahorro',
      monedaBaseId: 'moneda-1',
    });

    expect(mocks.postConCsrf).toHaveBeenCalledWith('/v1/portafolios', {
      nombre: 'Largo plazo',
      descripcion: 'Ahorro',
      monedaBaseId: 'moneda-1',
    });
  });
});
