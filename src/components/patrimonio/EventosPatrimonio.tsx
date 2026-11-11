import type { EventosPatrimonio as EventosDatos } from '../../api/types';
import { formatearImporte } from '../../lib/decimales';
import { formatearFecha } from '../../lib/format';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../StatusBadge';
import { IconoCalendario } from '../icons';

interface EventosPatrimonioProps {
  eventos: EventosDatos;
}

const ETIQUETAS_TIPO: Record<string, string> = {
  VENCIMIENTO: 'Vencimiento',
  CUPON: 'Cupón',
  DIVIDENDO: 'Dividendo',
  PAGO: 'Pago',
};

/**
 * Eventos y vencimientos registrados.
 *
 * <p>No se generan eventos a partir de fechas estimadas. Si el backend no
 * dispone de contratos o pagos, la sección lo indica con un estado vacío
 * explicativo.</p>
 */
export function EventosPatrimonio({ eventos }: EventosPatrimonioProps) {
  if (eventos.estado === 'NO_DISPONIBLE') {
    return (
      <EmptyState
        compacta
        icono={<IconoCalendario />}
        titulo="Sin eventos registrados"
        descripcion={
          eventos.motivo ??
          'No existen contratos, pagos programados ni dividendos registrados.'
        }
      />
    );
  }

  if (eventos.eventos.length === 0) {
    return (
      <EmptyState
        compacta
        icono={<IconoCalendario />}
        titulo="Sin eventos en el período"
        descripcion={
          eventos.motivo ??
          'No hay vencimientos, cupones ni dividendos en el rango consultado.'
        }
      />
    );
  }

  return (
    <ul className="eventos-lista">
      {eventos.eventos.map((evento) => (
        <li className="evento-item" key={evento.id}>
          <span className="evento-item__fecha">
            {formatearFecha(evento.fecha)}
          </span>
          <span className="evento-item__datos">
            <strong>{evento.descripcion}</strong>
            <small>
              {ETIQUETAS_TIPO[evento.tipo] ?? evento.tipo} · {evento.origen}
            </small>
          </span>
          <span className="evento-item__importe">
            {evento.importe && evento.moneda ? (
              <strong>
                {formatearImporte(
                  evento.importe,
                  evento.moneda.decimales,
                )}{' '}
                {evento.moneda.codigo}
              </strong>
            ) : (
              <StatusBadge estado="neutral">Sin importe</StatusBadge>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
