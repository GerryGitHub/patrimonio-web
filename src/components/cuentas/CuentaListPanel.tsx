import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CuentaFinanciera,
  Institucion,
  Moneda,
  TipoCuenta,
} from '../../api/types';
import { EmptyState } from '../EmptyState';
import { FinancialCard } from '../FinancialCard';
import { FilterBar } from '../FilterBar';
import { StatusBadge } from '../StatusBadge';
import { Boton, Campo, CampoSelect } from '../ui';
import { IconoCuenta, IconoMas, IconoVacio } from '../icons';
import { normalizarTexto } from '../../lib/texto';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

interface CuentaListPanelProps {
  cuentas: CuentaFinanciera[];
  instituciones: Institucion[];
  tiposCuenta: TipoCuenta[];
  monedas: Moneda[];
  seleccionadaId: string;
  rutaBase: string;
}

/**
 * Panel izquierdo del maestro-detalle.
 *
 * <p>Contiene la búsqueda, los filtros y la selección de cuentas. No calcula
 * importes ni accede a la API: recibe las cuentas ya autorizadas por el
 * portafolio y solo decide cómo listarlas.</p>
 */
export function CuentaListPanel({
  cuentas,
  instituciones,
  tiposCuenta,
  monedas,
  seleccionadaId,
  rutaBase,
}: CuentaListPanelProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroInstitucion, setFiltroInstitucion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  const institucionesPorId = useMemo(
    () =>
      new Map(
        instituciones.map((institucion) => [institucion.id, institucion]),
      ),
    [instituciones],
  );
  const tiposPorId = useMemo(
    () => new Map(tiposCuenta.map((tipo) => [tipo.id, tipo])),
    [tiposCuenta],
  );
  const monedasPorId = useMemo(
    () => new Map(monedas.map((moneda) => [moneda.id, moneda])),
    [monedas],
  );

  const hayFiltros =
    busqueda.trim() !== '' ||
    filtroInstitucion !== '' ||
    filtroTipo !== '' ||
    filtroEstado !== 'todos';

  const filtradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return cuentas.filter((cuenta) => {
      if (filtroInstitucion && cuenta.institucionId !== filtroInstitucion) {
        return false;
      }
      if (filtroTipo && cuenta.tipoCuentaId !== filtroTipo) {
        return false;
      }
      if (
        filtroEstado !== 'todos' &&
        cuenta.activo !== (filtroEstado === 'activos')
      ) {
        return false;
      }
      if (!texto) {
        return true;
      }

      const institucion = institucionesPorId.get(cuenta.institucionId);
      const tipo = tiposPorId.get(cuenta.tipoCuentaId);
      const moneda = monedasPorId.get(cuenta.monedaId);
      const contenido = normalizarTexto(
        [
          cuenta.nombre,
          cuenta.numeroCuenta ?? '',
          institucion?.nombre ?? '',
          tipo?.nombre ?? '',
          moneda?.codigo ?? '',
        ].join(' '),
      );

      return contenido.includes(texto);
    });
  }, [
    cuentas,
    busqueda,
    filtroInstitucion,
    filtroTipo,
    filtroEstado,
    institucionesPorId,
    tiposPorId,
    monedasPorId,
  ]);

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroInstitucion('');
    setFiltroTipo('');
    setFiltroEstado('todos');
  }

  return (
    <FinancialCard
      titulo="Mis cuentas"
      subtitulo="Selecciona una cuenta para consultar su detalle."
    >
      <div className="section-stack">
        <div className="cuentas-efectivo__herramientas">
          <Campo
            etiqueta="Buscar cuenta"
            type="search"
            placeholder="Nombre, institución, tipo o referencia"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />

          <FilterBar
            acciones={
              hayFiltros ? (
                <Boton variante="fantasma" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Boton>
              ) : null
            }
          >
            <CampoSelect
              etiqueta="Institución"
              value={filtroInstitucion}
              onChange={(evento) => setFiltroInstitucion(evento.target.value)}
            >
              <option value="">Todas las instituciones</option>
              {instituciones.map((elemento) => (
                <option key={elemento.id} value={elemento.id}>
                  {elemento.nombre}
                  {!elemento.activo ? ' (inactiva)' : ''}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Tipo de cuenta"
              value={filtroTipo}
              onChange={(evento) => setFiltroTipo(evento.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tiposCuenta.map((elemento) => (
                <option key={elemento.id} value={elemento.id}>
                  {elemento.nombre}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Estado de la cuenta"
              value={filtroEstado}
              onChange={(evento) =>
                setFiltroEstado(evento.target.value as FiltroEstado)
              }
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Solo activas</option>
              <option value="inactivos">Solo inactivas</option>
            </CampoSelect>
          </FilterBar>
        </div>

        {filtradas.length === 0 ? (
          hayFiltros ? (
            <EmptyState
              compacta
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
            <EmptyState
              compacta
              icono={<IconoCuenta />}
              titulo="Este portafolio no tiene cuentas"
              descripcion="Registra una cuenta financiera para empezar a organizar su información."
              accion={
                <Link
                  className="btn btn--primario"
                  to={`${rutaBase}/nueva`}
                >
                  <IconoMas />
                  Registrar cuenta
                </Link>
              }
            />
          )
        ) : (
          <ul className="cuenta-lista" aria-label="Cuentas financieras">
            {filtradas.map((cuenta) => {
              const institucion = institucionesPorId.get(cuenta.institucionId);
              const tipo = tiposPorId.get(cuenta.tipoCuentaId);
              const moneda = monedasPorId.get(cuenta.monedaId);
              const activa = cuenta.id === seleccionadaId;

              return (
                <li key={cuenta.id}>
                  <Link
                    className={`cuenta-lista__item ${
                      activa ? 'cuenta-lista__item--activa' : ''
                    }`.trim()}
                    to={`${rutaBase}/${encodeURIComponent(cuenta.id)}`}
                    aria-current={activa ? 'page' : undefined}
                    aria-label={`Seleccionar la cuenta ${cuenta.nombre}`}
                  >
                    <span className="cuenta-lista__icono" aria-hidden="true">
                      <IconoCuenta />
                    </span>
                    <span className="cuenta-lista__cuerpo">
                      <span className="cuenta-lista__titulo">
                        <strong>{cuenta.nombre}</strong>
                        <StatusBadge
                          estado={cuenta.activo ? 'activo' : 'inactivo'}
                        >
                          {cuenta.activo ? 'Activa' : 'Inactiva'}
                        </StatusBadge>
                      </span>
                      <span className="cuenta-lista__meta">
                        <span>
                          {institucion?.nombre ?? 'Institución no disponible'}
                        </span>
                        <span>{tipo?.nombre ?? 'Tipo no disponible'}</span>
                        <span className="moneda-chip">
                          {moneda?.codigo ?? '—'}
                        </span>
                      </span>
                      <span className="cuenta-lista__referencia">
                        {cuenta.numeroCuenta ?? 'Sin referencia'}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FinancialCard>
  );
}
