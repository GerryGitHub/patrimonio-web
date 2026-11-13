import { useCallback, useEffect, useRef, useState } from 'react';
import { listarPosiciones } from '../api/posiciones';
import type { Posicion } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';

function claveDe(portafolioId: string, cuentaId: string): string {
  return `${portafolioId}::${cuentaId}`;
}

export interface PosicionesCuenta {
  posiciones: Posicion[];
  cargando: boolean;
  error: string | null;
  /** Clave de la cuenta a la que pertenecen las posiciones expuestas. */
  cargadasPara: string | null;
  recargar: () => void;
}

/**
 * Carga las posiciones de la cuenta seleccionada.
 *
 * <p>`cargadasPara` permite descartar respuestas de una cuenta anterior: la
 * pantalla solo usa las posiciones cuando la clave coincide con la selección
 * actual. Además se vuelve a comprobar el identificador de cada posición.</p>
 */
export function usePosicionesCuenta(
  portafolioId: string,
  cuentaId: string,
  habilitado: boolean,
): PosicionesCuenta {
  const { marcarSesionExpirada } = useAuth();

  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargadasPara, setCargadasPara] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const peticion = useRef(0);

  useEffect(() => {
    if (!habilitado || !cuentaId) {
      setPosiciones([]);
      setCargando(false);
      setError(null);
      setCargadasPara(null);
      return;
    }

    const token = peticion.current + 1;
    peticion.current = token;
    const vigente = () => peticion.current === token;

    setCargando(true);
    setError(null);

    listarPosiciones(portafolioId, { cuentaId })
      .then((registradas) => {
        if (!vigente()) {
          return;
        }
        setPosiciones(
          registradas.filter((posicion) => posicion.cuentaId === cuentaId),
        );
        setCargadasPara(claveDe(portafolioId, cuentaId));
      })
      .catch((fallo: unknown) => {
        if (!vigente()) {
          return;
        }
        setCargadasPara(null);
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'posicion'));
      })
      .finally(() => {
        if (vigente()) {
          setCargando(false);
        }
      });

    return () => {
      peticion.current += 1;
    };
  }, [portafolioId, cuentaId, habilitado, intento, marcarSesionExpirada]);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  return {
    posiciones,
    cargando,
    error,
    cargadasPara,
    recargar,
  };
}
