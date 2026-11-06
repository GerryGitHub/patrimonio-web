import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  listarCuentas,
  listarMonedas,
  listarPortafolios,
} from '../api/portafolios';
import type {
  CuentaFinanciera,
  Moneda,
  Portafolio,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  Alerta,
  Boton,
  EstadoVacio,
  Esqueleto,
  Insignia,
} from '../components/ui';
import {
  IconoCuenta,
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

export function PortfolioPage() {
  const { portafolioId = '' } = useParams();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      setNoEncontrado(false);

      try {
        const [lista, catalogo] = await Promise.all([
          listarPortafolios(),
          listarMonedas(),
        ]);
        if (cancelado) {
          return;
        }

        const encontrado =
          lista.find((elemento) => elemento.id === portafolioId) ?? null;
        setMonedas(catalogo);

        if (!encontrado) {
          setPortafolio(null);
          setCuentas([]);
          setNoEncontrado(true);
          return;
        }

        const cuentasDelPortafolio = await listarCuentas(portafolioId);
        if (cancelado) {
          return;
        }

        setPortafolio(encontrado);
        setCuentas(cuentasDelPortafolio);
      } catch (fallo: unknown) {
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
        setError(mensajeDeError(fallo, 'datos'));
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [portafolioId, intento, marcarSesionExpirada]);

  const nombre = portafolio?.nombre ?? 'Portafolio';
  const monedaBase = portafolio?.monedaBase;
  const cuentasActivas = cuentas.filter((cuenta) => cuenta.activo).length;
  const monedasDistintas = new Set(cuentas.map((cuenta) => cuenta.monedaId)).size;
  const monedasPorId = new Map<string, Moneda>(
    monedas.map((moneda) => [moneda.id, moneda] as const),
  );

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
            {cargando
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
          {cargando ? (
            <span className="dato-chip">
              <Esqueleto className="esqueleto--dato" />
            </span>
          ) : error || noEncontrado ? null : (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          )}
        </div>
      </header>

      {cargando ? (
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
      ) : error ? (
        <Alerta variante="error" className="alerta--bloque">
          <div className="alerta__accion">
            <span>{error}</span>
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
                <p>Información disponible de las cuentas asociadas.</p>
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
              <Boton
                variante="secundario"
                onClick={recargar}
                aria-label="Actualizar cuentas"
              >
                <IconoRecargar />
                Actualizar
              </Boton>
            </div>

            {cuentas.length === 0 ? (
              <EstadoVacio
                icono={<IconoVacio />}
                titulo="Este portafolio no tiene cuentas"
                descripcion="Cuando se registre una cuenta financiera en este portafolio, aparecerá aquí."
                accion={
                  <Link className="boton boton--secundario" to="/">
                    Volver al resumen
                  </Link>
                }
              />
            ) : (
              <div className="cuentas">
                {cuentas.map((cuenta) => {
                  const moneda = monedasPorId.get(cuenta.monedaId);
                  return (
                    <article className="cuenta" key={cuenta.id}>
                      <span className="cuenta__icono" aria-hidden="true">
                        <IconoCuenta />
                      </span>

                      <div className="cuenta__cuerpo">
                        <div className="cuenta__encabezado">
                          <h3>{cuenta.nombre}</h3>
                          <Insignia activo={cuenta.activo} />
                        </div>
                        <p className="cuenta__numero">
                          {cuenta.numeroCuenta ?? 'Sin número registrado'}
                        </p>

                        <dl className="cuenta__datos">
                          <div>
                            <dt>Moneda</dt>
                            <dd>{moneda?.codigo ?? '-'}</dd>
                          </div>
                          <div>
                            <dt>Apertura</dt>
                            <dd>{formatearFecha(cuenta.fechaApertura)}</dd>
                          </div>
                          <div>
                            <dt>Cierre</dt>
                            <dd>{formatearFecha(cuenta.fechaCierre)}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
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
