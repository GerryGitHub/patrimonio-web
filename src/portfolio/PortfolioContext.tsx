import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { listarPortafolios } from '../api/portafolios';
import type { Portafolio } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';

const CLAVE_SELECCION = 'patrimonio360.portafolioActivo';
const TODOS = 'todos';

export type SeleccionPortafolio = string | typeof TODOS | null;

interface PortfolioContextValue {
  portafolios: Portafolio[];
  cargando: boolean;
  error: string | null;
  seleccionadoId: SeleccionPortafolio;
  seleccionado: Portafolio | null;
  seleccionar: (id: SeleccionPortafolio) => void;
  recargar: () => void;
  revision: number;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function leerSeleccion(): SeleccionPortafolio {
  try {
    const valor = window.sessionStorage.getItem(CLAVE_SELECCION);
    if (valor === TODOS) {
      return TODOS;
    }
    return valor || null;
  } catch {
    return null;
  }
}

function guardarSeleccion(id: SeleccionPortafolio) {
  try {
    if (id) {
      window.sessionStorage.setItem(CLAVE_SELECCION, id);
    } else {
      window.sessionStorage.removeItem(CLAVE_SELECCION);
    }
  } catch {
    // El almacenamiento puede estar deshabilitado; la sesión sigue funcionando.
  }
}

/**
 * Contexto único del portafolio activo.
 *
 * <p>Consulta `GET /api/v1/portafolios` y conserva únicamente el identificador
 * seleccionado en `sessionStorage`. No guarda datos financieros ni duplica el
 * estado de autenticación. El contador `revision` permite que la sección
 * visible vuelva a consultar sus datos cuando cambia la selección o se pide
 * una actualización explícita.</p>
 */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { usuario, marcarSesionExpirada } = useAuth();

  const [portafolios, setPortafolios] = useState<Portafolio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] =
    useState<SeleccionPortafolio>(() => leerSeleccion());
  const [revision, setRevision] = useState(0);
  const [intento, setIntento] = useState(0);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!usuario) {
      setPortafolios([]);
      setError(null);
      setCargando(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    listarPortafolios()
      .then((datos) => {
        if (cancelado) {
          return;
        }
        setPortafolios(datos);

        setSeleccionadoId((actual) => {
          const guardado = actual === TODOS ? TODOS : actual;
          const existe = datos.some((portafolio) => portafolio.id === guardado);
          const siguiente: SeleccionPortafolio = existe
            ? guardado
            : datos.length > 0
              ? datos[0]?.id ?? null
              : null;
          guardarSeleccion(siguiente);
          return siguiente;
        });
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [usuario, intento, marcarSesionExpirada]);

  const seleccionRef = useRef<SeleccionPortafolio>(seleccionadoId);

  useEffect(() => {
    seleccionRef.current = seleccionadoId;
  }, [seleccionadoId]);

  const seleccionar = useCallback((id: SeleccionPortafolio) => {
    if (seleccionRef.current === id) {
      return;
    }
    seleccionRef.current = id;
    setSeleccionadoId(id);
    guardarSeleccion(id);
    setRevision((valor) => valor + 1);
  }, []);

  const recargar = useCallback(() => {
    setIntento((valor) => valor + 1);
    setRevision((valor) => valor + 1);
  }, []);

  const seleccionado = useMemo(() => {
    if (!seleccionadoId || seleccionadoId === TODOS) {
      return null;
    }
    return (
      portafolios.find((portafolio) => portafolio.id === seleccionadoId) ??
      null
    );
  }, [portafolios, seleccionadoId]);

  const valor = useMemo<PortfolioContextValue>(
    () => ({
      portafolios,
      cargando,
      error,
      seleccionadoId,
      seleccionado,
      seleccionar,
      recargar,
      revision,
    }),
    [
      portafolios,
      cargando,
      error,
      seleccionadoId,
      seleccionado,
      seleccionar,
      recargar,
      revision,
    ],
  );

  return (
    <PortfolioContext.Provider value={valor}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortafolios(): PortfolioContextValue {
  const contexto = useContext(PortfolioContext);
  if (!contexto) {
    throw new Error('usePortafolios debe usarse dentro de PortfolioProvider.');
  }
  return contexto;
}

export const PORTAFOLIO_TODOS = TODOS;
