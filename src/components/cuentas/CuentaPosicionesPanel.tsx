import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Posicion } from '../../api/types';
import type { ResumenCuenta } from '../../lib/cuentas';
import { normalizarTexto } from '../../lib/texto';
import { CostosMoneda } from '../CostosMoneda';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { FilterBar } from '../FilterBar';
import { MetricCard } from '../MetricCard';
import { PosicionesTabla } from '../PosicionesTabla';
import { Boton, Campo, CampoSelect, Esqueleto } from '../ui';
import {
  IconoMas,
  IconoRecargar,
  IconoRentaFija,
  IconoVacio,
} from '../icons';

type FiltroEstadoPosiciones = 'todas' | 'activas' | 'inactivas';

interface CuentaPosicionesPanelProps {
  portafolioId: string;
  posiciones: Posicion[];
  resumen: ResumenCuenta;
  cargando: boolean;
  error: string | null;
  enlaceNuevaPosicion: string;
  onRecargar: () => void;
}

/**
 * Pestaña de posiciones de la cuenta.
 *
 * <p>Reutiliza la tabla y el agregado por moneda del módulo de inversiones.
 * Conserva los filtros, los estados vacíos, el error y el reintento; la
 * navegación al detalle de cada posición la resuelve `PosicionesTabla`.</p>
 */
export function CuentaPosicionesPanel({
  portafolioId,
  posiciones,
  resumen,
  cargando,
  error,
  enlaceNuevaPosicion,
  onRecargar,
}: CuentaPosicionesPanelProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstadoPosiciones>('todas');

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todas';

  const filtradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return posiciones.filter((posicion) => {
      if (
        filtroEstado !== 'todas' &&
        posicion.activo !== (filtroEstado === 'activas')
      ) {
        return false;
      }
      if (!texto) {
        return true;
      }

      return normalizarTexto(
        [
          posicion.instrumentoNombre,
          posicion.instrumentoSimbolo ?? '',
          posicion.claseActivoNombre,
          posicion.tipoInstrumentoNombre,
        ].join(' '),
      ).includes(texto);
    });
  }, [posiciones, busqueda, filtroEstado]);

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroEstado('todas');
  }

  if (cargando) {
    return (
      <div className="section-stack" aria-hidden="true">
        <Esqueleto className="esqueleto--titulo" />
        <Esqueleto className="esqueleto--linea" />
        <Esqueleto className="esqueleto--linea" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        mensaje={error}
        titulo="No se pudieron consultar las posiciones"
        onReintentar={onRecargar}
      />
    );
  }

  if (resumen.total === 0) {
    return (
      <EmptyState
        compacta
        icono={<IconoRentaFija />}
        titulo="Esta cuenta no tiene posiciones"
        descripcion="Registra la posición inicial de un instrumento para dar seguimiento a esta cuenta."
        accion={
          <Link className="btn btn--primario" to={enlaceNuevaPosicion}>
            <IconoMas />
            Registrar posición
          </Link>
        }
      />
    );
  }

  return (
    <div className="section-stack">
      <div className="metric-grid">
        <MetricCard etiqueta="Posiciones" valor={resumen.total} />
        <MetricCard
          etiqueta="Activas"
          valor={resumen.activas}
          tono="positivo"
        />
        <MetricCard
          etiqueta="Inactivas"
          valor={resumen.inactivas}
          tono="lavanda"
        />
        <MetricCard
          etiqueta="Costo por moneda"
          valor={
            <CostosMoneda
              costos={resumen.costoPorMoneda}
              compacto
              vacio="Sin costo"
            />
          }
          ayuda="Costo registrado por moneda. No es efectivo ni valor de mercado."
        />
      </div>

      <FilterBar
        acciones={
          hayFiltros ? (
            <Boton variante="fantasma" onClick={limpiarFiltros}>
              Limpiar filtros
            </Boton>
          ) : null
        }
      >
        <Campo
          etiqueta="Buscar posición"
          type="search"
          placeholder="Instrumento, símbolo o categoría"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Estado de la posición"
          value={filtroEstado}
          onChange={(evento) =>
            setFiltroEstado(evento.target.value as FiltroEstadoPosiciones)
          }
        >
          <option value="todas">Todos los estados</option>
          <option value="activas">Solo activas</option>
          <option value="inactivas">Solo inactivas</option>
        </CampoSelect>
      </FilterBar>

      <div className="acciones-en-linea">
        <Boton
          variante="secundario"
          onClick={onRecargar}
          aria-label="Actualizar posiciones de la cuenta"
        >
          <IconoRecargar />
          Actualizar
        </Boton>
        <Link className="btn btn--secundario" to={enlaceNuevaPosicion}>
          <IconoMas />
          Registrar posición
        </Link>
      </div>

      <PosicionesTabla
        portafolioId={portafolioId}
        posiciones={filtradas}
        vacio={
          <EmptyState
            compacta
            icono={<IconoVacio />}
            titulo="No hay posiciones con estos filtros"
            descripcion="Prueba con otro instrumento o estado, o limpia los filtros para ver todas las posiciones de la cuenta."
            accion={
              <Boton variante="secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            }
          />
        }
      />
    </div>
  );
}
