import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listarCuentas, listarPortafolios } from '../api/portafolios';
import type { CuentaFinanciera, Portafolio } from '../api/types';
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
  IconoRecargar,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import { formatearFecha } from '../lib/format';

export function PortfolioPage() {
  const { portafolioId = '' } = useParams();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    Promise.all([
      listarPortafolios(),
      listarCuentas(portafolioId),
    ])
      .then(([lista, cuentasDelPortafolio]) => {
        if (cancelado) {
          return;
        }
        setPortafolio(
          lista.find((elemento) => elemento.id === portafolioId) ?? null,
        );
        setCuentas(cuentasDelPortafolio);
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setError(mensajeDeError(fallo, 'datos'));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [portafolioId, intento, marcarSesionExpirada]);

  const nombre = portafolio?.nombre ?? 'Portafolio';

  return (
    <div className="pagina">
      <Link className="volver" to="/">
        <IconoVolver />
        Volver al resumen
      </Link>

      <header className="pagina__cabecera">
        <div className="pagina__texto">
          <p className="eyebrow">Portafolio</p>
          <h1>{cargando ? 'Cargando portafolio…' : nombre}</h1>
          <p className="pagina__subtitulo">
            Cuentas financieras asociadas a este portafolio.
          </p>
        </div>

        <div className="pagina__meta" aria-live="polite">
          {cargando ? (
            <span className="dato-chip">
              <Esqueleto className="esqueleto--dato" />
            </span>
          ) : error ? null : (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          )}
        </div>
      </header>

      <section className="seccion" aria-labelledby="titulo-cuentas">
        <div className="seccion__cabecera">
          <div>
            <h2 id="titulo-cuentas">Cuentas</h2>
            <p>Los números se muestran enmascarados por seguridad.</p>
          </div>
          {!cargando && !error ? (
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar cuentas"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          ) : null}
        </div>

        {cargando ? (
          <div className="cuentas" aria-hidden="true">
            {[0, 1, 2].map((indice) => (
              <div className="cuenta cuenta--esqueleto" key={indice}>
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
        ) : cuentas.length === 0 ? (
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
            {cuentas.map((cuenta) => (
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
