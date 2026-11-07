import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  cambiarEstadoCuenta,
  listarTiposCuenta,
  obtenerCuenta,
} from '../api/cuentas';
import { listarInstituciones } from '../api/instituciones';
import { listarMonedas, listarPortafolios } from '../api/portafolios';
import type {
  CuentaFinanciera,
  Institucion,
  Moneda,
  Portafolio,
  TipoCuenta,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  Alerta,
  Boton,
  Esqueleto,
  EstadoVacio,
  Insignia,
} from '../components/ui';
import {
  IconoCuenta,
  IconoEditar,
  IconoPower,
  IconoRecargar,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { etiquetaTipoInstitucion } from '../lib/catalogos';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { formatearFecha } from '../lib/format';

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

export function CuentaDetailPage() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  const location = useLocation();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuenta, setCuenta] = useState<CuentaFinanciera | null>(null);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);

  const estadoNavegacion = location.state as EstadoNavegacion | null;
  const [aviso, setAviso] = useState<string | null>(() =>
    estadoNavegacion?.creada
      ? 'Cuenta creada correctamente.'
      : estadoNavegacion?.actualizada
        ? 'Cambios guardados correctamente.'
        : null,
  );

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      setNoEncontrado(false);

      try {
        const [
          portafolios,
          cuentaActual,
          catalogoInstituciones,
          catalogoTipos,
          catalogoMonedas,
        ] = await Promise.all([
          listarPortafolios(),
          obtenerCuenta(portafolioId, cuentaId),
          listarInstituciones(),
          listarTiposCuenta(),
          listarMonedas(),
        ]);

        if (cancelado) {
          return;
        }

        const encontrado =
          portafolios.find((elemento) => elemento.id === portafolioId) ?? null;

        if (!encontrado) {
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
        setCuenta(cuentaActual);
        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);
        setMonedas(catalogoMonedas);
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
        setError(mensajeDeError(fallo, 'cuenta'));
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
  }, [portafolioId, cuentaId, intento, marcarSesionExpirada]);

  async function cambiarEstado(nuevoActivo: boolean) {
    setCambiandoEstado(true);
    setErrorEstado(null);

    try {
      const actualizada = await cambiarEstadoCuenta(
        portafolioId,
        cuentaId,
        nuevoActivo,
      );
      setCuenta(actualizada);
      setConfirmandoEstado(false);
      setAviso(
        nuevoActivo
          ? 'Cuenta reactivada correctamente.'
          : 'Cuenta desactivada correctamente. Su historial se conserva.',
      );
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEstado(mensajeDeError(fallo, 'cuenta'));
    } finally {
      setCambiandoEstado(false);
    }
  }

  const institucion = instituciones.find(
    (elemento) => elemento.id === cuenta?.institucionId,
  );
  const tipoCuenta = tiposCuenta.find(
    (elemento) => elemento.id === cuenta?.tipoCuentaId,
  );
  const moneda = monedas.find((elemento) => elemento.id === cuenta?.monedaId);
  const enlacePortafolio = `/portafolios/${encodeURIComponent(portafolioId)}`;

  return (
    <div className="pagina">
      <Link className="volver" to={enlacePortafolio}>
        <IconoVolver />
        Volver al portafolio
      </Link>

      <header className="pagina__cabecera">
        <div className="pagina__texto">
          <p className="eyebrow">Cuenta financiera</p>
          <h1>
            {cargando
              ? 'Cargando cuenta…'
              : noEncontrado
                ? 'Cuenta no encontrada'
                : (cuenta?.nombre ?? 'Cuenta financiera')}
          </h1>
          <p className="pagina__subtitulo">
            {portafolio
              ? `Portafolio ${portafolio.nombre}. La referencia bancaria se muestra enmascarada.`
              : 'Detalle de la cuenta financiera.'}
          </p>
        </div>

        {!cargando && cuenta ? (
          <div className="pagina__meta acciones-detalle">
            <Link
              className="boton boton--secundario"
              to={`${enlacePortafolio}/cuentas/${encodeURIComponent(cuenta.id)}/editar`}
            >
              <IconoEditar />
              Editar
            </Link>
            <Boton
              variante={cuenta.activo ? 'peligro' : 'primario'}
              onClick={() => {
                setAviso(null);
                setConfirmandoEstado(true);
              }}
              disabled={cambiandoEstado}
            >
              <IconoPower />
              {cuenta.activo ? 'Desactivar' : 'Reactivar'}
            </Boton>
          </div>
        ) : null}
      </header>

      {aviso ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>{aviso}</span>
            <Boton
              variante="secundario"
              onClick={() => setAviso(null)}
            >
              Entendido
            </Boton>
          </div>
        </Alerta>
      ) : null}

      {confirmandoEstado && cuenta ? (
        <Alerta variante="info">
          <div className="alerta__accion">
            <span>
              {cuenta.activo
                ? '¿Desactivar esta cuenta? Dejará de estar activa, pero su historial se conservará.'
                : '¿Reactivar esta cuenta? Volverá a estar disponible en el portafolio.'}
            </span>
            <div className="acciones-en-linea">
              <Boton
                variante="secundario"
                onClick={() => setConfirmandoEstado(false)}
                disabled={cambiandoEstado}
              >
                Cancelar
              </Boton>
              <Boton
                variante={cuenta.activo ? 'peligro' : 'primario'}
                onClick={() => cambiarEstado(!cuenta.activo)}
                cargando={cambiandoEstado}
              >
                {cuenta.activo ? 'Sí, desactivar' : 'Sí, reactivar'}
              </Boton>
            </div>
          </div>
        </Alerta>
      ) : null}

      {errorEstado ? (
        <Alerta variante="error">{errorEstado}</Alerta>
      ) : null}

      {cargando ? (
        <section className="seccion" aria-hidden="true">
          <div className="detalle detalle--esqueleto">
            <Esqueleto className="esqueleto--titulo" />
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
        </section>
      ) : noEncontrado ? (
        <EstadoVacio
          icono={<IconoVacio />}
          titulo="No encontramos esta cuenta"
          descripcion="Puede que ya no exista o que no tengas acceso a ella. Vuelve al portafolio para consultar sus cuentas."
          accion={
            <Link className="boton boton--secundario" to={enlacePortafolio}>
              Volver al portafolio
            </Link>
          }
        />
      ) : error ? (
        <Alerta variante="error" className="alerta--bloque">
          <div className="alerta__accion">
            <span>{error}</span>
            <Boton variante="secundario" onClick={recargar}>
              <IconoRecargar />
              Reintentar
            </Boton>
          </div>
        </Alerta>
      ) : cuenta ? (
        <section className="seccion" aria-labelledby="titulo-detalle-cuenta">
          <div className="seccion__cabecera">
            <div>
              <h2 id="titulo-detalle-cuenta">Detalle de la cuenta</h2>
              <p>
                Datos de identificación y estado. La referencia completa nunca
                se devuelve por la API.
              </p>
            </div>
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar cuenta"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </div>

          <article className="detalle">
            <div className="detalle__cabecera">
              <span className="detalle__icono" aria-hidden="true">
                <IconoCuenta />
              </span>
              <div className="detalle__titulo">
                <h3>{cuenta.nombre}</h3>
                <Insignia activo={cuenta.activo} />
              </div>
            </div>

            <p className="detalle__descripcion">
              {cuenta.descripcion ?? 'Sin descripción.'}
            </p>

            <dl className="detalle__datos">
              <div>
                <dt>Institución</dt>
                <dd>
                  {institucion
                    ? `${institucion.nombre} · ${etiquetaTipoInstitucion(
                        institucion.tipo,
                      )}`
                    : 'No disponible'}
                </dd>
              </div>
              <div>
                <dt>Tipo de cuenta</dt>
                <dd>{tipoCuenta?.nombre ?? 'No disponible'}</dd>
              </div>
              <div>
                <dt>Moneda</dt>
                <dd>
                  {moneda
                    ? `${moneda.codigo} · ${moneda.nombre}`
                    : 'No disponible'}
                </dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd className="dato-enmascarado">
                  {cuenta.numeroCuenta ?? 'Sin referencia'}
                </dd>
              </div>
              <div>
                <dt>Fecha de apertura</dt>
                <dd>{formatearFecha(cuenta.fechaApertura)}</dd>
              </div>
              <div>
                <dt>Fecha de cierre</dt>
                <dd>{formatearFecha(cuenta.fechaCierre)}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{cuenta.activo ? 'Activa' : 'Inactiva'}</dd>
              </div>
              <div>
                <dt>Identificador</dt>
                <dd className="dato-id">{cuenta.id}</dd>
              </div>
            </dl>
          </article>
        </section>
      ) : null}
    </div>
  );
}
