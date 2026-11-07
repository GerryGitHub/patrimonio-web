import { describe, expect, it, vi } from 'vitest';
import { ApiError, crearClienteHttp } from './http';

function respuestaJson(
  cuerpo: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('crearClienteHttp', () => {
  it('hace GET con credenciales y cabecera Accept', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      respuestaJson([{ id: '1', nombre: 'Portafolio' }]),
    );
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    const datos = await cliente.get<unknown[]>('/v1/portafolios');

    expect(datos).toEqual([{ id: '1', nombre: 'Portafolio' }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/api/v1/portafolios');
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('Accept')).toBe('application/json');
  });

  it('serializa el cuerpo JSON en POST', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      respuestaJson({ id: '1' }, 201),
    );
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    await cliente.post('/auth/registro', { nombre: 'María' }, {
      'X-XSRF-TOKEN': 'token',
    });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ nombre: 'María' }));
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(new Headers(init.headers).get('X-XSRF-TOKEN')).toBe('token');
  });

  it('serializa el cuerpo JSON en PUT', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuestaJson({ id: '1' }));
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    await cliente.put('/v1/portafolios/1/cuentas/2', { nombre: 'Editada' });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ nombre: 'Editada' }));
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('serializa el cuerpo JSON en PATCH', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuestaJson({ id: '1' }));
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    await cliente.patch('/v1/portafolios/1/cuentas/2/estado', {
      activo: false,
    });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ activo: false }));
  });

  it('devuelve undefined en respuestas 204', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    await expect(cliente.post('/auth/logout')).resolves.toBeUndefined();
  });

  it('convierte un ProblemDetail en ApiError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      respuestaJson(
        {
          status: 409,
          code: 'EMAIL_DUPLICADO',
          detail: 'Ya existe una cuenta con ese correo electrónico.',
        },
        409,
      ),
    );
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    await expect(cliente.post('/auth/registro', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'EMAIL_DUPLICADO',
    });
  });

  it('crea ApiError aunque el error no sea JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('<html>error</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api',
      fetchImpl,
    });

    const error = await cliente.get('/v1/portafolios').catch((fallo) => fallo);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).code).toBeUndefined();
  });

  it('elimina las barras finales de la URL base', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuestaJson({}));
    const cliente = crearClienteHttp({
      baseUrl: 'http://localhost:8080/api///',
      fetchImpl,
    });

    await cliente.get('/auth/me');

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'http://localhost:8080/api/auth/me',
    );
  });
});
