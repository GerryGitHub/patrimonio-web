import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listarCategoriasInstrumento,
  listarInstrumentos,
  listarTiposInstrumento,
} from '../api/instrumentos';
import type {
  ClaseActivo,
  Instrumento,
  TipoInstrumento,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { DataTable, type ColumnaTabla } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Boton, Campo, CampoSelect, Esqueleto } from '../components/ui';
import {
  IconoMas,
  IconoRecargar,
  IconoRentaFija,
  IconoVacio,
} from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import { formatearFechaHora } from '../lib/format';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

function coincideBusqueda(instrumento: Instrumento, busqueda: string): boolean {
  const texto = busqueda.trim().toLowerCase();
  if (!texto) {
    return true;
  }
  const campos = [
    instrumento.nombre,
    instrumento.simbolo,
    instrumento.emisor,
    instrumento.mercado,
    instrumento.identificadorExterno,
    instrumento.isin,
    instrumento.claseActivoNombre,
    instrumento.tipoInstrumentoNombre,
  ];
  return campos.some((campo) => campo?.toLowerCase().includes(texto));
}

export function InstrumentosPage() {
  const { marcarSesionExpirada } = useAuth();

  const [categorias, setCategorias] = useState<ClaseActivo[]>([]);
  const [tipos, setTipos] = useState<TipoInstrumento[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);

  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCargandoCatalogos(true);
    setErrorCatalogos(null);

    Promise.all([
      listarCategoriasInstrumento(),
      listarTiposInstrumento(),
    ])
      .then(([catalogoCategorias, catalogoTipos]) => {
        if (cancelado) {
          return;
        }
        setCategorias(catalogoCategorias);
        setTipos(catalogoTipos);
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorCatalogos(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoCatalogos(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [intento, marcarSesionExpirada]);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    listarInstrumentos({
      claseActivoId: filtroCategoria || undefined,
      tipoInstrumentoId: filtroTipo || undefined,
      activo:
        filtroEstado === 'todos' ? undefined : filtroEstado === 'activos',
    })
      .then((datos) => {
        if (!cancelado) {
          setInstrumentos(datos);
        }
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'instrumento'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [filtroCategoria, filtroTipo, filtroEstado, intento, marcarSesionExpirada]);

  const tiposFiltrados = useMemo(
    () =>
      filtroCategoria
        ? tipos.filter((tipo) => tipo.claseActivoId === filtroCategoria)
        : tipos,
    [tipos, filtroCategoria],
  );

  const instrumentosVisibles = useMemo(
    () =>
      instrumentos.filter((instrumento) =>
        coincideBusqueda(instrumento, busqueda),
      ),
    [instrumentos, busqueda],
  );

  const hayFiltros =
    busqueda.trim() !== '' ||
    filtroCategoria !== '' ||
    filtroTipo !== '' ||
    filtroEstado !== 'todos';

  function cambiarCategoria(valor: string) {
    setFiltroCategoria(valor);
    if (
      valor &&
      !tipos.some(
        (tipo) => tipo.id === filtroTipo && tipo.claseActivoId === valor,
      )
    ) {
      setFiltroTipo('');
    }
  }

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroTipo('');
    setFiltroEstado('todos');
  }

  const columnas: ColumnaTabla<Instrumento>[] = [
    {
      clave: 'instrumento',
      encabezado: 'Instrumento',
      render: (instrumento) => (
        <Link
          className="data-table__celda-principal"
          to={`/instrumentos/${encodeURIComponent(instrumento.id)}`}
          aria-label={`Ver el instrumento ${instrumento.nombre}`}
        >
          <span>
            <strong>{instrumento.nombre}</strong>
            <small>
              {instrumento.simbolo ?? 'Sin símbolo'}
              {instrumento.emisor ? ` · ${instrumento.emisor}` : ''}
            </small>
          </span>
        </Link>
      ),
    },
    {
      clave: 'categoria',
      encabezado: 'Categoría',
      render: (instrumento) => (
        <StatusBadge estado="info">
          {instrumento.claseActivoNombre}
        </StatusBadge>
      ),
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      ocultarEnMovil: true,
      render: (instrumento) => instrumento.tipoInstrumentoNombre,
    },
    {
      clave: 'moneda',
      encabezado: 'Moneda',
      render: (instrumento) => (
        <span className="moneda-chip">{instrumento.monedaCodigo}</span>
      ),
    },
    {
      clave: 'mercado',
      encabezado: 'Mercado',
      ocultarEnMovil: true,
      render: (instrumento) => instrumento.mercado ?? '-',
    },
    {
      clave: 'isin',
      encabezado: 'ISIN',
      ocultarEnMovil: true,
      render: (instrumento) => (
        <span className="dato-id">{instrumento.isin ?? '-'}</span>
      ),
    },
    {
      clave: 'actualizacion',
      encabezado: 'Actualizado',
      ocultarEnMovil: true,
      render: (instrumento) =>
        formatearFechaHora(instrumento.fechaActualizacion),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (instrumento) => (
        <StatusBadge estado={instrumento.activo ? 'activo' : 'inactivo'}>
          {instrumento.activo ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alineacion: 'derecha',
      render: (instrumento) => (
        <Link
          className="btn btn--fantasma btn--sm"
          to={`/instrumentos/${encodeURIComponent(instrumento.id)}`}
        >
          Ver
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Catálogo global"
        titulo="Instrumentos financieros"
        descripcion="Catálogo compartido de renta variable, renta fija y activos digitales. Los instrumentos se usan en las posiciones de tus cuentas."
        acciones={
          <>
            <Link className="btn btn--primario" to="/instrumentos/nuevo">
              <IconoMas />
              Nuevo instrumento
            </Link>
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar instrumentos"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </>
        }
        meta={
          <span className="dato-chip">
            <strong>{instrumentosVisibles.length}</strong>
            {instrumentosVisibles.length === 1
              ? 'instrumento'
              : 'instrumentos'}
          </span>
        }
      />

      {errorCatalogos ? (
        <ErrorState
          mensaje={errorCatalogos}
          titulo="No se pudo cargar el catálogo de categorías"
          onReintentar={recargar}
        />
      ) : (
        <FinancialCard
          titulo="Catálogo de instrumentos"
          subtitulo="La búsqueda cubre nombre, símbolo, emisor, mercado, identificador externo e ISIN."
          acciones={
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar catálogo"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          }
        >
          <div className="section-stack">
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
                etiqueta="Buscar"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Nombre, símbolo, ISIN…"
                autoComplete="off"
              />

              <CampoSelect
                etiqueta="Categoría"
                value={filtroCategoria}
                onChange={(evento) => cambiarCategoria(evento.target.value)}
                disabled={cargandoCatalogos}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect
                etiqueta="Tipo"
                value={filtroTipo}
                onChange={(evento) => setFiltroTipo(evento.target.value)}
                disabled={cargandoCatalogos}
              >
                <option value="">Todos los tipos</option>
                {tiposFiltrados.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect
                etiqueta="Estado"
                value={filtroEstado}
                onChange={(evento) =>
                  setFiltroEstado(evento.target.value as FiltroEstado)
                }
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </CampoSelect>
            </FilterBar>

            {error ? (
              <ErrorState
                mensaje={error}
                titulo="No se pudieron consultar los instrumentos"
                onReintentar={recargar}
              />
            ) : (
              <DataTable
                columnas={columnas}
                filas={instrumentosVisibles}
                obtenerClave={(instrumento) => instrumento.id}
                cargando={cargando}
                esqueleto={
                  <div className="tabla-esqueleto" aria-hidden="true">
                    {[0, 1, 2].map((indice) => (
                      <div className="tabla-esqueleto__fila" key={indice}>
                        <Esqueleto className="esqueleto--titulo" />
                        <Esqueleto className="esqueleto--linea" />
                      </div>
                    ))}
                  </div>
                }
                vacio={
                  hayFiltros ? (
                    <EmptyState
                      compacta
                      icono={<IconoVacio />}
                      titulo="No hay instrumentos con estos filtros"
                      descripcion="Prueba con otra búsqueda, categoría, tipo o estado, o limpia los filtros para ver todo el catálogo."
                      accion={
                        <Boton variante="secundario" onClick={limpiarFiltros}>
                          Limpiar filtros
                        </Boton>
                      }
                    />
                  ) : (
                    <EmptyState
                      compacta
                      icono={<IconoRentaFija />}
                      titulo="El catálogo está vacío"
                      descripcion="Registra el primer instrumento para poder asignarlo a las posiciones de tus cuentas."
                      accion={
                        <Link
                          className="btn btn--primario"
                          to="/instrumentos/nuevo"
                        >
                          <IconoMas />
                          Nuevo instrumento
                        </Link>
                      }
                    />
                  )
                }
              />
            )}
          </div>
        </FinancialCard>
      )}
    </div>
  );
}
