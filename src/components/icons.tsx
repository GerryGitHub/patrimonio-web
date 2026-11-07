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

export function IconoInstitucion(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M3.5 20h17" />
      <path d="M5 20V9.5L12 5l7 4.5V20" />
      <path d="M9 20v-5h6v5" />
      <path d="M9.5 10h.01M14.5 10h.01M9.5 13h.01M14.5 13h.01" />
    </Base>
  );
}

export function IconoEditar(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z" />
      <path d="m13 6.5 4.5 4.5" />
    </Base>
  );
}

export function IconoPower(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 4v7" />
      <path d="M7.5 6.8a8 8 0 1 0 9 0" />
    </Base>
  );
}

export function IconoResumen(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </Base>
  );
}

export function IconoActivos(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h9A2.5 2.5 0 0 1 18 7.5V9" />
      <rect x="3.5" y="8.5" width="17" height="11" rx="2.5" />
      <path d="M16 14h2" />
      <path d="M3.5 12h17" />
    </Base>
  );
}

export function IconoLiquidez(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5c3.2 3.6 5.5 6.2 5.5 9a5.5 5.5 0 0 1-11 0c0-2.8 2.3-5.4 5.5-9Z" />
      <path d="M9.5 13.5c0 1.4 1.1 2.5 2.5 2.5" />
    </Base>
  );
}

export function IconoRentaFija(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h9l3 3V20.5H6V3.5Z" />
      <path d="M14.5 3.5v3.5H18" />
      <path d="M9 11h6" />
      <path d="M9 14h6" />
      <path d="M9 17h4" />
    </Base>
  );
}

export function IconoAcciones(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M7 16l3.5-4 3 2.5L20 7" />
      <path d="M17 7h3v3" />
    </Base>
  );
}

export function IconoCripto(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 8h4a2 2 0 0 1 0 4h-4V8Z" />
      <path d="M9.5 12h4.5a2 2 0 0 1 0 4H9.5v-4Z" />
      <path d="M11 6v2M11 16v2" />
    </Base>
  );
}

export function IconoInmueble(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
      <path d="M9 12h.01M15 12h.01" />
    </Base>
  );
}

export function IconoVehiculo(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m5 16-.5-4 1.8-4.2A2 2 0 0 1 8.1 6.5h7.8a2 2 0 0 1 1.8 1.3L19.5 12l-.5 4" />
      <path d="M4 16h16v3h-2v-1.5H6V19H4v-3Z" />
      <path d="M6.5 12h11" />
      <path d="M7 14h.01M17 14h.01" />
    </Base>
  );
}

export function IconoOtros(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 8.5 12 4l8 4.5V19H4V8.5Z" />
      <path d="M4 8.5 12 13l8-4.5" />
      <path d="M12 13v6" />
    </Base>
  );
}

export function IconoMercados(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.4 3.5 5.3 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.3-3.5-8.5S9.7 5.9 12 3.5Z" />
    </Base>
  );
}

export function IconoActividad(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h7" />
      <circle cx="18" cy="16.5" r="2.5" />
      <path d="M18 15.2v1.3l.9.6" />
    </Base>
  );
}

export function IconoFinanciamiento(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M7 15h4" />
      <path d="M15.5 14.5h.01" />
      <path d="M17.5 14.5h.01" />
    </Base>
  );
}

export function IconoConfiguracion(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Base>
  );
}

export function IconoMenu(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Base>
  );
}

export function IconoCerrar(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Base>
  );
}

export function IconoChevron(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function IconoCalendario(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5V6" />
      <path d="M16 3.5V6" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
    </Base>
  );
}

export function IconoTendencia(props: IconoProps) {
  return (
    <Base {...props}>
      <path d="m4 16 5-5 3.5 3.5L20 7" />
      <path d="M15 7h5v5" />
    </Base>
  );
}

export function IconoInfo(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Base>
  );
}

export function IconoBloqueado(props: IconoProps) {
  return (
    <Base {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2" />
    </Base>
  );
}

export function IconoUsuario(props: IconoProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Base>
  );
}
