import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { cambiarEstadoCuenta } from '../api/cuentas';
import type { CuentaFinanciera } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { SeccionNoDisponible } from '../components/SeccionNoDisponible';
import { StatusBadge } from '../components/StatusBadge';
import { CuentaListPanel } from '../components/cuentas/CuentaListPanel';
import { CuentaPosicionesPanel } from '../components/cuentas/CuentaPosicionesPanel';
import { CuentaResumenPanel } from '../components/cuentas/CuentaResumenPanel';
import {
  CuentaTabs,
  PESTANAS_CUENTA,
  type PestanaCuenta,
} from '../components/cuentas/CuentaTabs';
import { Alerta, Boton, Esqueleto } from '../components/ui';
import {
  IconoActividad,
  IconoCheck,
  IconoCuenta,
  IconoEditar,
  IconoEscudo,
  IconoGrafico,
  IconoLiquidez,
  IconoMas,
  IconoPower,
  IconoRecargar,
  IconoRentaFija,
  IconoTendencia,
  IconoVacio,
  IconoVolver,
} from '../components/icons';
import { useCuentaSeleccionada } from '../hooks/useCuentaSeleccionada';
import { usePortafolioCuentas } from '../hooks/usePortafolioCuentas';
import { usePosicionesCuenta } from '../hooks/usePosicionesCuenta';
import { resumirPosicionesCuenta } from '../lib/cuentas';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';

interface EstadoNavegacion {
  creada?: boolean;
  actualizada?: boolean;
}

function TextoNoDisponible() {
  return <span className="dato-no-disponible">NO_DISPONIBLE</span>;
}

/**
 * Pantalla «Cuentas y efectivo».
 *
 * <p>Orquesta la carga del portafolio, la selección de la cuenta y el cambio de
 * estado. Los paneles de listado, resumen y posiciones son componentes
 * independientes; las respuestas que no corresponden a la selección vigente se
 * descartan en los hooks de datos.</p>
 */
export function CuentaDetailPage() {
  const { portafolioId = '', cuentaId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { marcarSesionExpirada } = useAuth();

  const {
    portafolio,
    cuentas,
    instituciones,
    tiposCuenta,
    monedas,
    cargando,
    error,
    noEncontrado,
    cargadoPara,
    recargar,
    aplicarCuentaActualizada,
  } = usePortafolioCuentas(portafolioId);

  const datosVigentes = cargadoPara === portafolioId;
  const cargandoVista =
    cargando || (!datosVigentes && !error && !noEncontrado);

  const {
    cuenta,
    cargando: cargandoCuenta,
    error: errorCuenta,
    noEncontrada: cuentaNoEncontrada,
    recargar: recargarCuenta,
    aplicarCuenta,
  } = useCuentaSeleccionada(portafolioId, cuentaId, datosVigentes);

  const {
    posiciones,
    cargando: cargandoPosicionesHook,
    error: errorPosiciones,
    cargadasPara,
    recargar: recargarPosicionesHook,
  } = usePosicionesCuenta(portafolioId, cuentaId, Boolean(cuenta));

  const [pestana, setPestana] = useState<PestanaCuenta>('resumen');
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(() => {
    const estado = location.state as EstadoNavegacion | null;
    if (estado?.creada) {
      return 'Cuenta creada correctamente.';
    }
    if (estado?.actualizada) {
      return 'Cambios guardados correctamente.';
    }
    return null;
  });

  const clavePosiciones = `${portafolioId}::${cuentaId}`;
  const posicionesVigentes =
    cargadasPara === clavePosiciones ? posiciones : [];
  const cargandoPosiciones =
    cargandoPosicionesHook ||
    (Boolean(cuenta) && cargadasPara !== clavePosiciones && !errorPosiciones);

  const resumenCuenta = resumirPosicionesCuenta(posicionesVigentes);

  const recargarPosiciones = recargarPosicionesHook;

  const seleccionActual = useRef({ portafolioId, cuentaId });
  const peticionEstado = useRef(0);

  useEffect(() => {
    seleccionActual.current = { portafolioId, cuentaId };
  }, [portafolioId, cuentaId]);

  useEffect(() => {
    setPestana('resumen');
    setConfirmandoEstado(false);
  }, [cuentaId]);

  const enlacePortafolio = `/activos/liquidez/${encodeURIComponent(
    portafolioId,
  )}`;
  const enlaceCuentas = `${enlacePortafolio}/cuentas`;
  const enlaceNuevaPosicion = `${enlacePortafolio}/posiciones/nueva`;

  useEffect(() => {
    if (
      !datosVigentes ||
      cargando ||
      noEncontrado ||
      error ||
      cuentaId ||
      cuentas.length === 0
    ) {
      return;
    }

    navigate(`${enlaceCuentas}/${encodeURIComponent(cuentas[0].id)}`, {
      replace: true,
    });
  }, [
    datosVigentes,
    cargando,
    noEncontrado,
    error,
    cuentaId,
    cuentas,
    navigate,
    enlaceCuentas,
  ]);

  const institucionesPorId = new Map(
    instituciones.map((institucion) => [institucion.id, institucion]),
  );
  const tiposPorId = new Map(tiposCuenta.map((tipo) => [tipo.id, tipo]));
  const monedasPorId = new Map(monedas.map((moneda) => [moneda.id, moneda]));

  const cuentasActivas = cuentas.filter((elemento) => elemento.activo).length;

  async function cambiarEstado(nuevoActivo: boolean) {
    const clave = { portafolioId, cuentaId };
    const token = peticionEstado.current + 1;
    peticionEstado.current = token;

    setCambiandoEstado(true);
    setErrorEstado(null);

    try {
      const actualizada = await cambiarEstadoCuenta(
        clave.portafolioId,
        clave.cuentaId,
        nuevoActivo,
      );

      if (peticionEstado.current !== token) {
        return;
      }

      // La respuesta solo actualiza el portafolio y la cuenta que la
      // originaron; si la selección cambió mientras tanto, se descarta.
      if (seleccionActual.current.portafolioId === clave.portafolioId) {
        aplicarCuentaActualizada(actualizada);
      }
      if (seleccionActual.current.cuentaId === clave.cuentaId) {
        aplicarCuenta(actualizada);
      }

      setConfirmandoEstado(false);
      setAviso(
        nuevoActivo
          ? 'Cuenta reactivada correctamente.'
          : 'Cuenta desactivada correctamente. Su historial se conserva.',
      );
    } catch (fallo) {
      if (peticionEstado.current !== token) {
        return;
      }
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEstado(mensajeDeError(fallo, 'cuenta'));
    } finally {
      if (peticionEstado.current === token) {
        setCambiandoEstado(false);
      }
    }
  }

  function contenidoPestana(cuentaSeleccionada: CuentaFinanciera) {
    if (pestana === 'resumen') {
      return (
        <CuentaResumenPanel
          cuenta={cuentaSeleccionada}
          institucion={institucionesPorId.get(cuentaSeleccionada.institucionId)}
          tipoCuenta={tiposPorId.get(cuentaSeleccionada.tipoCuentaId)}
          moneda={monedasPorId.get(cuentaSeleccionada.monedaId)}
          resumen={resumenCuenta}
          cargandoPosiciones={cargandoPosiciones}
          errorPosiciones={errorPosiciones}
          onVerPosiciones={() => setPestana('posiciones')}
          onReintentarPosiciones={recargarPosiciones}
        />
      );
    }

    if (pestana === 'posiciones') {
      return (
        <CuentaPosicionesPanel
          portafolioId={portafolioId}
          posiciones={posicionesVigentes}
          resumen={resumenCuenta}
          cargando={cargandoPosiciones}
          error={errorPosiciones}
          enlaceNuevaPosicion={enlaceNuevaPosicion}
          onRecargar={recargarPosiciones}
        />
      );
    }

    if (pestana === 'movimientos') {
      return (
        <SeccionNoDisponible
          icono={<IconoActividad />}
          titulo="Movimientos de efectivo"
          descripcion="La API actual no expone depósitos, retiros, transferencias ni otros movimientos de efectivo de la cuenta. Los movimientos de inversión se consultan en el detalle de cada posición y no se presentan aquí como movimientos de efectivo."
          nota="No se muestran registros simulados ni se mezclan operaciones de inversión con saldos de efectivo."
        />
      );
    }

    if (pestana === 'contratos') {
      return (
        <SeccionNoDisponible
          icono={<IconoEscudo />}
          titulo="Contratos"
          descripcion="La API actual no expone contratos, vencimientos ni condiciones asociadas a la cuenta."
          nota="La sección se habilitará cuando exista el contrato de contratos y vencimientos en el backend."
        />
      );
    }

    if (pestana === 'rendimientos') {
      return (
        <SeccionNoDisponible
          icono={<IconoTendencia />}
          titulo="Rendimientos"
          descripcion="La API actual no expone intereses, comisiones ni rendimientos por cuenta. El resultado realizado de las posiciones se consulta en el módulo de inversiones."
          nota="No se calculan rendimientos estimados ni se atribuyen intereses sin una fuente real."
        />
      );
    }

    return (
      <SeccionNoDisponible
        icono={<IconoGrafico />}
        titulo="Valuación de la cuenta"
        descripcion="La API actual no expone precios de mercado ni valuaciones por cuenta. El costo registrado de las posiciones no representa una valuación de mercado."
        nota="La valuación se habilitará cuando exista una fuente de precios y un contrato de valuaciones."
      />
    );
  }

  return (
    <div className="page cuentas-efectivo">
      <Link className="volver" to={enlacePortafolio}>
        <IconoVolver />
        Volver al portafolio
      </Link>

      <PageHeader
        eyebrow="Mis activos · Liquidez y cuentas"
        titulo="Cuentas y efectivo"
        descripcion="Administra las cuentas del portafolio, consulta sus posiciones registradas y revisa el detalle operativo de cada cuenta. El efectivo se mostrará cuando exista una fuente real de saldos."
        acciones={
          <>
            <Link
              className="btn btn--primario"
              to={`${enlaceCuentas}/nueva`}
            >
              <IconoMas />
              Nueva cuenta
            </Link>
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar cuentas y efectivo"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </>
        }
        meta={
          datosVigentes && !cargando && !error && !noEncontrado ? (
            <span className="dato-chip">
              <strong>{cuentas.length}</strong>
              {cuentas.length === 1 ? ' cuenta' : ' cuentas'}
            </span>
          ) : null
        }
      />

      {aviso ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>{aviso}</span>
            <Boton variante="secundario" onClick={() => setAviso(null)}>
              Entendido
            </Boton>
          </div>
        </Alerta>
      ) : null}

      {errorEstado ? <Alerta variante="error">{errorEstado}</Alerta> : null}

      {cargandoVista ? (
        <div className="cuentas-efectivo__layout" aria-hidden="true">
          <FinancialCard
            titulo="Mis cuentas"
            subtitulo="Cargando cuentas…"
          >
            <div className="section-stack">
              <Esqueleto className="esqueleto--titulo" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          </FinancialCard>
          <FinancialCard
            titulo="Detalle de la cuenta"
            subtitulo="Cargando la cuenta seleccionada…"
          >
            <div className="section-stack">
              <Esqueleto className="esqueleto--titulo" />
              <Esqueleto className="esqueleto--linea" />
              <Esqueleto className="esqueleto--linea" />
            </div>
          </FinancialCard>
        </div>
      ) : noEncontrado || (datosVigentes && !portafolio) ? (
        <EmptyState
          icono={<IconoVacio />}
          titulo="No encontramos este portafolio"
          descripcion="Puede que ya no exista o que no tengas acceso a él. Vuelve a Liquidez y cuentas para elegir otro portafolio."
          accion={
            <Link className="btn btn--secundario" to="/activos/liquidez">
              Volver a Liquidez y cuentas
            </Link>
          }
        />
      ) : error ? (
        <ErrorState
          mensaje={error}
          titulo="No se pudieron cargar las cuentas"
          onReintentar={recargar}
        />
      ) : portafolio && datosVigentes ? (
        <>
          <section aria-label="Resumen de cuentas y efectivo">
            <div className="metric-grid">
              <MetricCard
                etiqueta="Cuentas activas"
                valor={cuentasActivas}
                tono="positivo"
                icono={<IconoCheck />}
                ayuda={`${cuentas.length} ${
                  cuentas.length === 1 ? 'cuenta registrada' : 'cuentas registradas'
                } en el portafolio.`}
              />
              <MetricCard
                etiqueta="Efectivo total"
                valor={<TextoNoDisponible />}
                icono={<IconoLiquidez />}
                ayuda="La API actual no expone saldos de efectivo. No se usa el costo de las posiciones como efectivo disponible."
              />
              <MetricCard
                etiqueta="Valor en inversiones"
                valor={<TextoNoDisponible />}
                tono="lavanda"
                icono={<IconoRentaFija />}
                ayuda="La API no expone precios de mercado. El costo registrado no es una valuación."
              />
              <MetricCard
                etiqueta="Total de cuentas"
                valor={cuentas.length}
                icono={<IconoCuenta />}
                ayuda={`Portafolio ${portafolio.nombre}`}
              />
            </div>
          </section>

          <div className="cuentas-efectivo__layout">
            <aside
              className="cuentas-efectivo__lista"
              aria-label="Listado de cuentas"
            >
              <CuentaListPanel
                cuentas={cuentas}
                instituciones={instituciones}
                tiposCuenta={tiposCuenta}
                monedas={monedas}
                seleccionadaId={cuentaId}
                rutaBase={enlaceCuentas}
              />
            </aside>

            <div className="cuentas-efectivo__detalle">
              {!cuentaId ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="Selecciona una cuenta del listado para ver su información."
                >
                  <EmptyState
                    compacta
                    icono={<IconoCuenta />}
                    titulo={
                      cuentas.length === 0
                        ? 'Aún no hay cuentas para mostrar'
                        : 'Selecciona una cuenta'
                    }
                    descripcion={
                      cuentas.length === 0
                        ? 'Crea la primera cuenta del portafolio para consultar su detalle, sus posiciones y las secciones operativas.'
                        : 'Elige una cuenta en el listado para consultar su resumen, movimientos, posiciones, contratos, rendimientos y valuación.'
                    }
                    accion={
                      cuentas.length === 0 ? (
                        <Link
                          className="btn btn--primario"
                          to={`${enlaceCuentas}/nueva`}
                        >
                          <IconoMas />
                          Nueva cuenta
                        </Link>
                      ) : null
                    }
                  />
                </FinancialCard>
              ) : cargandoCuenta ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="Cargando la cuenta seleccionada…"
                >
                  <div className="section-stack" aria-hidden="true">
                    <Esqueleto className="esqueleto--titulo" />
                    <Esqueleto className="esqueleto--linea" />
                    <Esqueleto className="esqueleto--linea" />
                  </div>
                </FinancialCard>
              ) : cuentaNoEncontrada ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="La cuenta solicitada no está disponible."
                >
                  <EmptyState
                    compacta
                    icono={<IconoVacio />}
                    titulo="No encontramos esta cuenta"
                    descripcion="Puede que ya no exista o que no tengas acceso a ella. Elige otra cuenta del listado para continuar."
                    accion={
                      <Link className="btn btn--secundario" to={enlaceCuentas}>
                        Elegir otra cuenta
                      </Link>
                    }
                  />
                </FinancialCard>
              ) : errorCuenta ? (
                <FinancialCard
                  titulo="Detalle de la cuenta"
                  subtitulo="No se pudo consultar la cuenta seleccionada."
                >
                  <ErrorState
                    mensaje={errorCuenta}
                    titulo="No se pudo cargar la cuenta"
                    onReintentar={recargarCuenta}
                  />
                </FinancialCard>
              ) : cuenta ? (
                <FinancialCard
                  id="titulo-detalle-cuenta"
                  titulo="Detalle de la cuenta"
                  subtitulo="Identificación, estado y secciones operativas de la cuenta seleccionada."
                  acciones={
                    <>
                      <Link
                        className="btn btn--secundario"
                        to={`${enlaceCuentas}/${encodeURIComponent(
                          cuenta.id,
                        )}/editar`}
                      >
                        <IconoEditar />
                        Editar
                      </Link>
                      <Boton
                        variante={cuenta.activo ? 'peligro' : 'primario'}
                        onClick={() => {
                          setAviso(null);
                          setErrorEstado(null);
                          setConfirmandoEstado(true);
                        }}
                        disabled={cambiandoEstado}
                      >
                        <IconoPower />
                        {cuenta.activo ? 'Desactivar' : 'Reactivar'}
                      </Boton>
                    </>
                  }
                >
                  <div className="section-stack">
                    <div className="detalle__cabecera">
                      <span className="detalle__icono" aria-hidden="true">
                        <IconoCuenta />
                      </span>
                      <div className="detalle__titulo">
                        <h3>{cuenta.nombre}</h3>
                        <StatusBadge
                          estado={cuenta.activo ? 'activo' : 'inactivo'}
                        >
                          {cuenta.activo ? 'Activa' : 'Inactiva'}
                        </StatusBadge>
                      </div>
                    </div>

                    <p className="detalle__descripcion">
                      {cuenta.descripcion ?? 'Sin descripción.'}
                    </p>

                    <CuentaTabs activa={pestana} onCambiar={setPestana} />

                    {PESTANAS_CUENTA.map(({ id }) => (
                      <div
                        key={id}
                        className="cuenta-panel"
                        role="tabpanel"
                        id={`panel-${id}`}
                        aria-labelledby={`tab-${id}`}
                        hidden={pestana !== id}
                      >
                        {pestana === id ? contenidoPestana(cuenta) : null}
                      </div>
                    ))}
                  </div>
                </FinancialCard>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {cuenta ? (
        <ConfirmationDialog
          abierto={confirmandoEstado}
          titulo={cuenta.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          descripcion={
            cuenta.activo
              ? 'La cuenta dejará de estar activa, pero su historial se conservará. Puedes reactivarla más adelante.'
              : 'La cuenta volverá a estar disponible en el portafolio y podrás usarla de nuevo.'
          }
          textoConfirmar={
            cuenta.activo ? 'Sí, desactivar' : 'Sí, reactivar'
          }
          tono={cuenta.activo ? 'peligro' : 'primario'}
          cargando={cambiandoEstado}
          onConfirmar={() => cambiarEstado(!cuenta.activo)}
          onCancelar={() => {
            if (!cambiandoEstado) {
              setConfirmandoEstado(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
