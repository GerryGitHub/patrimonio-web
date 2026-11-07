import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarCuentas, listarTiposCuenta } from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import type {
  CuentaFinanciera,
  FiltrosCuentas,
  Institucion,
  Moneda,
  Portafolio,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  Alerta,
  Boton,
  CampoSelect,
  EstadoVacio,
  Esqueleto,
  Insignia,
} from '../components/ui';
import {
  IconoCuenta,
  IconoFlecha,
  IconoInstitucion,
  IconoMas,
  IconoMoneda,
  IconoRecargar,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFecha } from '../lib/format';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export function PortfolioPage() {
  const { portafolioId = '' } = useParams();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoCuentas, setCargandoCuentas] = useState(true);
  const [errorInicial, setErrorInicial] = useState<string | null>(null);
  const [errorCuentas, setErrorCuentas] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoInicial(true);
      setErrorInicial(null);
      setNoEncontrado(false);

      try {
        const [lista, catalogoMonedas, catalogoInstituciones, catalogoTipos] =
          await Promise.all([
            listarPortafolios(),
            listarMonedas(),
            listarInstituciones(),
            listarTiposCuenta(),
          ]);
        if (cancelado) {
          return;
        }

        const encontrado =
          lista.find((elemento) => elemento.id === portafolioId) ?? null;
        setMonedas(catalogoMonedas);
        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);

        if (!encontrado) {
          setPortafolio(null);
          setCuentas([]);
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
      } catch (fallo) {
        if (cancelado) {
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
        setErrorInicial(mensajeDeError(fallo, 'datos'));
      } finally {
        if (!cancelado) {
          setCargandoInicial(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [portafolioId, intento, marcarSesionExpirada]);

  useEffect(() => {
    if (cargandoInicial || noEncontrado) {
      return;
    }

    let cancelado = false;

    const filtros: FiltrosCuentas = {};
    if (filtroInstitucion) {
      filtros.institucionId = filtroInstitucion;
    }
    if (filtroTipo) {
      filtros.tipoCuentaId = filtroTipo;
    }
    if (filtroEstado !== 'todos') {
      filtros.activo = filtroEstado === 'activos';
    }

    setCargandoCuentas(true);
    setErrorCuentas(null);

    listarCuentas(portafolioId, filtros)
      .then((datos) => {
        if (!cancelado) {
          setCuentas(datos);
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
        if (esNoEncontrado(fallo)) {
          setNoEncontrado(true);
          return;
        }
        setErrorCuentas(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoCuentas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [
    portafolioId,
    cargandoInicial,
    noEncontrado,
    filtroInstitucion,
    filtroTipo,
    filtroEstado,
    intento,
    marcarSesionExpirada,
  ]);

  const nombre = portafolio?.nombre ?? 'Portafolio';
  const monedaBase = portafolio?.monedaBase;
  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activo).length;
  const monedasDistintas = new Set(cuentas.map((cuenta) => cuenta.monedaId)).size;

  const monedasPorId = new Map<string, Moneda>(
    monedas.map((moneda) => [moneda.id, moneda] as const),
  );
  const institucionesPorId = new Map<string, Institucion>(
    instituciones.map((institucion) => [institucion.id, institucion] as const),
  );
  const tiposPorId = new Map<string, TipoCuenta>(
    tiposCuenta.map((tipo) => [tipo.id, tipo] as const),
  );

  const hayFiltros =
    filtroInstitucion !== '' || filtroTipo !== '' || filtroEstado !== 'todos';

  function limpiarFiltros() {
    setFiltroInstitucion('');
    setFiltroTipo('');
    setFiltroEstado('todos');
  }

  return (
    <div className="pagina">
      <Link
        className="volver"
        to="/"
        state={{ seleccionado: portafolioId }}
      >
        <IconoVolver />
        Volver al resumen
      </Link>

      <header className="pagina__cabecera">
        <div className="pagina__texto">
          <p className="eyebrow">Portafolio seleccionado</p>
          <h1>
            {cargandoInicial
              ? 'Cargando portafolio…'
              : noEncontrado
                ? 'Portafolio no encontrado'
                : nombre}
          </h1>
          <p className="pagina__subtitulo">
            {noEncontrado
              ? 'Puede que ya no exista o que no tengas acceso a él.'
              : 'Información general, moneda base y cuentas financieras asociadas.'}
          </p>
        </div>

        <div className="pagina__meta" aria-live="polite">
          {cargandoInicial ? (
            <span className="dato-chip">
              <Esqueleto className="esqueleto--dato" />
            </span>
          ) : errorInicial || noEncontrado ? null : (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          )}
        </div>
      </header>

      {cargandoInicial ? (
        <>
          <section className="seccion" aria-hidden="true">
            <div className="detalle detalle--esqueleto">
              <Esqueleto className="esqueleto--titulo" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          </section>
          <section className="seccion" aria-hidden="true">
            <div className="cuentas">
              {[0, 1].map((indice) => (
                <div className="cuenta cuenta--esqueleto" key={indice}>
                  <Esqueleto className="esqueleto--icono" />
                  <Esqueleto className="esqueleto--titulo" />
                  <Esqueleto className="esqueleto--linea" />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : noEncontrado ? (
        <EstadoVacio
          icono={<IconoVacio />}
          titulo="No encontramos este portafolio"
          descripcion="Comprueba que sigues teniendo acceso o vuelve al resumen para elegir otro portafolio."
          accion={
            <Link className="boton boton--secundario" to="/">
              Volver al resumen
            </Link>
          }
        />
      ) : errorInicial ? (
        <Alerta variante="error" className="alerta--bloque">
          <div className="alerta__accion">
            <span>{errorInicial}</span>
            <Boton variante="secundario" onClick={recargar}>
              Reintentar
            </Boton>
          </div>
        </Alerta>
      ) : portafolio ? (
        <>
          <section className="seccion" aria-labelledby="titulo-general">
            <div className="seccion__cabecera">
              <div>
                <h2 id="titulo-general">Información general</h2>
                <p>Datos de identificación y valoración del portafolio.</p>
              </div>
            </div>

            <article className="detalle">
              <div className="detalle__cabecera">
                <span className="detalle__icono" aria-hidden="true">
                  <IconoMoneda />
                </span>
                <div className="detalle__titulo">
                  <h3>{portafolio.nombre}</h3>
                  <Insignia activo={portafolio.activo} />
                </div>
              </div>

              <p className="detalle__descripcion">
                {portafolio.descripcion ?? 'Sin descripción.'}
              </p>

              <dl className="detalle__datos">
                <div>
                  <dt>Moneda base</dt>
                  <dd>
                    {monedaBase
                      ? `${monedaBase.codigo} · ${monedaBase.nombre}`
                      : 'No disponible'}
                  </dd>
                </div>
                <div>
                  <dt>Símbolo</dt>
                  <dd>{monedaBase?.simbolo ?? monedaBase?.codigo ?? '-'}</dd>
                </div>
                <div>
                  <dt>Decimales</dt>
                  <dd>{monedaBase?.decimales ?? '-'}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{portafolio.activo ? 'Activo' : 'Inactivo'}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="seccion" aria-labelledby="titulo-resumen">
            <div className="seccion__cabecera">
              <div>
                <h2 id="titulo-resumen">Resumen</h2>
                <p>
                  {hayFiltros
                    ? 'Información de las cuentas que coinciden con los filtros.'
                    : 'Información disponible de las cuentas asociadas.'}
                </p>
              </div>
            </div>

            <dl className="resumen">
              <div className="resumen__dato">
                <dt>Cuentas</dt>
                <dd>{cuentas.length}</dd>
              </div>
              <div className="resumen__dato">
                <dt>Activas</dt>
                <dd>{cuentasActivas}</dd>
              </div>
              <div className="resumen__dato">
                <dt>Inactivas</dt>
                <dd>{cuentas.length - cuentasActivas}</dd>
              </div>
              <div className="resumen__dato">
                <dt>Monedas</dt>
                <dd>{monedasDistintas}</dd>
              </div>
            </dl>
          </section>

          <section className="seccion" aria-labelledby="titulo-cuentas">
            <div className="seccion__cabecera">
              <div>
                <h2 id="titulo-cuentas">Cuentas financieras</h2>
                <p>Los números se muestran enmascarados por seguridad.</p>
              </div>
              <div className="seccion__acciones">
                <Link
                  className="boton boton--secundario"
                  to="/instituciones"
                >
                  <IconoInstitucion />
                  Instituciones
                </Link>
                <Link
                  className="boton boton--primario"
                  to={`/portafolios/${encodeURIComponent(portafolioId)}/cuentas/nueva`}
                >
                  <IconoMas />
                  Nueva cuenta
                </Link>
                <Boton
                  variante="secundario"
                  onClick={recargar}
                  aria-label="Actualizar cuentas"
                >
                  <IconoRecargar />
                  Actualizar
                </Boton>
              </div>
            </div>

            <div className="filtros">
              <CampoSelect
                etiqueta="Institución"
                value={filtroInstitucion}
                onChange={(evento) =>
                  setFiltroInstitucion(evento.target.value)
                }
              >
                <option value="">Todas las instituciones</option>
                {instituciones.map((institucion) => (
                  <option key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                    {!institucion.activo ? ' (inactiva)' : ''}
                  </option>
                ))}
              </CampoSelect>

              <CampoSelect
                etiqueta="Tipo de cuenta"
                value={filtroTipo}
                onChange={(evento) => setFiltroTipo(evento.target.value)}
              >
                <option value="">Todos los tipos</option>
                {tiposCuenta.map((tipo) => (
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
                <option value="activos">Solo activas</option>
                <option value="inactivos">Solo inactivas</option>
              </CampoSelect>

              {hayFiltros ? (
                <Boton variante="fantasma" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Boton>
              ) : null}
            </div>

            {cargandoCuentas ? (
              <div className="cuentas" aria-hidden="true">
                {[0, 1].map((indice) => (
                  <div className="cuenta cuenta--esqueleto" key={indice}>
                    <Esqueleto className="esqueleto--icono" />
                    <Esqueleto className="esqueleto--titulo" />
                    <Esqueleto className="esqueleto--linea" />
                  </div>
                ))}
              </div>
            ) : errorCuentas ? (
              <Alerta variante="error" className="alerta--bloque">
                <div className="alerta__accion">
                  <span>{errorCuentas}</span>
                  <Boton variante="secundario" onClick={recargar}>
                    Reintentar
                  </Boton>
                </div>
              </Alerta>
            ) : cuentas.length === 0 ? (
              hayFiltros ? (
                <EstadoVacio
                  icono={<IconoVacio />}
                  titulo="No hay cuentas con estos filtros"
                  descripcion="Prueba con otra institución, tipo o estado, o limpia los filtros para ver todas las cuentas."
                  accion={
                    <Boton variante="secundario" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </Boton>
                  }
                />
              ) : (
                <EstadoVacio
                  icono={<IconoVacio />}
                  titulo="Este portafolio no tiene cuentas"
                  descripcion="Registra una cuenta financiera para empezar a organizar su información."
                  accion={
                    <Link
                      className="boton boton--primario"
                      to={`/portafolios/${encodeURIComponent(portafolioId)}/cuentas/nueva`}
                    >
                      <IconoMas />
                      Registrar cuenta
                    </Link>
                  }
                />
              )
            ) : (
              <div className="cuentas">
                {cuentas.map((cuenta) => {
                  const moneda = monedasPorId.get(cuenta.monedaId);
                  const institucion = institucionesPorId.get(
                    cuenta.institucionId,
                  );
                  const tipo = tiposPorId.get(cuenta.tipoCuentaId);
                  return (
                    <Link
                      className="cuenta cuenta--enlace"
                      key={cuenta.id}
                      to={`/portafolios/${encodeURIComponent(
                        portafolioId,
                      )}/cuentas/${encodeURIComponent(cuenta.id)}`}
                      aria-label={`Ver el detalle de la cuenta ${cuenta.nombre}`}
                    >
                      <span className="cuenta__icono" aria-hidden="true">
                        <IconoCuenta />
                      </span>

                      <span className="cuenta__cuerpo">
                        <span className="cuenta__encabezado">
                          <h3>{cuenta.nombre}</h3>
                          <Insignia activo={cuenta.activo} />
                        </span>
                        <span className="cuenta__numero">
                          {cuenta.numeroCuenta ?? 'Sin número registrado'}
                        </span>

                        <dl className="cuenta__datos">
                          <div>
                            <dt>Institución</dt>
                            <dd>{institucion?.nombre ?? 'No disponible'}</dd>
                          </div>
                          <div>
                            <dt>Tipo</dt>
                            <dd>{tipo?.nombre ?? 'No disponible'}</dd>
                          </div>
                          <div>
                            <dt>Moneda</dt>
                            <dd>{moneda?.codigo ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>Apertura</dt>
                            <dd>{formatearFecha(cuenta.fechaApertura)}</dd>
                          </div>
                        </dl>
                      </span>

                      <span className="cuenta__flecha" aria-hidden="true">
                        <IconoFlecha />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
