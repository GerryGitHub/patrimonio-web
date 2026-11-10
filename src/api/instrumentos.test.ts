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
  actualizarInstrumento,
  cambiarEstadoInstrumento,
  crearInstrumento,
  listarCategoriasInstrumento,
  listarInstrumentos,
  listarTiposInstrumento,
  obtenerInstrumento,
} from './instrumentos';

describe('api de instrumentos', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.postConCsrf.mockReset();
    mocks.putConCsrf.mockReset();
    mocks.patchConCsrf.mockReset();
  });

  it('consulta el catálogo de categorías', async () => {
    mocks.get.mockResolvedValue([]);

    await listarCategoriasInstrumento();

    expect(mocks.get).toHaveBeenCalledWith('/v1/instrumentos/categorias');
  });

  it('consulta los tipos filtrando por categoría', async () => {
    mocks.get.mockResolvedValue([]);

    await listarTiposInstrumento('clase 1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/instrumentos/tipos?claseActivoId=clase+1',
    );
  });

  it('construye los filtros de búsqueda, categoría, tipo y estado', async () => {
    mocks.get.mockResolvedValue([]);

    await listarInstrumentos({
      busqueda: '  Apple  ',
      claseActivoId: 'clase-1',
      tipoInstrumentoId: 'tipo-1',
      activo: false,
    });

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/instrumentos?busqueda=Apple&claseActivoId=clase-1&tipoInstrumentoId=tipo-1&activo=false',
    );
  });

  it('omite la búsqueda cuando solo contiene espacios', async () => {
    mocks.get.mockResolvedValue([]);

    await listarInstrumentos({ busqueda: '   ' });

    expect(mocks.get).toHaveBeenCalledWith('/v1/instrumentos');
  });

  it('consulta el detalle codificando el identificador', async () => {
    mocks.get.mockResolvedValue({ id: 'instrumento-1' });

    await obtenerInstrumento('instrumento 1');

    expect(mocks.get).toHaveBeenCalledWith(
      '/v1/instrumentos/instrumento%201',
    );
  });

  it('crea un instrumento con CSRF', async () => {
    mocks.postConCsrf.mockResolvedValue({ id: 'instrumento-1' });
    const datos = {
      tipoInstrumentoId: 'tipo-1',
      nombre: 'Apple Inc.',
      monedaId: 'moneda-1',
    };

    await crearInstrumento(datos);

    expect(mocks.postConCsrf).toHaveBeenCalledWith('/v1/instrumentos', datos);
  });

  it('actualiza un instrumento con PUT y CSRF', async () => {
    mocks.putConCsrf.mockResolvedValue({ id: 'instrumento-1' });
    const datos = {
      tipoInstrumentoId: 'tipo-1',
      nombre: 'Apple Inc.',
      monedaId: 'moneda-1',
    };

    await actualizarInstrumento('instrumento-1', datos);

    expect(mocks.putConCsrf).toHaveBeenCalledWith(
      '/v1/instrumentos/instrumento-1',
      datos,
    );
  });

  it('cambia el estado con PATCH y CSRF', async () => {
    mocks.patchConCsrf.mockResolvedValue({ id: 'instrumento-1' });

    await cambiarEstadoInstrumento('instrumento-1', false);

    expect(mocks.patchConCsrf).toHaveBeenCalledWith(
      '/v1/instrumentos/instrumento-1/estado',
      { activo: false },
    );
  });
});
