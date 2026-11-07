import { useCallback, useEffect, useState } from 'react';
import { listarInstituciones } from '../api/instituciones';
import type {
  FiltrosInstituciones,
  Institucion,
  TipoInstitucion,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CrearInstitucionForm } from '../components/CrearInstitucionForm';
import {
  Alerta,
  Boton,
  CampoSelect,
  EstadoVacio,
  Esqueleto,
  Insignia,
} from '../components/ui';
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

  const hayFiltros = tipo !== '' || estado !== 'todos';

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div className="pagina__texto">
          <p className="eyebrow">Catálogo</p>
          <h1>Instituciones financieras</h1>
          <p className="pagina__subtitulo">
            Bancos, SOFIPOs, casas de bolsa, exchanges y otras instituciones
            reutilizables en tus cuentas.
          </p>
        </div>

        <div className="pagina__meta" aria-live="polite">
          {cargando ? (
            <span className="dato-chip">
              <Esqueleto className="esqueleto--dato" />
            </span>
          ) : (
            <span className="dato-chip">
              <strong>{instituciones.length}</strong>
              {instituciones.length === 1 ? 'institución' : 'instituciones'}
            </span>
          )}
        </div>
      </header>

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

      <section className="seccion" aria-labelledby="titulo-instituciones">
        <div className="seccion__cabecera">
          <div>
            <h2 id="titulo-instituciones">Catálogo compartido</h2>
            <p>
              Filtra por categoría o estado. Las instituciones inactivas no se
              pueden asociar a cuentas nuevas.
            </p>
          </div>
          <div className="seccion__acciones">
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
          </div>
        </div>

        <div className="filtros">
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

          {hayFiltros ? (
            <Boton
              variante="fantasma"
              onClick={() => {
                setTipo('');
                setEstado('todos');
              }}
            >
              Limpiar filtros
            </Boton>
          ) : null}
        </div>

        {cargando ? (
          <div className="instituciones" aria-hidden="true">
            {[0, 1, 2].map((indice) => (
              <div
                className="institucion institucion--esqueleto"
                key={indice}
              >
                <Esqueleto className="esqueleto--icono" />
                <Esqueleto className="esqueleto--titulo" />
                <Esqueleto className="esqueleto--linea" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alerta variante="error" className="alerta--bloque">
            <div className="alerta__accion">
              <span>{error}</span>
              <Boton variante="secundario" onClick={recargar}>
                Reintentar
              </Boton>
            </div>
          </Alerta>
        ) : instituciones.length === 0 ? (
          hayFiltros ? (
            <EstadoVacio
              icono={<IconoVacio />}
              titulo="No hay instituciones con estos filtros"
              descripcion="Prueba con otra categoría o estado, o limpia los filtros para ver todo el catálogo."
              accion={
                <Boton
                  variante="secundario"
                  onClick={() => {
                    setTipo('');
                    setEstado('todos');
                  }}
                >
                  Limpiar filtros
                </Boton>
              }
            />
          ) : (
            <EstadoVacio
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
        ) : (
          <div className="instituciones">
            {instituciones.map((institucion) => {
              const sitio = urlSegura(institucion.sitioWeb);
              return (
                <article className="institucion" key={institucion.id}>
                  <span className="institucion__icono" aria-hidden="true">
                    <IconoInstitucion />
                  </span>

                  <div className="institucion__cuerpo">
                    <div className="institucion__encabezado">
                      <h3>{institucion.nombre}</h3>
                      <Insignia activo={institucion.activo} />
                    </div>

                    <div className="institucion__meta">
                      <span className="etiqueta-categoria">
                        {etiquetaTipoInstitucion(institucion.tipo)}
                      </span>
                      {institucion.pais ? (
                        <span className="institucion__pais">
                          {institucion.pais}
                        </span>
                      ) : null}
                    </div>

                    {sitio ? (
                      <a
                        className="institucion__sitio"
                        href={sitio}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {institucion.sitioWeb}
                      </a>
                    ) : (
                      <span className="institucion__sin-sitio">
                        Sin sitio web
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
