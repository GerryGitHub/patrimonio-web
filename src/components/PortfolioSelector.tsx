import { useLocation, useNavigate } from 'react-router-dom';
import { PORTAFOLIO_TODOS, usePortafolios } from '../portfolio/PortfolioContext';
import {
  IconoChevron,
  IconoPortafolio,
  IconoRecargar,
} from './icons';

/**
 * Selector global de portafolio.
 *
 * <p>Lista los portafolios autorizados, cambia la selección activa y conserva
 * la sección actual cuando la ruta pertenece a «Liquidez y cuentas». Solo
 * persiste el identificador, nunca datos financieros.</p>
 */
export function PortfolioSelector() {
  const {
    portafolios,
    cargando,
    error,
    seleccionadoId,
    seleccionar,
    recargar,
  } = usePortafolios();
  const navigate = useNavigate();
  const location = useLocation();

  function alCambiar(valor: string) {
    const id = valor === PORTAFOLIO_TODOS ? PORTAFOLIO_TODOS : valor;
    seleccionar(id);

    if (!location.pathname.startsWith('/activos/liquidez')) {
      return;
    }

    if (id === PORTAFOLIO_TODOS) {
      navigate('/activos/liquidez');
      return;
    }

    if (location.pathname.endsWith('/cuentas/nueva')) {
      navigate(`/activos/liquidez/${encodeURIComponent(id)}/cuentas/nueva`);
      return;
    }

    navigate(`/activos/liquidez/${encodeURIComponent(id)}`);
  }

  const valor = seleccionadoId ?? '';

  return (
    <div className="portfolio-selector">
      <label className="portfolio-selector__label" htmlFor="portafolio-activo">
        Portafolio
      </label>
      <div className="portfolio-selector__control">
        <IconoPortafolio />
        <select
          id="portafolio-activo"
          className="portfolio-selector__select"
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          disabled={cargando || portafolios.length === 0}
          aria-label="Portafolio activo"
        >
          {portafolios.length === 0 ? (
            <option value="">
              {cargando ? 'Cargando portafolios…' : 'Sin portafolios'}
            </option>
          ) : (
            <>
              <option value={PORTAFOLIO_TODOS}>Todos los portafolios</option>
              {portafolios.map((portafolio) => (
                <option key={portafolio.id} value={portafolio.id}>
                  {portafolio.nombre} · {portafolio.monedaBase.codigo}
                </option>
              ))}
            </>
          )}
        </select>
        <IconoChevron className="portfolio-selector__chevron" />
      </div>
      <button
        type="button"
        className="icon-button portfolio-selector__refresh"
        onClick={recargar}
        disabled={cargando}
        aria-label="Actualizar sección"
        title="Actualizar sección"
      >
        <IconoRecargar />
      </button>
      {error ? (
        <button
          type="button"
          className="portfolio-selector__retry"
          onClick={recargar}
          title={error}
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
