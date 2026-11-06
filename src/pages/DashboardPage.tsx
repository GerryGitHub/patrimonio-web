import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listarPortafolios } from '../api/portafolios';
import type { Portafolio } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CrearPortafolioForm } from '../components/CrearPortafolioForm';
import { Alerta, Boton, EstadoVacio, Esqueleto } from '../components/ui';
import {
  IconoFlecha,
  IconoMas,
  IconoPortafolio,
  IconoRecargar,
  IconoVacio,
} from '../components/icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import { primerNombre, saludo } from '../lib/format';

interface EstadoNavegacion {
  seleccionado?: string;
}

export function DashboardPage() {
  const { usuario, marcarSesionExpirada } = useAuth();
  const location = useLocation();

  const [portafolios, setPortafolios] = useState<Portafolio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Portafolio | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const seleccionadoDesdeNavegacion =
    (location.state as EstadoNavegacion | null)?.seleccionado ?? null;
  const seleccionadoId = seleccionado ?? seleccionadoDesdeNavegacion;

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

  function alCrear(creado: Portafolio) {
    setPortafolios((actuales) =>
      [...actuales, creado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es'),
      ),
    );
    setSeleccionado(creado.id);
    setConfirmacion(creado);
    setMostrandoFormulario(false);
    setError(null);
    recargar();
  }

  const puedeCrear = !cargando && !error;

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

      {confirmacion ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>
              Portafolio «{confirmacion.nombre}» creado correctamente.
            </span>
            <Link
              className="boton boton--secundario"
              to={`/portafolios/${confirmacion.id}`}
            >
              Abrir portafolio
            </Link>
          </div>
        </Alerta>
      ) : null}

      {mostrandoFormulario ? (
        <CrearPortafolioForm
          onCreado={alCrear}
          onCancelar={() => setMostrandoFormulario(false)}
        />
      ) : null}

      <section className="seccion" aria-labelledby="titulo-portafolios">
        <div className="seccion__cabecera">
          <div>
            <h2 id="titulo-portafolios">Tus portafolios</h2>
            <p>
              Selecciona un portafolio para consultar sus cuentas financieras.
            </p>
          </div>
          <div className="seccion__acciones">
            {puedeCrear && !mostrandoFormulario ? (
              <Boton onClick={() => setMostrandoFormulario(true)}>
                <IconoMas />
                Nuevo portafolio
              </Boton>
            ) : null}
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
            descripcion="Crea tu primer portafolio para empezar a organizar tus cuentas financieras."
            accion={
              <Boton onClick={() => setMostrandoFormulario(true)}>
                <IconoMas />
                Crear portafolio
              </Boton>
            }
          />
        ) : (
          <div className="portafolios">
            {portafolios.map((portafolio) => {
              const esSeleccionado = portafolio.id === seleccionadoId;
              return (
                <Link
                  className={`portafolio ${
                    esSeleccionado ? 'portafolio--seleccionado' : ''
                  }`}
                  key={portafolio.id}
                  to={`/portafolios/${portafolio.id}`}
                  aria-label={`Abrir el portafolio ${portafolio.nombre}`}
                >
                  <span className="portafolio__icono" aria-hidden="true">
                    <IconoPortafolio />
                  </span>
                  <span className="portafolio__cuerpo">
                    <span className="portafolio__encabezado">
                      <span className="portafolio__nombre">
                        {portafolio.nombre}
                      </span>
                      {esSeleccionado ? (
                        <span className="portafolio__marca">
                          Seleccionado
                        </span>
                      ) : null}
                    </span>
                    <span className="portafolio__descripcion">
                      {portafolio.descripcion ?? 'Sin descripción.'}
                    </span>
                    <span className="portafolio__detalle">
                      <span className="moneda-chip">
                        {portafolio.monedaBase.codigo}
                      </span>
                      {portafolio.monedaBase.nombre}
                    </span>
                  </span>
                  <span className="portafolio__flecha" aria-hidden="true">
                    <IconoFlecha />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
