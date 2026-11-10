import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarCategoriasInstrumento } from '../api/instrumentos';
import {
  listarPosiciones,
  obtenerResumenPosiciones,
} from '../api/posiciones';
import type {
  ClaseActivo,
  Posicion,
  ResumenPosiciones,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CostosMoneda } from '../components/CostosMoneda';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { PosicionesTabla } from '../components/PosicionesTabla';
import { StatusBadge } from '../components/StatusBadge';
import { Esqueleto } from '../components/ui';
import {
  IconoAcciones,
  IconoCripto,
  IconoInmueble,
  IconoMas,
  IconoOtros,
  IconoRentaFija,
  IconoVehiculo,
  IconoVolver,
} from '../components/icons';
import {
  esNoAutenticado,
  mensajeDeError,
} from '../lib/errors';
import { combinarResumenes } from '../lib/inversiones';
import {
  PORTAFOLIO_TODOS,
  usePortafolios,
} from '../portfolio/PortfolioContext';

interface CategoriaConfig {
  titulo: string;
  descripcion: string;
  detalle: string;
  claseActivo: string | null;
  Icono: typeof IconoRentaFija;
}

const CATEGORIAS: Record<string, CategoriaConfig> = {
  'renta-fija': {
    titulo: 'Renta fija',
    descripcion:
      'Instrumentos de deuda, tasas pactadas, cupones y vencimientos.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones y valuaciones de renta fija.',
    claseActivo: 'Renta fija',
    Icono: IconoRentaFija,
  },
  'acciones-etfs': {
    titulo: 'Acciones y ETFs',
    descripcion: 'Posiciones de renta variable y fondos cotizados.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones, precios de mercado y valuaciones.',
    claseActivo: 'Renta variable',
    Icono: IconoAcciones,
  },
  criptomonedas: {
    titulo: 'Criptomonedas',
    descripcion: 'Activos digitales y saldos mantenidos en exchanges.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones y precios de activos digitales.',
    claseActivo: 'Activos digitales',
    Icono: IconoCripto,
  },
  inmuebles: {
    titulo: 'Inmuebles',
    descripcion: 'Propiedades y activos inmobiliarios.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de inmuebles.',
    claseActivo: null,
    Icono: IconoInmueble,
  },
  vehiculos: {
    titulo: 'Vehículos',
    descripcion: 'Vehículos y otros bienes muebles.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de vehículos.',
    claseActivo: null,
    Icono: IconoVehiculo,
  },
  otros: {
    titulo: 'Otros activos',
    descripcion: 'Bienes, colecciones y activos no clasificados.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de otros activos.',
    claseActivo: null,
    Icono: IconoOtros,
  },
};

function normalizar(valor: string): string {
  return valor.trim().toLocaleLowerCase('es');
}

export function AssetCategoryPage() {
  const { categoria = '' } = useParams();
  const config = CATEGORIAS[categoria] ?? null;
  const soportada = Boolean(config?.claseActivo);
  const Icono = config?.Icono ?? IconoOtros;

  const { marcarSesionExpirada } = useAuth();
  const {
    portafolios,
    cargando: cargandoPortafolios,
    error: errorPortafolios,
    seleccionadoId,
    recargar: recargarPortafolios,
    revision,
  } = usePortafolios();

  const ids = useMemo(() => {
    if (seleccionadoId === PORTAFOLIO_TODOS || seleccionadoId === null) {
      return portafolios.map((portafolio) => portafolio.id);
    }
    return [seleccionadoId];
  }, [portafolios, seleccionadoId]);

  const idsClave = ids.join(',');

  const [claseActivoId, setClaseActivoId] = useState<string | null>(null);
  const [cargandoClase, setCargandoClase] = useState(soportada);
  const [errorClase, setErrorClase] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [portafolioPorPosicion, setPortafolioPorPosicion] = useState<
    Map<string, string>
  >(new Map());
  const [resumen, setResumen] = useState<ResumenPosiciones | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    if (!soportada || !config?.claseActivo) {
      return;
    }

    let cancelado = false;
    setCargandoClase(true);
    setErrorClase(null);

    listarCategoriasInstrumento()
      .then((catalogo: ClaseActivo[]) => {
        if (cancelado) {
          return;
        }
        const encontrada = catalogo.find(
          (clase) =>
            normalizar(clase.nombre) === normalizar(config.claseActivo ?? ''),
        );
        if (!encontrada) {
          setErrorClase(
            'La categoría no está configurada en el catálogo del backend.',
          );
          return;
        }
        setClaseActivoId(encontrada.id);
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorClase(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoClase(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [soportada, config?.claseActivo, intento, marcarSesionExpirada]);

  useEffect(() => {
    if (!soportada || !claseActivoId || ids.length === 0) {
      setPosiciones([]);
      setPortafolioPorPosicion(new Map());
      setResumen(null);
      setCargando(false);
      setError(null);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    Promise.all(
      ids.map(async (portafolioId) => {
        const [lista, resumenPortafolio] = await Promise.all([
          listarPosiciones(portafolioId, { claseActivoId }),
          obtenerResumenPosiciones(portafolioId),
        ]);
        return { portafolioId, lista, resumenPortafolio };
      }),
    )
      .then((resultados) => {
        if (cancelado) {
          return;
        }

        const mapa = new Map<string, string>();
        const todas: Posicion[] = [];
        for (const resultado of resultados) {
          for (const posicion of resultado.lista) {
            mapa.set(posicion.id, resultado.portafolioId);
            todas.push(posicion);
          }
        }

        setPosiciones(todas);
        setPortafolioPorPosicion(mapa);
        setResumen(
          combinarResumenes(
            resultados.map((resultado) => resultado.resumenPortafolio),
          ),
        );
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'posicion'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
    // `idsClave` resume la lista de portafolios para evitar bucles por
    // identidad de arreglo; `revision` refresca al cambiar de portafolio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    soportada,
    claseActivoId,
    idsClave,
    revision,
    intento,
    marcarSesionExpirada,
  ]);

  const distribucion = resumen?.distribucionPorCategoria.find(
    (elemento) => elemento.claseActivoId === claseActivoId,
  );
  const instrumentosDistintos = new Set(
    posiciones.map((posicion) => posicion.instrumentoId),
  ).size;

  const portafolioDestino =
    seleccionadoId && seleccionadoId !== PORTAFOLIO_TODOS
      ? seleccionadoId
      : (portafolios[0]?.id ?? null);

  const enlacePosiciones = portafolioDestino
    ? `/activos/liquidez/${encodeURIComponent(
        portafolioDestino,
      )}/posiciones`
    : '/activos/liquidez';

  if (!config) {
    return (
      <div className="page">
        <Link className="volver" to="/activos">
          <IconoVolver />
          Volver a Mis activos
        </Link>

        <PageHeader
          eyebrow="Mis activos"
          titulo="Categoría de activos"
          descripcion="Esta categoría todavía no está disponible en el contrato actual."
        />

        <FinancialCard
          titulo="Categoría no habilitada"
          subtitulo="No se muestran posiciones, importes ni porcentajes simulados."
        >
          <EmptyState
            icono={<IconoOtros />}
            titulo="Categoría no habilitada"
            descripcion="La categoría se habilitará cuando exista el contrato correspondiente en el backend."
            accion={
              <Link className="btn btn--secundario" to="/activos">
                Volver a Mis activos
              </Link>
            }
          />
        </FinancialCard>
      </div>
    );
  }

  if (!soportada) {
    return (
      <div className="page">
        <Link className="volver" to="/activos">
          <IconoVolver />
          Volver a Mis activos
        </Link>

        <PageHeader
          eyebrow="Mis activos"
          titulo={config.titulo}
          descripcion={config.descripcion}
          meta={<StatusBadge estado="pendiente">Módulo pendiente</StatusBadge>}
        />

        <FinancialCard
          titulo="Preparada para la siguiente entrega"
          subtitulo="No se muestran posiciones, importes ni porcentajes simulados."
        >
          <EmptyState
            icono={<Icono />}
            titulo="Categoría no habilitada"
            descripcion={config.detalle}
            accion={
              <Link className="btn btn--secundario" to="/activos">
                Volver a Mis activos
              </Link>
            }
          />
        </FinancialCard>
      </div>
    );
  }

  const errorGeneral = errorPortafolios ?? errorClase ?? error;
  const cargandoGeneral =
    cargandoPortafolios || cargandoClase || (ids.length > 0 && cargando);

  return (
    <div className="page">
      <Link className="volver" to="/activos">
        <IconoVolver />
        Volver a Mis activos
      </Link>

      <PageHeader
        eyebrow="Mis activos"
        titulo={config.titulo}
        descripcion={config.descripcion}
        acciones={
          <Link className="btn btn--secundario" to={enlacePosiciones}>
            <IconoMas />
            Ver todas las posiciones
          </Link>
        }
        meta={
          <StatusBadge estado={posiciones.length > 0 ? 'activo' : 'neutral'}>
            {posiciones.length > 0
              ? `${posiciones.length} ${
                  posiciones.length === 1 ? 'posición' : 'posiciones'
                }`
              : 'Sin posiciones'}
          </StatusBadge>
        }
      />

      {errorGeneral ? (
        <ErrorState
          mensaje={errorGeneral}
          titulo="No se pudo cargar la categoría"
          onReintentar={() => {
            recargarPortafolios();
            recargar();
          }}
        />
      ) : cargandoGeneral ? (
        <FinancialCard
          titulo="Posiciones de la categoría"
          subtitulo="Consultando las posiciones reales del portafolio…"
        >
          <div className="section-stack" aria-hidden="true">
            <Esqueleto className="esqueleto--titulo" />
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
        </FinancialCard>
      ) : portafolios.length === 0 ? (
        <EmptyState
          icono={<Icono />}
          titulo="Aún no tienes portafolios"
          descripcion="Crea un portafolio y registra sus cuentas para poder añadir posiciones a esta categoría."
          accion={
            <Link className="btn btn--primario" to="/activos/liquidez">
              <IconoMas />
              Crear portafolio
            </Link>
          }
        />
      ) : (
        <>
          <section aria-label={`Resumen de ${config.titulo}`}>
            <div className="metric-grid">
              <MetricCard etiqueta="Posiciones" valor={posiciones.length} />
              <MetricCard
                etiqueta="Instrumentos distintos"
                valor={instrumentosDistintos}
                tono="lavanda"
              />
              <MetricCard
                etiqueta="Costo agregado"
                valor={
                  <CostosMoneda
                    costos={distribucion?.costoPorMoneda ?? []}
                    compacto
                    vacio="Sin costo"
                  />
                }
                ayuda="Costo registrado por moneda. No es valor de mercado."
              />
            </div>
          </section>

          <FinancialCard
            titulo={`Posiciones de ${config.titulo.toLowerCase()}`}
            subtitulo="Solo se muestran posiciones reales registradas en tus cuentas. El costo no representa una valuación de mercado."
          >
            <PosicionesTabla
              portafolioId={portafolioDestino ?? ''}
              posiciones={posiciones}
              portafolioIdDe={(posicion) =>
                portafolioPorPosicion.get(posicion.id) ?? portafolioDestino ?? ''
              }
              vacio={
                <EmptyState
                  compacta
                  icono={<Icono />}
                  titulo="Todavía no hay posiciones en esta categoría"
                  descripcion="Registra una posición con un instrumento de esta categoría para verla aquí."
                  accion={
                    <Link className="btn btn--primario" to={enlacePosiciones}>
                      <IconoMas />
                      Ir a posiciones
                    </Link>
                  }
                />
              }
            />
          </FinancialCard>
        </>
      )}
    </div>
  );
}
