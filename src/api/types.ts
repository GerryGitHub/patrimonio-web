export interface Usuario {
  id: string;
  email: string;
  nombre: string;
}

export interface Portafolio {
  id: string;
  nombre: string;
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
