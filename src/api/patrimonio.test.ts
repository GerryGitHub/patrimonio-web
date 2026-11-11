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
  crearSnapshotPatrimonio,
  listarSnapshotsPatrimonio,
  obtenerCentroPatrimonio,
} from './patrimonio';

describe('api del Centro de Patrimonio', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
  });

  it('consulta el centro de un portafolio concreto sin filtros', async () => {
    mocks.get.mockResolvedValue({});

    await obtenerCentroPatrimonio('portafolio-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/patrimonio/centro',
    );
  });

  it('consulta el centro global cuando no hay portafolio activo', async () => {
    mocks.get.mockResolvedValue({});

    await obtenerCentroPatrimonio(null);

    expect(mocks.get).toHaveBeenCalledWith('/v1/patrimonio/centro');
  });

  it('codifica el identificador del portafolio', async () => {
    mocks.get.mockResolvedValue({});

    await obtenerCentroPatrimonio('portafolio 1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio%201/patrimonio/centro',
    );
  });

  it('construye todos los filtros sin convertir monedas', async () => {
    mocks.get.mockResolvedValue({});

    await obtenerCentroPatrimonio('portafolio-1', {
      moneda: 'USD',
      periodo: '1A',
      dimension: 'INSTITUCION',
      desde: '2026-01-01',
      hasta: '2026-02-01',
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/patrimonio/centro?moneda=USD&periodo=1A&dimension=INSTITUCION&desde=2026-01-01&hasta=2026-02-01',
    );
  });

  it('lista los snapshots de un portafolio', async () => {
    mocks.get.mockResolvedValue([]);

    await listarSnapshotsPatrimonio('portafolio-1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/patrimonio/snapshots',
    );
  });

  it('captura un snapshot con CSRF sin enviar importes', async () => {
    mocks.postConCsrf.mockResolvedValue([]);

    await crearSnapshotPatrimonio('portafolio-1');

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/patrimonio/snapshots',
      {},
    );
  });

  it('envía la fecha solicitada al capturar un snapshot', async () => {
    mocks.postConCsrf.mockResolvedValue([]);

    await crearSnapshotPatrimonio('portafolio-1', { fecha: '2026-02-01' });

    expect(mocks.postConCsrf).toHaveBeenCalledWith(
      '/v1/portafolios/portafolio-1/patrimonio/snapshots',
      { fecha: '2026-02-01' },
    );
  });
});
