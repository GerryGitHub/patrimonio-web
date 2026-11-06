export interface Usuario {
  id: string;
  email: string;
  nombre: string;
}

export interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string | null;
  decimales: number;
}

export interface Portafolio {
  id: string;
  nombre: string;
  descripcion: string | null;
  monedaBaseId: string;
  monedaBase: Moneda;
  activo: boolean;
}

export interface CrearPortafolioDatos {
  nombre: string;
  descripcion?: string;
  monedaBaseId: string;
}

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  numeroCuenta: string | null;
  institucionId: string;
  tipoCuentaId: string;
  monedaId: string;
  activo: boolean;
  fechaApertura: string | null;
  fechaCierre: string | null;
}

export interface CsrfResponse {
  headerName: string;
  parameterName: string;
  token: string;
}

export interface LoginResponse {
  mecanismo: 'SESSION';
  usuario: Usuario;
  expiraEnSegundos: number;
  duracionMaximaSegundos: number;
  csrfToken: string;
}

export interface RegistroDatos {
  nombre: string;
  email: string;
  password: string;
}
