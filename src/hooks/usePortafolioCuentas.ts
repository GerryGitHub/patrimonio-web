import { useCallback, useEffect, useRef, useState } from 'react';
import { listarCuentas, listarTiposCuenta } from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import type {
  CuentaFinanciera,
  Institucion,
  Moneda,
  Portafolio,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';

export interface PortafolioCuentas {
  portafolio: Portafolio | null;
  cuentas: CuentaFinanciera[];
  instituciones: Institucion[];
  tiposCuenta: TipoCuenta[];
  monedas: Moneda[];
  cargando: boolean;
  error: string | null;
  noEncontrado: boolean;
  /** Portafolio al que pertenecen los datos cargados. */
  cargadoPara: string | null;
  recargar: () => void;
  aplicarCuentaActualizada: (cuenta: CuentaFinanciera) => void;
}

/**
 * Carga el portafolio solicitado junto con sus cuentas y catálogos.
 *
 * <p>Cada carga lleva un token propio: una respuesta que llega después de
 * cambiar de portafolio (o de pedir una recarga) se descarta. `cargadoPara`
 * indica a qué portafolio pertenecen realmente los datos expuestos, de modo que
 * quien consume el hook nunca presenta datos de un portafolio anterior.</p>
 */
export function usePortafolioCuentas(portafolioId: string): PortafolioCuentas {
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [cargadoPara, setCargadoPara] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const peticion = useRef(0);

  useEffect(() => {
    const token = peticion.current + 1;
    peticion.current = token;
    const vigente = () => peticion.current === token;

    setCargando(true);
    setError(null);
    setNoEncontrado(false);
    // Los datos del portafolio anterior dejan de ser válidos en cuanto cambia
    // la ruta: no se muestran mientras llega la nueva respuesta.
    setPortafolio(null);
    setCuentas([]);
    setCargadoPara(null);

    async function cargar() {
      try {
        const [
          portafolios,
          cuentasPortafolio,
          catalogoInstituciones,
          catalogoTipos,
          catalogoMonedas,
        ] = await Promise.all([
          listarPortafolios(),
          listarCuentas(portafolioId),
          listarInstituciones(),
          listarTiposCuenta(),
          listarMonedas(),
        ]);

        if (!vigente()) {
          return;
        }

        const encontrado =
          portafolios.find((elemento) => elemento.id === portafolioId) ?? null;

        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);
        setMonedas(catalogoMonedas);

        if (!encontrado) {
          setPortafolio(null);
          setCuentas([]);
          setNoEncontrado(true);
          return;
        }

        const respuesta = {
          portafolio: encontrado,
          cuentas: cuentasPortafolio,
        };

        setPortafolio(respuesta.portafolio);
        setCuentas(respuesta.cuentas);
        setCargadoPara(portafolioId);
      } catch (fallo) {
        if (!vigente()) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        if (esNoEncontrado(fallo)) {
          setNoEncontrado(true);
          return;
        }
        setError(mensajeDeError(fallo, 'datos'));
      } finally {
        if (vigente()) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      // Invalida la petición en curso al desmontar o cambiar de portafolio.
      peticion.current += 1;
    };
  }, [portafolioId, intento, marcarSesionExpirada]);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  const aplicarCuentaActualizada = useCallback(
    (actualizada: CuentaFinanciera) => {
      setCuentas((actuales) =>
        actuales.map((elemento) =>
          elemento.id === actualizada.id ? actualizada : elemento,
        ),
      );
    },
    [],
  );

  return {
    portafolio,
    cuentas,
    instituciones,
    tiposCuenta,
    monedas,
    cargando,
    error,
    noEncontrado,
    cargadoPara,
    recargar,
    aplicarCuentaActualizada,
  };
}
