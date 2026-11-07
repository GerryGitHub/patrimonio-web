import { useCallback, useEffect, useState } from 'react';
import { listarInstituciones } from '../api/instituciones';
import type {
  FiltrosInstituciones,
  Institucion,
  TipoInstitucion,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CrearInstitucionForm } from '../components/CrearInstitucionForm';
import { DataTable, type ColumnaTabla } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Alerta, Boton, CampoSelect, Esqueleto } from '../components/ui';
import {
  IconoInstitucion,
  IconoMas,
  IconoRecargar,
  IconoVacio,
} from '../components/icons';
import {
  etiquetaTipoInstitucion,
  TIPOS_INSTITUCION,
  urlSegura,
} from '../lib/catalogos';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export function InstitucionesPage() {
  const { marcarSesionExpirada } = useAuth();

  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [tipo, setTipo] = useState<TipoInstitucion | ''>('');
  const [estado, setEstado] = useState<FiltroEstado>('todos');

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Institucion | null>(null);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    const filtros: FiltrosInstituciones = {};
    if (tipo) {
      filtros.tipo = tipo;
    }
    if (estado !== 'todos') {
      filtros.activo = estado === 'activos';
    }

    setCargando(true);
    setError(null);

    listarInstituciones(filtros)
      .then((datos) => {
        if (!cancelado) {
          setInstituciones(datos);
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
        setError(mensajeDeError(fallo, 'institucion'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [tipo, estado, intento, marcarSesionExpirada]);

  function alCrear(creada: Institucion) {
    setConfirmacion(creada);
    setMostrandoFormulario(false);
    setTipo('');
    setEstado('todos');
    recargar();
  }

  function limpiarFiltros() {
    setTipo('');
    setEstado('todos');
  }

  const hayFiltros = tipo !== '' || estado !== 'todos';

  const columnas: ColumnaTabla<Institucion>[] = [
    {
      clave: 'institucion',
      encabezado: 'Institución',
      render: (institucion) => (
        <span className="data-table__celda-principal">
          <span>
            <strong>{institucion.nombre}</strong>
            <small>{institucion.pais ?? 'País no registrado'}</small>
          </span>
        </span>
      ),
    },
    {
      clave: 'categoria',
      encabezado: 'Categoría',
      render: (institucion) => (
        <span className="etiqueta-categoria">
          {etiquetaTipoInstitucion(institucion.tipo)}
        </span>
      ),
    },
    {
      clave: 'sitio',
      encabezado: 'Sitio web',
      ocultarEnMovil: true,
      render: (institucion) => {
        const sitio = urlSegura(institucion.sitioWeb);
        if (!sitio) {
          return (
            <span className="institucion__sin-sitio">Sin sitio web</span>
          );
        }
        return (
          <a
            className="institucion__sitio"
            href={sitio}
            target="_blank"
            rel="noreferrer noopener"
          >
            {institucion.sitioWeb}
          </a>
        );
      },
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (institucion) => (
        <StatusBadge estado={institucion.activo ? 'activo' : 'inactivo'}>
          {institucion.activo ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      ),
    },
  ];

  const esqueletoTabla = (
    <div className="instituciones" aria-hidden="true">
      {[0, 1, 2].map((indice) => (
        <div className="institucion institucion--esqueleto" key={indice}>
          <Esqueleto className="esqueleto--icono" />
          <Esqueleto className="esqueleto--titulo" />
          <Esqueleto className="esqueleto--linea" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Configuración · Catálogos"
        titulo="Instituciones financieras"
        descripcion="Bancos, SOFIPOs, casas de bolsa, exchanges y otras instituciones reutilizables en tus cuentas."
        acciones={
          <>
            {!mostrandoFormulario ? (
              <Boton onClick={() => setMostrandoFormulario(true)}>
                <IconoMas />
                Nueva institución
              </Boton>
            ) : null}
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar instituciones"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </>
        }
        meta={
          cargando ? null : (
            <span className="dato-chip">
              <strong>{instituciones.length}</strong>
              {instituciones.length === 1 ? 'institución' : 'instituciones'}
            </span>
          )
        }
      />

      {confirmacion ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>
              Institución «{confirmacion.nombre}» registrada correctamente.
            </span>
            <Boton
              variante="secundario"
              onClick={() => setConfirmacion(null)}
            >
              Entendido
            </Boton>
          </div>
        </Alerta>
      ) : null}

      {mostrandoFormulario ? (
        <CrearInstitucionForm
          onCreada={alCrear}
          onCancelar={() => setMostrandoFormulario(false)}
        />
      ) : null}

      <FinancialCard
        titulo="Catálogo compartido"
        subtitulo="Filtra por categoría o estado. Las instituciones inactivas no se pueden asociar a cuentas nuevas."
        acciones={
          <IconoInstitucion aria-hidden="true" />
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
            <CampoSelect
              etiqueta="Categoría"
              value={tipo}
              onChange={(evento) =>
                setTipo(evento.target.value as TipoInstitucion | '')
              }
            >
              <option value="">Todas las categorías</option>
              {TIPOS_INSTITUCION.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Estado"
              value={estado}
              onChange={(evento) =>
                setEstado(evento.target.value as FiltroEstado)
              }
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activas</option>
              <option value="inactivos">Solo inactivas</option>
            </CampoSelect>
          </FilterBar>

          {error ? (
            <ErrorState
              mensaje={error}
              titulo="No se pudieron consultar las instituciones"
              onReintentar={recargar}
            />
          ) : (
            <DataTable
              columnas={columnas}
              filas={instituciones}
              obtenerClave={(institucion) => institucion.id}
              cargando={cargando}
              esqueleto={esqueletoTabla}
              vacio={
                hayFiltros ? (
                  <EmptyState
                    compacta
                    icono={<IconoVacio />}
                    titulo="No hay instituciones con estos filtros"
                    descripcion="Prueba con otra categoría o estado, o limpia los filtros para ver todo el catálogo."
                    accion={
                      <Boton variante="secundario" onClick={limpiarFiltros}>
                        Limpiar filtros
                      </Boton>
                    }
                  />
                ) : (
                  <EmptyState
                    compacta
                    icono={<IconoVacio />}
                    titulo="Todavía no hay instituciones"
                    descripcion="Registra la primera institución para poder asociarla a tus cuentas financieras."
                    accion={
                      <Boton onClick={() => setMostrandoFormulario(true)}>
                        <IconoMas />
                        Registrar institución
                      </Boton>
                    }
                  />
                )
              }
            />
          )}
        </div>
      </FinancialCard>
    </div>
  );
}
