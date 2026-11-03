import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarPortafolios } from '../api/portafolios';
import type { Portafolio } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alerta, Boton, EstadoVacio, Esqueleto } from '../components/ui';
import {
  IconoFlecha,
  IconoPortafolio,
  IconoRecargar,
  IconoVacio,
} from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import { primerNombre, saludo } from '../lib/format';

export function DashboardPage() {
  const { usuario, marcarSesionExpirada } = useAuth();
  const [portafolios, setPortafolios] = useState<Portafolio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    listarPortafolios()
      .then((datos) => {
        if (!cancelado) {
          setPortafolios(datos);
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
  }, [intento, marcarSesionExpirada]);

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div className="pagina__texto">
          <p className="eyebrow">Resumen</p>
          <h1>
            {saludo()}
            {usuario ? `, ${primerNombre(usuario.nombre)}` : ''}
          </h1>
          <p className="pagina__subtitulo">
            Esta es la vista de tus portafolios autorizados.
          </p>
        </div>

        <div className="pagina__meta" aria-live="polite">
          {cargando ? (
            <span className="dato-chip">
              <Esqueleto className="esqueleto--dato" />
            </span>
          ) : (
            <span className="dato-chip">
              <strong>{portafolios.length}</strong>
              {portafolios.length === 1 ? 'portafolio' : 'portafolios'}
            </span>
          )}
        </div>
      </header>

      <section className="seccion" aria-labelledby="titulo-portafolios">
        <div className="seccion__cabecera">
          <div>
            <h2 id="titulo-portafolios">Tus portafolios</h2>
            <p>
              Selecciona un portafolio para consultar sus cuentas financieras.
            </p>
          </div>
          {!cargando && !error && portafolios.length > 0 ? (
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar portafolios"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          ) : null}
        </div>

        {cargando ? (
          <div className="portafolios" aria-hidden="true">
            {[0, 1, 2].map((indice) => (
              <div className="portafolio portafolio--esqueleto" key={indice}>
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
        ) : portafolios.length === 0 ? (
          <EstadoVacio
            icono={<IconoVacio />}
            titulo="Todavía no hay portafolios"
            descripcion="Cuando tengas acceso a un portafolio, aparecerá aquí automáticamente."
          />
        ) : (
          <div className="portafolios">
            {portafolios.map((portafolio) => (
              <Link
                className="portafolio"
                key={portafolio.id}
                to={`/portafolios/${portafolio.id}`}
              >
                <span className="portafolio__icono" aria-hidden="true">
                  <IconoPortafolio />
                </span>
                <span className="portafolio__cuerpo">
                  <span className="portafolio__nombre">{portafolio.nombre}</span>
                  <span className="portafolio__detalle">
                    Moneda base · {portafolio.monedaBaseId.slice(0, 8)}
                  </span>
                </span>
                <span className="portafolio__flecha" aria-hidden="true">
                  <IconoFlecha />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
