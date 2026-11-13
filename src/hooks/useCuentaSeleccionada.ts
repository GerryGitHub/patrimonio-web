import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerCuenta } from '../api/cuentas';
import type { CuentaFinanciera } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';

export interface CuentaSeleccionada {
  cuenta: CuentaFinanciera | null;
  cargando: boolean;
  error: string | null;
  noEncontrada: boolean;
  recargar: () => void;
  aplicarCuenta: (actualizada: CuentaFinanciera) => void;
}

/**
 * Consulta la cuenta indicada por la ruta.
 *
 * <p>La cuenta expuesta solo es la que corresponde al identificador actual: si
 * una petición anterior responde tarde (o si cambia el portafolio), su
 * resultado se descarta y nunca se presenta como la selección vigente.</p>
 */
export function useCuentaSeleccionada(
  portafolioId: string,
  cuentaId: string,
  habilitado: boolean,
): CuentaSeleccionada {
  const { marcarSesionExpirada } = useAuth();

  const [cuenta, setCuenta] = useState<CuentaFinanciera | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [intento, setIntento] = useState(0);

  const peticion = useRef(0);
  const cuentaVigente = useRef(cuentaId);

  useEffect(() => {
    cuentaVigente.current = cuentaId;
  }, [cuentaId]);

  useEffect(() => {
    if (!habilitado || !cuentaId) {
      setCuenta(null);
      setCargando(false);
      setError(null);
      setNoEncontrada(false);
      return;
    }

    const token = peticion.current + 1;
    peticion.current = token;
    const vigente = () => peticion.current === token;

    // No se conserva la cuenta anterior mientras se carga la nueva.
    setCuenta(null);
    setCargando(true);
    setError(null);
    setNoEncontrada(false);

    obtenerCuenta(portafolioId, cuentaId)
      .then((datos) => {
        if (!vigente()) {
          return;
        }
        setCuenta(datos.id === cuentaId ? datos : null);
      })
      .catch((fallo: unknown) => {
        if (!vigente()) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        if (esNoEncontrado(fallo)) {
          setNoEncontrada(true);
          return;
        }
        setError(mensajeDeError(fallo, 'cuenta'));
      })
      .finally(() => {
        if (vigente()) {
          setCargando(false);
        }
      });

    return () => {
      peticion.current += 1;
    };
  }, [
    portafolioId,
    cuentaId,
    habilitado,
    intento,
    marcarSesionExpirada,
  ]);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  const aplicarCuenta = useCallback((actualizada: CuentaFinanciera) => {
    if (actualizada.id !== cuentaVigente.current) {
      return;
    }
    setCuenta(actualizada);
  }, []);

  return {
    cuenta: cuenta && cuenta.id === cuentaId ? cuenta : null,
    cargando,
    error,
    noEncontrada,
    recargar,
    aplicarCuenta,
  };
}
