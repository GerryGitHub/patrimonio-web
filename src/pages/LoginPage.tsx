import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Alerta, Boton, Campo, CampoPassword } from '../components/ui';
import { mensajeDeError } from '../lib/errors';
import {
  tieneErrores,
  validarLogin,
  type ErroresLogin,
} from '../lib/validation';

interface EstadoNavegacion {
  desde?: string;
  registrado?: boolean;
  email?: string;
}

function destinoSeguro(desde?: string): string {
  if (!desde || !desde.startsWith('/') || desde.startsWith('//')) {
    return '/';
  }
  if (desde === '/login' || desde === '/registro') {
    return '/';
  }
  return desde;
}

export function LoginPage() {
  const { iniciarSesion, motivoSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state as EstadoNavegacion | null;

  const [email, setEmail] = useState(estado?.email ?? '');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aviso = estado?.registrado
    ? 'Tu cuenta se ha creado correctamente. Inicia sesión para continuar.'
    : motivoSesion === 'cerrada'
      ? 'Has cerrado sesión correctamente.'
      : motivoSesion === 'expirada'
        ? 'Tu sesión ha caducado. Inicia sesión de nuevo.'
        : null;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const validacion = validarLogin({ email, password });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    setEnviando(true);
    try {
      await iniciarSesion(email.trim().toLowerCase(), password);
      navigate(destinoSeguro(estado?.desde), { replace: true });
    } catch (error) {
      setErrorGeneral(mensajeDeError(error, 'login'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Inicia sesión"
      subtitulo="Accede a tus portafolios y cuentas."
    >
      {aviso ? <Alerta variante="exito">{aviso}</Alerta> : null}

      {errorGeneral ? (
        <Alerta variante="error">{errorGeneral}</Alerta>
      ) : null}

      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          error={errores.email}
          autoFocus
        />

        <CampoPassword
          etiqueta="Contraseña"
          name="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          error={errores.password}
        />

        <Boton type="submit" anchoCompleto cargando={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>

      <p className="auth__cambio">
        ¿Todavía no tienes cuenta?{' '}
        <Link to="/registro">Crear una cuenta</Link>
      </p>
    </AuthLayout>
  );
}
