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

export type TipoInstitucion =
  | 'BANCO'
  | 'SOFIPO'
  | 'CASA_BOLSA'
  | 'EXCHANGE'
  | 'OTRA';

export interface Institucion {
  id: string;
  nombre: string;
  tipo: TipoInstitucion;
  pais: string | null;
  sitioWeb: string | null;
  activo: boolean;
}

export interface CrearInstitucionDatos {
  nombre: string;
  tipo: TipoInstitucion;
  pais?: string;
  sitioWeb?: string;
}

export interface TipoCuenta {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
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
  descripcion: string | null;
}

export interface DatosCuenta {
  institucionId: string;
  tipoCuentaId: string;
  monedaId: string;
  nombre: string;
  descripcion?: string;
  numeroCuenta?: string;
  fechaApertura?: string;
}

export type CrearCuentaDatos = DatosCuenta;
export type ActualizarCuentaDatos = DatosCuenta;

export interface FiltrosCuentas {
  institucionId?: string;
  tipoCuentaId?: string;
  activo?: boolean;
}

export interface FiltrosInstituciones {
  tipo?: TipoInstitucion;
  activo?: boolean;
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
