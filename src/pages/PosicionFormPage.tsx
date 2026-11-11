import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { listarCuentas } from '../api/cuentas';
import {
  listarCategoriasInstrumento,
  listarInstrumentos,
} from '../api/instrumentos';
import { listarPortafolios } from '../api/portafolios';
import {
  actualizarPosicion,
  crearPosicion,
  obtenerPosicion,
} from '../api/posiciones';
import type {
  ClaseActivo,
  CuentaFinanciera,
  Instrumento,
  Portafolio,
  Posicion,
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
import { formatearImporte, multiplicarDecimales, normalizarDecimal } from '../lib/decimales';
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import { fechaHoyIso } from '../lib/format';
import {
  tieneErrores,
  validarPosicion,
  type ErroresPosicion,
} from '../lib/validation';

export function PosicionFormPage() {
  const { portafolioId = '', posicionId } = useParams();
  const editando = Boolean(posicionId);
  const navigate = useNavigate();
  const { marcarSesionExpirada } = useAuth();

  const [portafolio, setPortafolio] = useState<Portafolio | null>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [categorias, setCategorias] = useState<ClaseActivo[]>([]);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [cuentaId, setCuentaId] = useState('');
  const [instrumentoId, setInstrumentoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [fechaApertura, setFechaApertura] = useState(fechaHoyIso());
  const [observaciones, setObservaciones] = useState('');

  const [errores, setErrores] = useState<ErroresPosicion>({});
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
          cuentasPortafolio,
          catalogoInstrumentos,
          catalogoCategorias,
          posicionActual,
        ] = await Promise.all([
          listarPortafolios(),
          listarCuentas(portafolioId),
          listarInstrumentos({ activo: true }),
          listarCategoriasInstrumento(),
          editando && posicionId
            ? obtenerPosicion(portafolioId, posicionId)
            : Promise.resolve(null),
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
        setCuentas(cuentasPortafolio);
        setInstrumentos(catalogoInstrumentos);
        setCategorias(catalogoCategorias);

        if (posicionActual) {
          setPosicion(posicionActual);
          setCuentaId(posicionActual.cuentaId);
          setInstrumentoId(posicionActual.instrumentoId);
          setCantidad(normalizarDecimal(posicionActual.cantidad));
          setCostoUnitario(normalizarDecimal(posicionActual.costoUnitario));
          setFechaApertura(posicionActual.fechaApertura);
          setObservaciones(posicionActual.observaciones ?? '');
          return;
        }

        const primeraCuenta = cuentasPortafolio[0];
        setCuentaId(primeraCuenta?.id ?? '');
        setInstrumentoId(catalogoInstrumentos[0]?.id ?? '');
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
        setErrorCarga(mensajeDeError(fallo, 'posicion'));
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
  }, [portafolioId, posicionId, editando, intento, marcarSesionExpirada]);

  const instrumentoSeleccionado = instrumentos.find(
    (instrumento) => instrumento.id === instrumentoId,
  );

  const monedaDecimales = posicion?.monedaDecimales ?? instrumentoSeleccionado?.monedaDecimales ?? 2;
  const monedaCodigo = posicion?.monedaCodigo ?? instrumentoSeleccionado?.monedaCodigo ?? '—';
  const claseActivoNombre =
    posicion?.claseActivoNombre ??
    instrumentoSeleccionado?.claseActivoNombre ??
    'Sin categoría';
  const tipoInstrumentoNombre =
    posicion?.tipoInstrumentoNombre ??
    instrumentoSeleccionado?.tipoInstrumentoNombre ??
    'Sin tipo';

  const instrumentosPorCategoria = useMemo(() => {
    const grupos = new Map<string, { nombre: string; items: Instrumento[] }>();
    for (const categoria of categorias) {
      grupos.set(categoria.id, { nombre: categoria.nombre, items: [] });
    }
    for (const instrumento of instrumentos) {
      const grupo = grupos.get(instrumento.claseActivoId);
      if (grupo) {
        grupo.items.push(instrumento);
      } else {
        grupos.set(instrumento.claseActivoId, {
          nombre: instrumento.claseActivoNombre,
          items: [instrumento],
        });
      }
    }
    return [...grupos.values()].filter((grupo) => grupo.items.length > 0);
  }, [categorias, instrumentos]);

  const totalEstimado = useMemo(() => {
    if (!cantidad.trim() || !costoUnitario.trim()) {
      return '0';
    }
    return multiplicarDecimales(cantidad.trim(), costoUnitario.trim());
  }, [cantidad, costoUnitario]);

  const sinCatalogos =
    !cargando &&
    !errorCarga &&
    !noEncontrado &&
    !editando &&
    (cuentas.length === 0 || instrumentos.length === 0);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorEnvio(null);

    const validacion = validarPosicion({
      cuentaId,
      instrumentoId,
      cantidad,
      costoUnitario,
      fechaApertura,
      observaciones,
    });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    setEnviando(true);
    try {
      const datos = {
        cantidad: cantidad.trim(),
        costoUnitario: costoUnitario.trim(),
        fechaApertura: fechaApertura || undefined,
        observaciones: observaciones.trim() || undefined,
      };

      const guardada =
        editando && posicionId
          ? await actualizarPosicion(portafolioId, posicionId, datos)
          : await crearPosicion(portafolioId, {
              cuentaId,
              instrumentoId,
              ...datos,
            });

      navigate(
        `/activos/liquidez/${encodeURIComponent(
          portafolioId,
        )}/posiciones/${encodeURIComponent(guardada.id)}`,
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
      setErrorEnvio(mensajeDeError(fallo, 'posicion'));
    } finally {
      setEnviando(false);
    }
  }

  const enlacePosiciones = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}/posiciones`;
  const enlaceVolver =
    editando && posicionId
      ? `${enlacePosiciones}/${encodeURIComponent(posicionId)}`
      : enlacePosiciones;

  const cuentaSeleccionada = cuentas.find((cuenta) => cuenta.id === cuentaId);

  return (
    <div className="page">
      <Link className="volver" to={enlaceVolver}>
        <IconoVolver />
        {editando ? 'Volver a la posición' : 'Volver a las posiciones'}
      </Link>

      <PageHeader
        eyebrow={editando ? 'Editar posición' : 'Nueva posición'}
        titulo={
          cargando
            ? 'Cargando formulario…'
            : noEncontrado
              ? 'Posición no encontrada'
              : editando
                ? `Editar ${posicion?.instrumentoNombre ?? 'posición'}`
                : 'Registrar posición inicial'
        }
        descripcion={
          portafolio
            ? `Portafolio ${portafolio.nombre}. La moneda se deriva del instrumento y no se solicita en el formulario.`
            : 'Registra la cantidad, el costo unitario y la fecha de apertura de la posición.'
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
          titulo="No encontramos esta posición"
          descripcion="Puede que ya no exista o que no tengas acceso a ella. Vuelve a las posiciones del portafolio para elegir otra."
          accion={
            <Link className="btn btn--secundario" to={enlacePosiciones}>
              Volver a las posiciones
            </Link>
          }
        />
      ) : errorCarga ? (
        <ErrorState
          mensaje={errorCarga}
          titulo="No se pudo cargar el formulario"
          onReintentar={recargar}
        />
      ) : (
        <FinancialCard
          id="titulo-formulario-posicion"
          titulo={editando ? 'Actualiza la posición' : 'Datos de la posición'}
          subtitulo="La cuenta y el instrumento no cambian al editar una posición existente. Si ya tiene movimientos, la cantidad y el costo no se editan libremente: usa el historial para registrar ajustes o reversiones."
          acciones={
            <span className="dato-chip">
              <strong>{monedaCodigo}</strong>
              {monedaDecimales} decimales
            </span>
          }
        >
          {errorEnvio ? <Alerta variante="error">{errorEnvio}</Alerta> : null}

          {sinCatalogos ? (
            <Alerta variante="info">
              Para registrar posiciones necesitas al menos una cuenta en el
              portafolio y un instrumento activo en el catálogo.
            </Alerta>
          ) : null}

          <div className="posicion-categoria">
            <div>
              <p className="instrumento-categoria__eyebrow">Categoría</p>
              <h3>{claseActivoNombre}</h3>
              <p>{tipoInstrumentoNombre}</p>
            </div>
            <div className="posicion-categoria__total">
              <span>Costo total estimado</span>
              <strong>
                {formatearImporte(totalEstimado, monedaDecimales)}{' '}
                <small>{monedaCodigo}</small>
              </strong>
              <small>Cantidad × costo unitario. No es valor de mercado.</small>
            </div>
          </div>

          <form
            className="formulario formulario--cuenta"
            onSubmit={enviar}
            noValidate
          >
            {editando ? (
              <>
                <Campo
                  etiqueta="Cuenta"
                  value={posicion?.cuentaNombre ?? ''}
                  readOnly
                  disabled
                />
                <Campo
                  etiqueta="Instrumento"
                  value={
                    posicion
                      ? `${posicion.instrumentoNombre}${
                          posicion.instrumentoSimbolo
                            ? ` · ${posicion.instrumentoSimbolo}`
                            : ''
                        }`
                      : ''
                  }
                  readOnly
                  disabled
                />
              </>
            ) : (
              <>
                <CampoSelect
                  etiqueta="Cuenta"
                  name="cuentaId"
                  value={cuentaId}
                  onChange={(evento) => setCuentaId(evento.target.value)}
                  error={errores.cuentaId}
                  disabled={sinCatalogos}
                  ayuda={
                    cuentaSeleccionada && !cuentaSeleccionada.activo
                      ? 'La cuenta está inactiva; puedes registrar la posición igualmente.'
                      : undefined
                  }
                  required
                >
                  <option value="">Selecciona una cuenta</option>
                  {cuentas.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {cuenta.nombre}
                      {!cuenta.activo ? ' (inactiva)' : ''}
                    </option>
                  ))}
                </CampoSelect>

                <CampoSelect
                  etiqueta="Instrumento"
                  name="instrumentoId"
                  value={instrumentoId}
                  onChange={(evento) => setInstrumentoId(evento.target.value)}
                  error={errores.instrumentoId}
                  disabled={sinCatalogos}
                  ayuda="Los instrumentos se agrupan por categoría."
                  required
                >
                  <option value="">Selecciona un instrumento</option>
                  {instrumentosPorCategoria.map((grupo) => (
                    <optgroup key={grupo.nombre} label={grupo.nombre}>
                      {grupo.items.map((instrumento) => (
                        <option key={instrumento.id} value={instrumento.id}>
                          {instrumento.nombre}
                          {instrumento.simbolo
                            ? ` · ${instrumento.simbolo}`
                            : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </CampoSelect>
              </>
            )}

            <Campo
              etiqueta="Cantidad"
              name="cantidad"
              value={cantidad}
              onChange={(evento) => setCantidad(evento.target.value)}
              error={errores.cantidad}
              ayuda="Admite hasta 10 decimales, por ejemplo 10.5 o 0.0001."
              inputMode="decimal"
              autoComplete="off"
              required
            />

            <Campo
              etiqueta="Costo unitario"
              name="costoUnitario"
              value={costoUnitario}
              onChange={(evento) => setCostoUnitario(evento.target.value)}
              error={errores.costoUnitario}
              ayuda={`Costo por unidad en ${monedaCodigo}.`}
              inputMode="decimal"
              autoComplete="off"
              required
            />

            <Campo
              etiqueta="Fecha de apertura"
              name="fechaApertura"
              type="date"
              value={fechaApertura}
              onChange={(evento) => setFechaApertura(evento.target.value)}
              error={errores.fechaApertura}
              ayuda="No puede ser posterior a hoy."
              max={fechaHoyIso()}
            />

            <CampoTextarea
              etiqueta="Observaciones (opcional)"
              name="observaciones"
              value={observaciones}
              onChange={(evento) => setObservaciones(evento.target.value)}
              error={errores.observaciones}
              ayuda={`${observaciones.trim().length}/500 caracteres.`}
              maxLength={500}
              rows={3}
              placeholder="Notas sobre la posición o la operación."
              className="campo--ancho"
            />

            <div className="formulario__acciones campo--ancho">
              <Link className="boton boton--fantasma" to={enlaceVolver}>
                Cancelar
              </Link>
              <Boton
                type="submit"
                cargando={enviando}
                disabled={sinCatalogos || !cuentaId || !instrumentoId}
              >
                {editando ? <IconoCheck /> : <IconoMas />}
                {editando ? 'Guardar cambios' : 'Crear posición'}
              </Boton>
            </div>
          </form>
        </FinancialCard>
      )}
    </div>
  );
}
