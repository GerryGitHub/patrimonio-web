import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion as iniciarSesionApi,
  obtenerSesion,
  registrarUsuario,
} from '../api/auth';
import type { RegistroDatos, Usuario } from '../api/types';

export type MotivoSesion = 'cerrada' | 'expirada';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  motivoSesion: MotivoSesion | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (datos: RegistroDatos) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
  marcarSesionExpirada: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Estado de autenticación de la aplicación.
 *
 * <p>Al montar, consulta `GET /api/auth/me` para recuperar la sesión de la
 * cookie HttpOnly. No lee ni escribe tokens en el almacenamiento del
 * navegador: el token CSRF vive en memoria dentro del servicio de auth.</p>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [motivoSesion, setMotivoSesion] = useState<MotivoSesion | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;

    obtenerSesion()
      .then((identidad) => {
        if (montado.current) {
          setUsuario(identidad);
        }
      })
      .catch(() => {
        if (montado.current) {
          setUsuario(null);
        }
      })
      .finally(() => {
        if (montado.current) {
          setCargando(false);
        }
      });

    return () => {
      montado.current = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const respuesta = await iniciarSesionApi(email, password);
    setUsuario(respuesta.usuario);
    setMotivoSesion(null);
  }, []);

  const registrar = useCallback(
    (datos: RegistroDatos) => registrarUsuario(datos),
    [],
  );

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionApi();
    } finally {
      setUsuario(null);
      setMotivoSesion('cerrada');
    }
  }, []);

  const marcarSesionExpirada = useCallback(() => {
    setUsuario(null);
    setMotivoSesion('expirada');
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario,
      cargando,
      motivoSesion,
      iniciarSesion,
      registrar,
      cerrarSesion,
      marcarSesionExpirada,
    }),
    [
      usuario,
      cargando,
      motivoSesion,
      iniciarSesion,
      registrar,
      cerrarSesion,
      marcarSesionExpirada,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return contexto;
}
