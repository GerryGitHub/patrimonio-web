import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  actualizarInstrumento,
  crearInstrumento,
  listarCategoriasInstrumento,
  listarTiposInstrumento,
  obtenerInstrumento,
} from '../api/instrumentos';
import { listarMonedas } from '../api/portafolios';
import type {
  ClaseActivo,
  Instrumento,
  Moneda,
  TipoInstrumento,
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
import {
  esNoAutenticado,
  esNoEncontrado,
  mensajeDeError,
} from '../lib/errors';
import {
  tieneErrores,
  validarInstrumento,
  type ErroresInstrumento,
} from '../lib/validation';

const AYUDAS_CATEGORIA: Record<string, string> = {
  'renta variable':
    'Acciones, ETFs y participaciones. El símbolo y el mercado suelen ser relevantes.',
  'renta fija':
    'Bonos, notas y otros instrumentos de deuda. El emisor y el mercado ayudan a identificarlos.',
  'activos digitales':
    'Criptomonedas y tokens. El símbolo y el identificador externo del proveedor son opcionales.',
};

function ayudaCategoria(nombre: string | undefined): string {
  if (!nombre) {
    return 'Selecciona una categoría para ver los tipos disponibles.';
  }
  return (
    AYUDAS_CATEGORIA[nombre.toLowerCase()] ??
    'La categoría agrupa el instrumento para los filtros y la distribución del portafolio.'
  );
}

export function InstrumentoFormPage() {
  const { instrumentoId } = useParams();
  const editando = Boolean(instrumentoId);
  const navigate = useNavigate();
  const { marcarSesionExpirada } = useAuth();

  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [categorias, setCategorias] = useState<ClaseActivo[]>([]);
  const [tipos, setTipos] = useState<TipoInstrumento[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [intento, setIntento] = useState(0);

  const [claseActivoId, setClaseActivoId] = useState('');
  const [tipoInstrumentoId, setTipoInstrumentoId] = useState('');
  const [nombre, setNombre] = useState('');
  const [simbolo, setSimbolo] = useState('');
  const [emisor, setEmisor] = useState('');
  const [mercado, setMercado] = useState('');
  const [monedaId, setMonedaId] = useState('');
  const [identificadorExterno, setIdentificadorExterno] = useState('');
  const [isin, setIsin] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [errores, setErrores] = useState<ErroresInstrumento>({});
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
          catalogoCategorias,
          catalogoTipos,
          catalogoMonedas,
          instrumentoActual,
        ] = await Promise.all([
          listarCategoriasInstrumento(),
          listarTiposInstrumento(),
          listarMonedas(),
          editando && instrumentoId
            ? obtenerInstrumento(instrumentoId)
            : Promise.resolve(null),
        ]);

        if (cancelado) {
          return;
        }

        setMonedas(catalogoMonedas);

        if (instrumentoActual) {
          setInstrumento(instrumentoActual);

          const categoriaActual = catalogoCategorias.find(
            (categoria) => categoria.id === instrumentoActual.claseActivoId,
          );
          const tipoActual = catalogoTipos.find(
            (tipo) => tipo.id === instrumentoActual.tipoInstrumentoId,
          );

          setCategorias(
            categoriaActual
              ? catalogoCategorias
              : [
                  ...catalogoCategorias,
                  {
                    id: instrumentoActual.claseActivoId,
                    nombre: instrumentoActual.claseActivoNombre,
                    descripcion: null,
                    activo: true,
                  },
                ],
          );
          setTipos(
            tipoActual
              ? catalogoTipos
              : [
                  ...catalogoTipos,
                  {
                    id: instrumentoActual.tipoInstrumentoId,
                    claseActivoId: instrumentoActual.claseActivoId,
                    claseActivoNombre: instrumentoActual.claseActivoNombre,
                    nombre: instrumentoActual.tipoInstrumentoNombre,
                    descripcion: null,
                    activo: true,
                  },
                ],
          );

          setClaseActivoId(instrumentoActual.claseActivoId);
          setTipoInstrumentoId(instrumentoActual.tipoInstrumentoId);
          setNombre(instrumentoActual.nombre);
          setSimbolo(instrumentoActual.simbolo ?? '');
          setEmisor(instrumentoActual.emisor ?? '');
          setMercado(instrumentoActual.mercado ?? '');
          setMonedaId(instrumentoActual.monedaId);
          setIdentificadorExterno(instrumentoActual.identificadorExterno ?? '');
          setIsin(instrumentoActual.isin ?? '');
          setDescripcion(instrumentoActual.descripcion ?? '');
          return;
        }

        setCategorias(catalogoCategorias);
        setTipos(catalogoTipos);

        const primeraCategoria = catalogoCategorias[0];
        const primerTipo = catalogoTipos.find(
          (tipo) => tipo.claseActivoId === primeraCategoria?.id,
        );
        setClaseActivoId(primeraCategoria?.id ?? '');
        setTipoInstrumentoId(primerTipo?.id ?? '');
        setMonedaId(catalogoMonedas[0]?.id ?? '');
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
        setErrorCarga(mensajeDeError(fallo, 'instrumento'));
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
  }, [instrumentoId, editando, intento, marcarSesionExpirada]);

  const tiposFiltrados = tipos.filter(
    (tipo) => tipo.claseActivoId === claseActivoId,
  );
  const categoriaSeleccionada = categorias.find(
    (categoria) => categoria.id === claseActivoId,
  );
  const tipoSeleccionado = tipos.find(
    (tipo) => tipo.id === tipoInstrumentoId,
  );
  const monedaSeleccionada = monedas.find(
    (moneda) => moneda.id === monedaId,
  );

  const sinCatalogos =
    !cargando &&
    !errorCarga &&
    !noEncontrado &&
    (categorias.length === 0 || tipos.length === 0 || monedas.length === 0);

  function cambiarCategoria(valor: string) {
    setClaseActivoId(valor);
    const disponibles = tipos.filter(
      (tipo) => tipo.claseActivoId === valor,
    );
    if (!disponibles.some((tipo) => tipo.id === tipoInstrumentoId)) {
      setTipoInstrumentoId(disponibles[0]?.id ?? '');
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorEnvio(null);

    const validacion = validarInstrumento({
      tipoInstrumentoId,
      nombre,
      simbolo,
      emisor,
      mercado,
      monedaId,
      identificadorExterno,
      isin,
      descripcion,
    });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    setEnviando(true);
    try {
      const datos = {
        tipoInstrumentoId,
        nombre: nombre.trim(),
        simbolo: simbolo.trim() || undefined,
        emisor: emisor.trim() || undefined,
        mercado: mercado.trim() || undefined,
        monedaId,
        identificadorExterno: identificadorExterno.trim() || undefined,
        isin: isin.trim().toUpperCase() || undefined,
        descripcion: descripcion.trim() || undefined,
      };

      const guardado =
        editando && instrumentoId
          ? await actualizarInstrumento(instrumentoId, datos)
          : await crearInstrumento(datos);

      navigate(`/instrumentos/${encodeURIComponent(guardado.id)}`, {
        replace: true,
        state: editando ? { actualizado: true } : { creado: true },
      });
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEnvio(mensajeDeError(fallo, 'instrumento'));
    } finally {
      setEnviando(false);
    }
  }

  const enlaceVolver =
    editando && instrumentoId
      ? `/instrumentos/${encodeURIComponent(instrumentoId)}`
      : '/instrumentos';

  return (
    <div className="page">
      <Link className="volver" to={enlaceVolver}>
        <IconoVolver />
        {editando ? 'Volver al instrumento' : 'Volver al catálogo'}
      </Link>

      <PageHeader
        eyebrow={editando ? 'Editar instrumento' : 'Nuevo instrumento'}
        titulo={
          cargando
            ? 'Cargando formulario.'
            : noEncontrado
              ? 'Instrumento no encontrado'
              : editando
                ? `Editar ${instrumento?.nombre ?? 'instrumento'}`
                : 'Registrar instrumento financiero'
        }
        descripcion="El catálogo es global y compartido. El estado se cambia desde el detalle del instrumento."
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
          titulo="No encontramos este instrumento"
          descripcion="Puede que ya no exista o que el catálogo haya cambiado. Vuelve al catálogo para elegir otro instrumento."
          accion={
            <Link className="btn btn--secundario" to="/instrumentos">
              Volver al catálogo
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
          id="titulo-formulario-instrumento"
          titulo={editando ? 'Actualiza el instrumento' : 'Datos del instrumento'}
          subtitulo="La categoría agrupa el instrumento y determina los tipos disponibles. La moneda se usa para expresar el costo de sus posiciones."
          acciones={
            monedaSeleccionada ? (
              <span className="dato-chip">
                <strong>{monedaSeleccionada.codigo}</strong>
                {monedaSeleccionada.decimales} decimales
              </span>
            ) : null
          }
        >
          {errorEnvio ? <Alerta variante="error">{errorEnvio}</Alerta> : null}

          {sinCatalogos ? (
            <Alerta variante="info">
              Faltan datos en los catálogos: necesitas al menos una categoría,
              un tipo de instrumento y una moneda para registrar instrumentos.
            </Alerta>
          ) : null}

          <div className="instrumento-categoria">
            <div>
              <p className="instrumento-categoria__eyebrow">Categoría activa</p>
              <h3>
                {categoriaSeleccionada?.nombre ?? 'Sin categoría seleccionada'}
              </h3>
              <p>{ayudaCategoria(categoriaSeleccionada?.nombre)}</p>
            </div>
            <div className="instrumento-categoria__tipo">
              <span>Tipo seleccionado</span>
              <strong>
                {tipoSeleccionado?.nombre ?? 'Selecciona un tipo'}
              </strong>
            </div>
          </div>

          <form
            className="formulario formulario--cuenta"
            onSubmit={enviar}
            noValidate
          >
            <Campo
              etiqueta="Nombre del instrumento"
              name="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              error={errores.nombre}
              ayuda="Por ejemplo «Apple Inc.» o «Bono corporativo 2030»."
              maxLength={200}
              autoComplete="off"
              autoFocus
              required
            />

            <Campo
              etiqueta="Símbolo (opcional)"
              name="simbolo"
              value={simbolo}
              onChange={(evento) => setSimbolo(evento.target.value)}
              error={errores.simbolo}
              ayuda="Ticker o clave corta, por ejemplo AAPL o BTC."
              maxLength={32}
              autoComplete="off"
            />

            <CampoSelect
              etiqueta="Categoría"
              name="claseActivoId"
              value={claseActivoId}
              onChange={(evento) => cambiarCategoria(evento.target.value)}
              disabled={sinCatalogos}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Tipo de instrumento"
              name="tipoInstrumentoId"
              value={tipoInstrumentoId}
              onChange={(evento) =>
                setTipoInstrumentoId(evento.target.value)
              }
              error={errores.tipoInstrumentoId}
              disabled={sinCatalogos || tiposFiltrados.length === 0}
              required
            >
              <option value="">Selecciona un tipo</option>
              {tiposFiltrados.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </CampoSelect>

            <Campo
              etiqueta="Emisor (opcional)"
              name="emisor"
              value={emisor}
              onChange={(evento) => setEmisor(evento.target.value)}
              error={errores.emisor}
              maxLength={150}
              autoComplete="off"
            />

            <Campo
              etiqueta="Mercado (opcional)"
              name="mercado"
              value={mercado}
              onChange={(evento) => setMercado(evento.target.value)}
              error={errores.mercado}
              ayuda="Bolsa, exchange o plataforma donde cotiza."
              maxLength={100}
              autoComplete="off"
            />

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
              etiqueta="ISIN (opcional)"
              name="isin"
              value={isin}
              onChange={(evento) => setIsin(evento.target.value.toUpperCase())}
              error={errores.isin}
              ayuda="12 caracteres alfanuméricos. Se guarda como identificador ISIN."
              maxLength={12}
              autoComplete="off"
              placeholder="US0378331005"
            />

            <Campo
              etiqueta="Identificador externo (opcional)"
              name="identificadorExterno"
              value={identificadorExterno}
              onChange={(evento) =>
                setIdentificadorExterno(evento.target.value)
              }
              error={errores.identificadorExterno}
              ayuda="Clave del proveedor de datos, si existe."
              maxLength={100}
              autoComplete="off"
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
              placeholder="Notas sobre el instrumento."
              className="campo--ancho"
            />

            <div className="formulario__acciones campo--ancho">
              <Link className="boton boton--fantasma" to={enlaceVolver}>
                Cancelar
              </Link>
              <Boton
                type="submit"
                cargando={enviando}
                disabled={sinCatalogos || !tipoInstrumentoId || !monedaId}
              >
                {editando ? <IconoCheck /> : <IconoMas />}
                {editando ? 'Guardar cambios' : 'Crear instrumento'}
              </Boton>
            </div>
          </form>
        </FinancialCard>
      )}
    </div>
  );
}
