import type { ReactNode } from 'react';

export interface ColumnaTabla<T> {
  clave: string;
  encabezado: string;
  render: (fila: T) => ReactNode;
  alineacion?: 'izquierda' | 'derecha' | 'centro';
  ocultarEnMovil?: boolean;
}

export interface DataTableProps<T> {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  obtenerClave: (fila: T) => string;
  titulo?: string;
  descripcion?: string;
  vacio?: ReactNode;
  cargando?: boolean;
  esqueleto?: ReactNode;
  className?: string;
}

/**
 * Tabla de datos financiera.
 *
 * <p>En pantallas pequeñas conserva el desplazamiento horizontal y permite
 * ocultar columnas secundarias. El contenido vacío siempre se explica con un
 * estado propio, nunca con filas de ejemplo.</p>
 */
export function DataTable<T>({
  columnas,
  filas,
  obtenerClave,
  titulo,
  descripcion,
  vacio,
  cargando = false,
  esqueleto,
  className,
}: DataTableProps<T>) {
  if (cargando) {
    return <div className="data-table__vacio">{esqueleto}</div>;
  }

  if (filas.length === 0) {
    return <div className="data-table__vacio">{vacio}</div>;
  }

  return (
    <div className={`data-table-wrap ${className ?? ''}`.trim()}>
      <table className="data-table">
        {titulo ? <caption>{descripcion ?? titulo}</caption> : null}
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                className={[
                  columna.alineacion === 'derecha'
                    ? 'data-table__col--derecha'
                    : columna.alineacion === 'centro'
                      ? 'data-table__col--centro'
                      : '',
                  columna.ocultarEnMovil
                    ? 'data-table__col--opcional'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {columna.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={obtenerClave(fila)}>
              {columnas.map((columna) => (
                <td
                  key={columna.clave}
                  className={[
                    columna.alineacion === 'derecha'
                      ? 'data-table__col--derecha'
                      : columna.alineacion === 'centro'
                        ? 'data-table__col--centro'
                        : '',
                    columna.ocultarEnMovil
                      ? 'data-table__col--opcional'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {columna.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
