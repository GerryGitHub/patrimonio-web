import { API_BASE_URL } from '../config';

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
}

/**
 * Error HTTP normalizado.
 *
 * <p>Conserva el código estable del backend y el detalle, pero la interfaz
 * decide qué mensaje mostrar. Nunca incluye la respuesta cruda ni datos
 * sensibles.</p>
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: string;

  constructor(status: number, code?: string, detail?: string) {
    super(detail ?? `Error HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  get esNoAutenticado(): boolean {
    return this.status === 401;
  }
}

type FetchImpl = typeof fetch;

export interface OpcionesCliente {
  baseUrl?: string;
  fetchImpl?: FetchImpl;
}

export interface ClienteHttp {
  get<T>(path: string): Promise<T>;
  post<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T>;
}

export function crearClienteHttp(
  opciones: OpcionesCliente = {},
): ClienteHttp {
  const baseUrl = (opciones.baseUrl ?? API_BASE_URL).replace(/\/+$/, '');
  const fetchImpl = opciones.fetchImpl ?? fetch;

  async function solicitar<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      let problema: ProblemDetail | undefined;
      try {
        problema = (await response.json()) as ProblemDetail;
      } catch {
        problema = undefined;
      }
      throw new ApiError(
        response.status,
        problema?.code,
        problema?.detail ?? problema?.title,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string) => solicitar<T>(path),
    post: <T>(
      path: string,
      body?: unknown,
      headers?: Record<string, string>,
    ) =>
      solicitar<T>(path, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
        headers,
      }),
  };
}

/** Cliente compartido por los servicios de la aplicación. */
export const http = crearClienteHttp();
