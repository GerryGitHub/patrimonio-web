import { useRef, type KeyboardEvent } from 'react';
import {
  IconoActividad,
  IconoEscudo,
  IconoGrafico,
  IconoRentaFija,
  IconoResumen,
  IconoTendencia,
} from '../icons';

export type PestanaCuenta =
  | 'resumen'
  | 'movimientos'
  | 'posiciones'
  | 'contratos'
  | 'rendimientos'
  | 'valuacion';

export const PESTANAS_CUENTA: ReadonlyArray<{
  id: PestanaCuenta;
  etiqueta: string;
  Icono: typeof IconoResumen;
}> = [
  { id: 'resumen', etiqueta: 'Resumen', Icono: IconoResumen },
  { id: 'movimientos', etiqueta: 'Movimientos', Icono: IconoActividad },
  { id: 'posiciones', etiqueta: 'Posiciones', Icono: IconoRentaFija },
  { id: 'contratos', etiqueta: 'Contratos', Icono: IconoEscudo },
  { id: 'rendimientos', etiqueta: 'Rendimientos', Icono: IconoTendencia },
  { id: 'valuacion', etiqueta: 'Valuación', Icono: IconoGrafico },
];

interface CuentaTabsProps {
  activa: PestanaCuenta;
  onCambiar: (pestana: PestanaCuenta) => void;
}

/**
 * Navegación por pestañas de la cuenta.
 *
 * <p>Implementa el patrón ARIA de pestañas con una sola parada de tabulación y
 * navegación con flechas, Inicio y Fin. El panel asociado se identifica con
 * `aria-controls` y `aria-labelledby` desde la página.</p>
 */
export function CuentaTabs({ activa, onCambiar }: CuentaTabsProps) {
  const botones = useRef(new Map<PestanaCuenta, HTMLButtonElement>());

  function manejarTeclado(evento: KeyboardEvent<HTMLDivElement>) {
    const indiceActual = PESTANAS_CUENTA.findIndex(
      (pestana) => pestana.id === activa,
    );
    let siguiente = indiceActual;

    if (evento.key === 'ArrowRight') {
      siguiente = (indiceActual + 1) % PESTANAS_CUENTA.length;
    } else if (evento.key === 'ArrowLeft') {
      siguiente = (indiceActual - 1 + PESTANAS_CUENTA.length) % PESTANAS_CUENTA.length;
    } else if (evento.key === 'Home') {
      siguiente = 0;
    } else if (evento.key === 'End') {
      siguiente = PESTANAS_CUENTA.length - 1;
    } else {
      return;
    }

    evento.preventDefault();
    const destino = PESTANAS_CUENTA[siguiente];
    if (!destino) {
      return;
    }
    onCambiar(destino.id);
    botones.current.get(destino.id)?.focus();
  }

  return (
    <div
      className="tabs-cuenta"
      role="tablist"
      aria-label="Secciones de la cuenta"
      onKeyDown={manejarTeclado}
    >
      {PESTANAS_CUENTA.map(({ id, etiqueta, Icono }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          className="tabs-cuenta__tab"
          aria-selected={activa === id}
          aria-controls={`panel-${id}`}
          tabIndex={activa === id ? 0 : -1}
          onClick={() => onCambiar(id)}
          ref={(elemento) => {
            if (elemento) {
              botones.current.set(id, elemento);
            } else {
              botones.current.delete(id);
            }
          }}
        >
          <Icono />
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
