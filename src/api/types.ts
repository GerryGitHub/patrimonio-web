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

export interface ClaseActivo {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface TipoInstrumento {
  id: string;
  claseActivoId: string;
  claseActivoNombre: string | null;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Instrumento {
  id: string;
  tipoInstrumentoId: string;
  tipoInstrumentoNombre: string;
  claseActivoId: string;
  claseActivoNombre: string;
  nombre: string;
  simbolo: string | null;
  emisor: string | null;
  mercado: string | null;
  monedaId: string;
  monedaCodigo: string;
  monedaNombre: string;
  monedaSimbolo: string | null;
  monedaDecimales: number;
  identificadorExterno: string | null;
  isin: string | null;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DatosInstrumento {
  tipoInstrumentoId: string;
  nombre: string;
  simbolo?: string;
  emisor?: string;
  mercado?: string;
  monedaId: string;
  identificadorExterno?: string;
  isin?: string;
  descripcion?: string;
}

export interface FiltrosInstrumentos {
  busqueda?: string;
  claseActivoId?: string;
  tipoInstrumentoId?: string;
  activo?: boolean;
}

export interface Posicion {
  id: string;
  cuentaId: string;
  cuentaNombre: string;
  instrumentoId: string;
  instrumentoNombre: string;
  instrumentoSimbolo: string | null;
  tipoInstrumentoId: string;
  tipoInstrumentoNombre: string;
  claseActivoId: string;
  claseActivoNombre: string;
  cantidad: string;
  costoUnitario: string;
  costoTotal: string;
  monedaId: string;
  monedaCodigo: string;
  monedaNombre: string;
  monedaSimbolo: string | null;
  monedaDecimales: number;
  observaciones: string | null;
  activo: boolean;
  fechaApertura: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearPosicionDatos {
  cuentaId: string;
  instrumentoId: string;
  cantidad: string;
  costoUnitario: string;
  fechaApertura?: string;
  observaciones?: string;
}

export interface ActualizarPosicionDatos {
  cantidad: string;
  costoUnitario: string;
  fechaApertura?: string;
  observaciones?: string;
}

export interface FiltrosPosiciones {
  cuentaId?: string;
  instrumentoId?: string;
  claseActivoId?: string;
  activo?: boolean;
}

export interface CostoPorMoneda {
  monedaId: string;
  codigo: string;
  nombre: string;
  simbolo: string | null;
  decimales: number;
  costo: string;
}

export interface DistribucionCategoria {
  claseActivoId: string;
  claseActivoNombre: string;
  posiciones: number;
  instrumentos: number;
  costoPorMoneda: CostoPorMoneda[];
}

export interface ResumenPosiciones {
  totalPosiciones: number;
  posicionesActivas: number;
  instrumentosDistintos: number;
  costoPorMoneda: CostoPorMoneda[];
  distribucionPorCategoria: DistribucionCategoria[];
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
