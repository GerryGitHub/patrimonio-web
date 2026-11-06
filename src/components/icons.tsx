import type { SVGProps } from 'react';

type IconoProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoPortafolio(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h4l2 2h5A2.5 2.5 0 0 1 20 10.5v6A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <path d="M4 10h16" />
    </Base>
  );
}

export function IconoCuenta(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </Base>
  );
}

export function IconoFlecha(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Base>
  );
}

export function IconoVolver(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Base>
  );
}

export function IconoSalir(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h9" />
    </Base>
  );
}

export function IconoOjo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </Base>
  );
}

export function IconoOjoCerrado(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6" />
      <path d="M6.5 6.9A17 17 0 0 0 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Base>
  );
}

export function IconoEscudo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 19 6v5.2c0 4.4-2.9 7.8-7 9.3-4.1-1.5-7-4.9-7-9.3V6l7-2.5Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </Base>
  );
}

export function IconoGrafico(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3.2-3.5 3 2.2L18 8" />
      <path d="M15.5 8H18v2.5" />
    </Base>
  );
}

export function IconoCheck(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </Base>
  );
}

export function IconoAlerta(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </Base>
  );
}

export function IconoRecargar(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 5v6h-6" />
    </Base>
  );
}

export function IconoVacio(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 9.5 6.5 5h11L20 9.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V9.5Z" />
      <path d="M4 9.5h16" />
      <path d="M9 13h6" />
    </Base>
  );
}

export function IconoMas(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Base>
  );
}

export function IconoMoneda(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9" />
      <path d="M14.5 9.5c-.6-.7-1.5-1-2.5-1-1.4 0-2.5.7-2.5 1.9 0 2.7 5 1.3 5 4 0 1.2-1.1 1.9-2.5 1.9-1 0-1.9-.3-2.5-1" />
    </Base>
  );
}
