import type { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';

export interface SeccionNoDisponibleProps {
  titulo: string;
  descripcion: string;
  icono?: ReactNode;
  nota?: string;
}

/**
 * Estado informativo para secciones cuya fuente de datos todavía no existe.
 *
 * <p>No representa datos vacíos ni ceros: deja explícito que la funcionalidad
 * requiere una implementación backend y evita mostrar registros simulados.</p>
 */
export function SeccionNoDisponible({
  titulo,
  descripcion,
  icono,
  nota,
}: SeccionNoDisponibleProps) {
  return (
    <section className="seccion-no-disponible" aria-label={titulo}>
      {icono ? (
        <span className="seccion-no-disponible__icono" aria-hidden="true">
          {icono}
        </span>
      ) : null}
      <div className="seccion-no-disponible__cuerpo">
        <div className="seccion-no-disponible__titulo">
          <h3>{titulo}</h3>
          <StatusBadge estado="pendiente">NO_DISPONIBLE</StatusBadge>
        </div>
        <p className="seccion-no-disponible__descripcion">{descripcion}</p>
        {nota ? (
          <p className="seccion-no-disponible__nota">{nota}</p>
        ) : null}
      </div>
    </section>
  );
}
