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

import { crearInstitucion, listarInstituciones } from './instituciones';

describe('api de instituciones', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
  });

  it('consulta el catálogo sin filtros', async () => {
    mocks.get.mockResolvedValue([]);

    await listarInstituciones();

    expect(mocks.get).toHaveBeenCalledWith('/v1/instituciones');
  });

  it('construye los filtros de categoría y estado', async () => {
    mocks.get.mockResolvedValue([]);

    await listarInstituciones({ tipo: 'BANCO', activo: true });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/instituciones?tipo=BANCO&activo=true',
    );
  });

  it('crea una institución con CSRF y el contrato esperado', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'inst-1' });

    await crearInstitucion({
      nombre: 'Banco Ejemplo',
      tipo: 'BANCO',
      pais: 'México',
      sitioWeb: 'https://example.com',
    });

    expect(mocks.postConCsrf).toHaveBeenCalledWith('/v1/instituciones', {
      nombre: 'Banco Ejemplo',
      tipo: 'BANCO',
      pais: 'México',
      sitioWeb: 'https://example.com',
    });
  });
});
