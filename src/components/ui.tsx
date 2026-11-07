import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import {
  IconoAlerta,
  IconoCheck,
  IconoOjo,
  IconoOjoCerrado,
} from './icons';
import { EmptyState } from './EmptyState';
import { FormField } from './FormField';
import { StatusBadge } from './StatusBadge';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'exito';
  cargando?: boolean;
  anchoCompleto?: boolean;
}

export function Boton({
  variante = 'primario',
  cargando = false,
  anchoCompleto = false,
  className,
  children,
  disabled,
  ...props
}: BotonProps) {
  const clases = [
    'boton',
    `boton--${variante}`,
    anchoCompleto ? 'boton--ancho' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={clases}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando ? <span className="boton__spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  sufijo?: ReactNode;
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  sufijo,
  id,
  className,
  ...props
}: CampoProps) {
  const generado = useId();
  const inputId = id ?? generado;
  const descripcionId = error
    ? `${inputId}-error`
    : ayuda
      ? `${inputId}-ayuda`
      : undefined;

  return (
    <FormField
      etiqueta={etiqueta}
      htmlFor={inputId}
      error={error}
      ayuda={ayuda}
      requerido={props.required}
      className={className}
    >
      <div className="form-field__control-wrap">
        <input
          id={inputId}
          className="form-field__control"
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcionId}
          {...props}
        />
        {sufijo}
      </div>
    </FormField>
  );
}

interface CampoTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

export function CampoTextarea({
  etiqueta,
  error,
  ayuda,
  id,
  className,
  ...props
}: CampoTextareaProps) {
  const generado = useId();
  const inputId = id ?? generado;
  const descripcionId = error
    ? `${inputId}-error`
    : ayuda
      ? `${inputId}-ayuda`
      : undefined;

  return (
    <FormField
      etiqueta={etiqueta}
      htmlFor={inputId}
      error={error}
      ayuda={ayuda}
      requerido={props.required}
      className={className}
    >
      <textarea
        id={inputId}
        className="form-field__control form-field__control--textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcionId}
        {...props}
      />
    </FormField>
  );
}

interface CampoSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
}

export function CampoSelect({
  etiqueta,
  error,
  ayuda,
  children,
  id,
  className,
  ...props
}: CampoSelectProps) {
  const generado = useId();
  const inputId = id ?? generado;
  const descripcionId = error
    ? `${inputId}-error`
    : ayuda
      ? `${inputId}-ayuda`
      : undefined;

  return (
    <FormField
      etiqueta={etiqueta}
      htmlFor={inputId}
      error={error}
      ayuda={ayuda}
      requerido={props.required}
      className={className}
    >
      <select
        id={inputId}
        className="form-field__control form-field__control--select"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcionId}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}

export function CampoPassword(
  props: Omit<CampoProps, 'type' | 'sufijo'>,
) {
  const [visible, setVisible] = useState(false);

  return (
    <Campo
      {...props}
      type={visible ? 'text' : 'password'}
      sufijo={
        <button
          type="button"
          className="form-field__suffix"
          onClick={() => setVisible((valor) => !valor)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <IconoOjoCerrado /> : <IconoOjo />}
        </button>
      }
    />
  );
}

interface AlertaProps {
  variante?: 'error' | 'exito' | 'info';
  children: ReactNode;
  className?: string;
}

export function Alerta({
  variante = 'info',
  children,
  className,
}: AlertaProps) {
  return (
    <div
      className={`alerta alerta--${variante} ${className ?? ''}`.trim()}
      role={variante === 'error' ? 'alert' : 'status'}
    >
      <span className="alerta__icono" aria-hidden="true">
        {variante === 'exito' ? <IconoCheck /> : <IconoAlerta />}
      </span>
      <div className="alerta__texto">{children}</div>
    </div>
  );
}

interface EstadoVacioProps {
  icono?: ReactNode;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}

/** Compatibilidad con el nombre anterior de `EmptyState`. */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: EstadoVacioProps) {
  return (
    <EmptyState
      icono={icono}
      titulo={titulo}
      descripcion={descripcion}
      accion={accion}
    />
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return (
    <span
      className={`esqueleto ${className ?? ''}`.trim()}
      aria-hidden="true"
    />
  );
}

export function Insignia({ activo }: { activo: boolean }) {
  return (
    <StatusBadge estado={activo ? 'activo' : 'inactivo'}>
      {activo ? 'Activa' : 'Inactiva'}
    </StatusBadge>
  );
}
