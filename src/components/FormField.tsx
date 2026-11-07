import type { ReactNode } from 'react';

export interface FormFieldProps {
  etiqueta: string;
  htmlFor?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Envoltorio accesible para controles de formulario.
 *
 * <p>Centraliza la etiqueta, el estado de error y el texto de ayuda para que
 * todos los formularios compartan la misma estructura y los mismos ids de
 * descripción.</p>
 */
export function FormField({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  requerido = false,
  className,
  children,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const ayudaId = htmlFor ? `${htmlFor}-ayuda` : undefined;

  return (
    <div
      className={`form-field ${error ? 'form-field--error' : ''} ${
        className ?? ''
      }`.trim()}
    >
      <label className="form-field__label" htmlFor={htmlFor}>
        {etiqueta}
        {requerido ? (
          <span className="form-field__required" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="form-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="form-field__help" id={ayudaId}>
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
