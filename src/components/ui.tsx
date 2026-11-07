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

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma' | 'peligro';
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
      <span>{children}</span>
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
    <div
      className={`campo ${error ? 'campo--error' : ''} ${className ?? ''}`.trim()}
    >
      <label className="campo__etiqueta" htmlFor={inputId}>
        {etiqueta}
      </label>
      <div className="campo__control-envoltura">
        <input
          id={inputId}
          className="campo__control"
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcionId}
          {...props}
        />
        {sufijo}
      </div>
      {error ? (
        <p className="campo__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="campo__ayuda" id={`${inputId}-ayuda`}>
          {ayuda}
        </p>
      ) : null}
    </div>
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
    <div
      className={`campo ${error ? 'campo--error' : ''} ${className ?? ''}`.trim()}
    >
      <label className="campo__etiqueta" htmlFor={inputId}>
        {etiqueta}
      </label>
      <textarea
        id={inputId}
        className="campo__control campo__control--textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcionId}
        {...props}
      />
      {error ? (
        <p className="campo__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="campo__ayuda" id={`${inputId}-ayuda`}>
          {ayuda}
        </p>
      ) : null}
    </div>
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
    <div
      className={`campo ${error ? 'campo--error' : ''} ${className ?? ''}`.trim()}
    >
      <label className="campo__etiqueta" htmlFor={inputId}>
        {etiqueta}
      </label>
      <select
        id={inputId}
        className="campo__control campo__control--select"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcionId}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="campo__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : ayuda ? (
        <p className="campo__ayuda" id={`${inputId}-ayuda`}>
          {ayuda}
        </p>
      ) : null}
    </div>
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
          className="campo__ojo"
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

export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  accion,
}: EstadoVacioProps) {
  return (
    <div className="estado-vacio">
      <span className="estado-vacio__icono" aria-hidden="true">
        {icono}
      </span>
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      {accion ? <div className="estado-vacio__accion">{accion}</div> : null}
    </div>
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
    <span
      className={`insignia ${
        activo ? 'insignia--activa' : 'insignia--inactiva'
      }`}
    >
      <span className="insignia__punto" aria-hidden="true" />
      {activo ? 'Activa' : 'Inactiva'}
    </span>
  );
}
