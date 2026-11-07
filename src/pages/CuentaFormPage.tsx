import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  actualizarCuenta,
  crearCuenta,
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
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import {
  Alerta,
  Boton,
  Campo,
  CampoSelect,
  CampoTextarea,
  Esqueleto,
} from '../components/ui';
import {
  IconoCheck,
  IconoMas,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { etiquetaTipoInstitucion } from '../lib/catalogos';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import {
  tieneErrores,
  validarCuenta,
  type ErroresCuenta,
} from '../lib/validation';

export function CuentaFormPage() {
  const { portafolioId = '', cuentaId } = useParams();
  const editando = Boolean(cuentaId);
  const navigate = useNavigate();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [cuenta, setCuenta] = useState<CuentaFinanciera | null>(null);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuenta[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [institucionId, setInstitucionId] = useState('');
  const [tipoCuentaId, setTipoCuentaId] = useState('');
  const [monedaId, setMonedaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');

  const [errores, setErrores] = useState<ErroresCuenta>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const recargar = useCallback(() => setIntento((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setErrorCarga(null);
      setNoEncontrado(false);

      try {
        const [
          portafolios,
          catalogoInstituciones,
          catalogoTipos,
          catalogoMonedas,
          cuentaActual,
        ] = await Promise.all([
          listarPortafolios(),
          listarInstituciones(),
          listarTiposCuenta(),
          listarMonedas(),
          editando && cuentaId
            ? obtenerCuenta(portafolioId, cuentaId)
            : Promise.resolve(null),
        ]);

        if (cancelado) {
          return;
        }

        const encontrado =
          portafolios.find((elemento) => elemento.id === portafolioId) ?? null;

        if (!encontrado) {
          setPortafolio(null);
          setNoEncontrado(true);
          return;
        }

        setPortafolio(encontrado);
        setInstituciones(catalogoInstituciones);
        setTiposCuenta(catalogoTipos);
        setMonedas(catalogoMonedas);

        if (cuentaActual) {
          setCuenta(cuentaActual);
          setInstitucionId(cuentaActual.institucionId);
          setTipoCuentaId(cuentaActual.tipoCuentaId);
          setMonedaId(cuentaActual.monedaId);
          setNombre(cuentaActual.nombre);
          setDescripcion(cuentaActual.descripcion ?? '');
          setFechaApertura(cuentaActual.fechaApertura ?? '');
          return;
        }

        const primeraInstitucionActiva = catalogoInstituciones.find(
          (institucion) => institucion.activo,
        );
        const monedaBaseDisponible = catalogoMonedas.some(
          (moneda) => moneda.id === encontrado.monedaBaseId,
        );

        setInstitucionId(primeraInstitucionActiva?.id ?? '');
        setTipoCuentaId(catalogoTipos[0]?.id ?? '');
        setMonedaId(
          monedaBaseDisponible
            ? encontrado.monedaBaseId
            : (catalogoMonedas[0]?.id ?? ''),
        );
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
        setErrorCarga(mensajeDeError(fallo, 'cuenta'));
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
  }, [portafolioId, cuentaId, editando, intento, marcarSesionExpirada]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorEnvio(null);

    const validacion = validarCuenta({
      nombre,
      institucionId,
      tipoCuentaId,
      monedaId,
      descripcion,
      numeroCuenta,
    });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    setEnviando(true);
    try {
      const datos = {
        institucionId,
        tipoCuentaId,
        monedaId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        numeroCuenta: numeroCuenta.trim() || undefined,
        fechaApertura: fechaApertura || undefined,
      };

      const guardada =
        editando && cuentaId
          ? await actualizarCuenta(portafolioId, cuentaId, datos)
          : await crearCuenta(portafolioId, datos);

      navigate(
        `/activos/liquidez/${encodeURIComponent(
          portafolioId,
        )}/cuentas/${encodeURIComponent(guardada.id)}`,
        {
          replace: true,
          state: editando ? { actualizada: true } : { creada: true },
        },
      );
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEnvio(mensajeDeError(fallo, 'cuenta'));
    } finally {
      setEnviando(false);
    }
  }

  const institucionesActivas = instituciones.filter(
    (institucion) => institucion.activo,
  );
  const institucionSeleccionada = instituciones.find(
    (institucion) => institucion.id === institucionId,
  );
  const institucionInactiva =
    institucionSeleccionada !== undefined && !institucionSeleccionada.activo;
  const sinCatalogos =
    !cargando &&
    !errorCarga &&
    !noEncontrado &&
    (institucionesActivas.length === 0 ||
      tiposCuenta.length === 0 ||
      monedas.length === 0);

  const enlaceVolver =
    editando && cuentaId
      ? `/activos/liquidez/${encodeURIComponent(
          portafolioId,
        )}/cuentas/${encodeURIComponent(cuentaId)}`
      : `/activos/liquidez/${encodeURIComponent(portafolioId)}`;

  return (
    <div className="page">
      <Link className="volver" to={enlaceVolver}>
        <IconoVolver />
        {editando ? 'Volver al detalle' : 'Volver al portafolio'}
      </Link>

      <PageHeader
        eyebrow={editando ? 'Editar cuenta' : 'Nueva cuenta'}
        titulo={
          cargando
            ? 'Cargando formulario…'
            : noEncontrado
              ? 'Cuenta no encontrada'
              : editando
                ? `Editar ${cuenta?.nombre ?? 'cuenta'}`
                : 'Registrar cuenta financiera'
        }
        descripcion={
          portafolio
            ? `Portafolio ${portafolio.nombre}. La referencia bancaria solo se mostrará enmascarada.`
            : 'Completa los datos de la cuenta financiera.'
        }
      />

      {cargando ? (
        <div className="panel-formulario" aria-hidden="true">
          <Esqueleto className="esqueleto--titulo" />
          <Esqueleto className="esqueleto--linea" />
          <Esqueleto className="esqueleto--linea" />
          <Esqueleto className="esqueleto--linea" />
        </div>
      ) : noEncontrado ? (
        <EmptyState
          icono={<IconoVacio />}
          titulo={
            editando
              ? 'No encontramos esta cuenta'
              : 'No encontramos este portafolio'
          }
          descripcion="Puede que ya no exista o que no tengas acceso a él. Vuelve al portafolio para elegir otra opción."
          accion={
            <Link
              className="btn btn--secundario"
              to={`/activos/liquidez/${encodeURIComponent(portafolioId)}`}
            >
              Volver al portafolio
            </Link>
          }
        />
      ) : errorCarga ? (
        <ErrorState
          mensaje={errorCarga}
          titulo="No se pudo cargar el formulario"
          onReintentar={recargar}
        />
      ) : portafolio ? (
        <FinancialCard
          id="titulo-formulario-cuenta"
          titulo={editando ? 'Actualiza la cuenta' : 'Datos de la cuenta'}
          subtitulo="La institución, el tipo y la moneda deben existir y estar activos. El estado se cambia desde el detalle de la cuenta."
          acciones={
            <span className="dato-chip">
              <strong>{portafolio.monedaBase.codigo}</strong>
              {portafolio.monedaBase.nombre}
            </span>
          }
        >
          {errorEnvio ? (
            <Alerta variante="error">{errorEnvio}</Alerta>
          ) : null}

          {sinCatalogos ? (
            <Alerta variante="info">
              Faltan datos en los catálogos: necesitas al menos una institución
              activa, un tipo de cuenta y una moneda para registrar cuentas.
            </Alerta>
          ) : null}

          {institucionInactiva ? (
            <Alerta variante="info">
              La institución actual está inactiva. Selecciona una institución
              activa para poder guardar los cambios.
            </Alerta>
          ) : null}

          <form
            className="formulario formulario--cuenta"
            onSubmit={enviar}
            noValidate
          >
            <Campo
              etiqueta="Nombre de la cuenta"
              name="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              error={errores.nombre}
              ayuda="Un nombre propio para identificarla, por ejemplo «Cuenta corriente principal»."
              maxLength={150}
              autoComplete="off"
              autoFocus
              required
            />

            <CampoSelect
              etiqueta="Institución"
              name="institucionId"
              value={institucionId}
              onChange={(evento) => setInstitucionId(evento.target.value)}
              error={errores.institucionId}
              disabled={sinCatalogos}
              required
            >
              <option value="">Selecciona una institución</option>
              {instituciones.map((institucion) => {
                const esActual = institucion.id === institucionId;
                return (
                  <option
                    key={institucion.id}
                    value={institucion.id}
                    disabled={!institucion.activo && !esActual}
                  >
                    {institucion.nombre} ·{' '}
                    {etiquetaTipoInstitucion(institucion.tipo)}
                    {!institucion.activo ? ' (inactiva)' : ''}
                  </option>
                );
              })}
            </CampoSelect>

            <CampoSelect
              etiqueta="Tipo de cuenta"
              name="tipoCuentaId"
              value={tipoCuentaId}
              onChange={(evento) => setTipoCuentaId(evento.target.value)}
              error={errores.tipoCuentaId}
              disabled={sinCatalogos}
              required
            >
              <option value="">Selecciona un tipo</option>
              {tiposCuenta.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Moneda"
              name="monedaId"
              value={monedaId}
              onChange={(evento) => setMonedaId(evento.target.value)}
              error={errores.monedaId}
              disabled={sinCatalogos}
              required
            >
              <option value="">Selecciona una moneda</option>
              {monedas.map((moneda) => (
                <option key={moneda.id} value={moneda.id}>
                  {moneda.codigo} · {moneda.nombre}
                </option>
              ))}
            </CampoSelect>

            <Campo
              etiqueta="Referencia bancaria (opcional)"
              name="numeroCuenta"
              value={numeroCuenta}
              onChange={(evento) => setNumeroCuenta(evento.target.value)}
              error={errores.numeroCuenta}
              ayuda={
                editando && cuenta?.numeroCuenta
                  ? `Referencia actual: ${cuenta.numeroCuenta}. Déjala vacía para conservarla.`
                  : 'Solo se mostrarán los últimos cuatro caracteres. Evita datos sensibles innecesarios.'
              }
              maxLength={64}
              autoComplete="off"
              placeholder={editando ? 'Nueva referencia (opcional)' : ''}
            />

            <Campo
              etiqueta="Fecha de apertura (opcional)"
              name="fechaApertura"
              type="date"
              value={fechaApertura}
              onChange={(evento) => setFechaApertura(evento.target.value)}
            />

            <CampoTextarea
              etiqueta="Descripción (opcional)"
              name="descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              error={errores.descripcion}
              ayuda={`${descripcion.trim().length}/500 caracteres.`}
              maxLength={500}
              rows={3}
              placeholder="Uso de la cuenta, notas internas…"
              className="campo--ancho"
            />

            <div className="formulario__acciones campo--ancho">
              <Link className="boton boton--fantasma" to={enlaceVolver}>
                Cancelar
              </Link>
              <Boton
                type="submit"
                cargando={enviando}
                disabled={sinCatalogos || institucionInactiva}
              >
                {editando ? <IconoCheck /> : <IconoMas />}
                {editando ? 'Guardar cambios' : 'Crear cuenta'}
              </Boton>
            </div>
          </form>
        </FinancialCard>
      ) : null}
    </div>
  );
}
